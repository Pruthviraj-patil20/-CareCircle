"use server";

import prisma from "@/lib/db";
import { FamilyRole } from "@prisma/client";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { canRemoveMember, canChangeRole } from "@/lib/permissions";
import {
  authorizeAction,
  logAuditEvent,
  SecurityError,
} from "@/lib/security";
import {
  CreateFamilySchema,
  UpdateFamilySchema,
  InviteMemberSchema,
  ChangeRoleSchema,
  RemoveMemberSchema,
} from "@/lib/validations";

export async function getActiveFamilyId() {
  const cookieStore = await cookies();
  return cookieStore.get("activeFamilyId")?.value;
}

export async function setActiveFamily(familyId: string) {
  await authorizeAction({
    familyId,
    actionName: "SET_ACTIVE_FAMILY",
  });

  const cookieStore = await cookies();
  cookieStore.set("activeFamilyId", familyId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  revalidatePath("/");
  
  return { success: true };
}

export async function createFamily(name: string, description?: string) {
  const validated = CreateFamilySchema.safeParse({ name, description });
  if (!validated.success) {
    throw new SecurityError("INVALID_INPUT", validated.error.errors[0].message, 400);
  }

  const ctx = await authorizeAction({
    actionName: "CREATE_FAMILY",
  });

  const family = await prisma.family.create({
    data: {
      name: validated.data.name,
      description: validated.data.description,
      members: {
        create: {
          userId: ctx.user.id,
          role: "OWNER",
        },
      },
    },
  });

  await logAuditEvent({
    action: "FAMILY_CREATED",
    entityType: "FAMILY",
    familyId: family.id,
    userId: ctx.user.id,
    entityId: family.id,
    details: { name: family.name },
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
  });

  await setActiveFamily(family.id);
  return { success: "Family created successfully!", familyId: family.id };
}

export async function updateFamily(familyId: string, name: string, description?: string) {
  const validated = UpdateFamilySchema.safeParse({ familyId, name, description });
  if (!validated.success) {
    throw new SecurityError("INVALID_INPUT", validated.error.errors[0].message, 400);
  }

  const ctx = await authorizeAction({
    familyId,
    requiredRoles: ["OWNER", "ADMIN"],
    actionName: "UPDATE_FAMILY",
  });

  const updatedFamily = await prisma.family.update({
    where: { id: familyId },
    data: {
      name: validated.data.name,
      description: validated.data.description,
    },
  });

  await logAuditEvent({
    action: "FAMILY_UPDATED",
    entityType: "FAMILY",
    familyId,
    userId: ctx.user.id,
    entityId: familyId,
    details: { name: updatedFamily.name },
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
  return { success: "Family updated successfully!" };
}

export async function inviteMember(familyId: string, email: string, role: FamilyRole) {
  const validated = InviteMemberSchema.safeParse({ familyId, email, role });
  if (!validated.success) {
    throw new SecurityError("INVALID_INPUT", validated.error.errors[0].message, 400);
  }

  const ctx = await authorizeAction({
    familyId,
    requiredRoles: ["OWNER", "ADMIN"],
    actionName: "INVITE_MEMBER",
  });

  // Strict Privilege Escalation Protection:
  // 1. OWNER cannot be invited directly
  if ((validated.data.role as string) === "OWNER") {
    throw new SecurityError("PRIVILEGE_ESCALATION", "Cannot invite a member as OWNER. Families have exactly one primary owner.", 403);
  }

  // 2. ADMIN cannot invite another ADMIN (only OWNER can appoint ADMINs)
  if (ctx.membership?.role === "ADMIN" && validated.data.role === "ADMIN") {
    throw new SecurityError("PRIVILEGE_ESCALATION", "Only the family Owner can invite administrators.", 403);
  }

  // Generate cryptographically secure token
  const token = Array.from(crypto.getRandomValues(new Uint8Array(36)))
    .map(b => b.toString(16).padStart(2, '0')).join('');

  await prisma.familyInvitation.upsert({
    where: {
      familyId_email: { familyId, email: validated.data.email },
    },
    update: {
      role: validated.data.role,
      token,
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days
    },
    create: {
      familyId,
      email: validated.data.email,
      role: validated.data.role,
      token,
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    },
  });

  await logAuditEvent({
    action: "FAMILY_INVITATION_SENT",
    entityType: "MEMBER",
    familyId,
    userId: ctx.user.id,
    details: { invitedEmail: validated.data.email, role: validated.data.role },
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
  });

  console.log(`[EMAIL_MOCK] Family invite link for ${validated.data.email}: http://localhost:3000/invite/${token}`);

  return { success: "Invitation sent!" };
}

export async function acceptInvitation(token: string) {
  if (!token || typeof token !== "string") {
    throw new SecurityError("INVALID_TOKEN", "Invitation token is required", 400);
  }

  const ctx = await authorizeAction({
    actionName: "ACCEPT_INVITATION",
  });

  const invitation = await prisma.familyInvitation.findUnique({
    where: { token },
  });

  if (!invitation) throw new SecurityError("INVALID_INVITATION", "Invalid or expired invitation link", 404);
  if (new Date() > invitation.expires) throw new SecurityError("EXPIRED_INVITATION", "This invitation has expired", 400);
  
  // Strictly enforce that the logged in user's email matches the invite email
  if (invitation.email.toLowerCase() !== ctx.user.email.toLowerCase()) {
    throw new SecurityError("EMAIL_MISMATCH", "This invitation was sent to a different email address", 403);
  }

  // Check if already a member
  const existingMembership = await prisma.familyMember.findUnique({
    where: {
      familyId_userId: {
        familyId: invitation.familyId,
        userId: ctx.user.id,
      },
    },
  });

  if (!existingMembership) {
    await prisma.familyMember.create({
      data: {
        familyId: invitation.familyId,
        userId: ctx.user.id,
        role: invitation.role,
      },
    });
  }

  // Delete consumed invitation
  await prisma.familyInvitation.delete({
    where: { id: invitation.id },
  });

  await logAuditEvent({
    action: "FAMILY_INVITATION_ACCEPTED",
    entityType: "MEMBER",
    familyId: invitation.familyId,
    userId: ctx.user.id,
    entityId: ctx.user.id,
    details: { role: invitation.role },
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
  });

  await setActiveFamily(invitation.familyId);
  return { success: "Joined family successfully!" };
}

export async function removeMember(familyId: string, targetUserId: string) {
  const validated = RemoveMemberSchema.safeParse({ familyId, targetUserId });
  if (!validated.success) {
    throw new SecurityError("INVALID_INPUT", validated.error.errors[0].message, 400);
  }

  const ctx = await authorizeAction({
    familyId,
    actionName: "REMOVE_MEMBER",
  });

  if (ctx.user.id === targetUserId) {
    throw new SecurityError("SELF_REMOVAL_FORBIDDEN", "You cannot remove yourself using this action. Please use Leave Family.", 400);
  }

  const targetMembership = await prisma.familyMember.findUnique({
    where: { familyId_userId: { familyId, userId: targetUserId } },
    include: { user: { select: { email: true, name: true } } },
  });

  if (!targetMembership) {
    throw new SecurityError("NOT_FOUND", "Target member not found in this family", 404);
  }

  // Privilege check
  if (!canRemoveMember(ctx.membership!.role, targetMembership.role)) {
    throw new SecurityError(
      "PRIVILEGE_VIOLATION",
      "You do not have sufficient permissions to remove this member",
      403
    );
  }

  await prisma.familyMember.delete({
    where: { id: targetMembership.id },
  });

  await logAuditEvent({
    action: "MEMBER_REMOVED",
    entityType: "MEMBER",
    familyId,
    userId: ctx.user.id,
    entityId: targetUserId,
    details: {
      removedUserName: targetMembership.user.name,
      removedUserEmail: targetMembership.user.email,
      role: targetMembership.role,
    },
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
  });

  revalidatePath("/dashboard/members");
  return { success: "Member removed!" };
}

export async function changeMemberRole(familyId: string, targetUserId: string, newRole: FamilyRole) {
  const validated = ChangeRoleSchema.safeParse({ familyId, targetUserId, newRole });
  if (!validated.success) {
    throw new SecurityError("INVALID_INPUT", validated.error.errors[0].message, 400);
  }

  const ctx = await authorizeAction({
    familyId,
    actionName: "CHANGE_MEMBER_ROLE",
  });

  const targetMembership = await prisma.familyMember.findUnique({
    where: { familyId_userId: { familyId, userId: targetUserId } },
    include: { user: { select: { email: true, name: true } } },
  });

  if (!targetMembership) {
    throw new SecurityError("NOT_FOUND", "Target member not found in this family", 404);
  }

  // Enforce role change hierarchy
  if (!canChangeRole(ctx.membership!.role, targetMembership.role, validated.data.newRole)) {
    throw new SecurityError(
      "PRIVILEGE_VIOLATION",
      "You do not have permission to change this member's role to the specified tier",
      403
    );
  }

  const previousRole = targetMembership.role;

  await prisma.familyMember.update({
    where: { id: targetMembership.id },
    data: { role: validated.data.newRole },
  });

  await logAuditEvent({
    action: "ROLE_CHANGED",
    entityType: "MEMBER",
    familyId,
    userId: ctx.user.id,
    entityId: targetUserId,
    details: {
      targetUserName: targetMembership.user.name,
      targetUserEmail: targetMembership.user.email,
      previousRole,
      newRole: validated.data.newRole,
    },
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
  });

  revalidatePath("/dashboard/members");
  return { success: "Role updated!" };
}
