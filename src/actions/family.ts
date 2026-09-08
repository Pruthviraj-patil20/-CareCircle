"use server";

import prisma from "@/lib/db";
import { auth } from "@/lib/auth";
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
import { sendEmail } from "@/lib/resend";

export async function getActiveFamilyId() {
  const cookieStore = await cookies();
  const cookieFamilyId = cookieStore.get("activeFamilyId")?.value;
  if (cookieFamilyId) {
    return cookieFamilyId;
  }

  // Fallback to user's first family membership if activeFamilyId cookie is not set
  try {
    const session = await auth();
    if (session?.user?.id) {
      const firstMembership = await prisma.familyMember.findFirst({
        where: { userId: session.user.id },
        select: { familyId: true },
        orderBy: { createdAt: "asc" },
      });
      if (firstMembership?.familyId) {
        return firstMembership.familyId;
      }
    }
  } catch (err) {
    console.error("[getActiveFamilyId fallback error]", err);
  }

  return undefined;
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
  revalidatePath("/dashboard");
  revalidatePath("/dashboard", "layout");
  
  return { success: true };
}

export async function createFamily(name: string, description?: string) {
  try {
    const validated = CreateFamilySchema.safeParse({ name, description: description || undefined });
    if (!validated.success) {
      return { error: validated.error.errors[0].message };
    }

    const ctx = await authorizeAction({
      actionName: "CREATE_FAMILY",
    });

    const family = await prisma.family.create({
      data: {
        name: validated.data.name,
        description: validated.data.description || null,
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

    revalidatePath("/dashboard");
    revalidatePath("/dashboard", "layout");
    revalidatePath("/", "layout");

    return { success: "Family created successfully!", familyId: family.id };
  } catch (error) {
    console.error("[createFamily error]", error);
    return { error: error instanceof Error ? error.message : "Failed to create family" };
  }
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

  const family = await prisma.family.findUnique({
    where: { id: familyId },
    select: { name: true },
  });

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const inviteUrl = `${baseUrl}/invite/${token}`;

  const emailResult = await sendEmail({
    to: validated.data.email,
    subject: `You've been invited to join ${family?.name || "a family circle"} on CareCircle`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #ffffff;">
        <div style="margin-bottom: 24px;">
          <h1 style="color: #2563eb; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">CareCircle</h1>
          <p style="color: #6b7280; font-size: 14px; margin-top: 4px;">Family care & task coordination</p>
        </div>
        
        <h2 style="color: #111827; font-size: 20px; font-weight: 700; margin-bottom: 12px;">You're Invited!</h2>
        <p style="color: #374151; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
          <strong>${ctx.user.name || ctx.user.email}</strong> has invited you to join the <strong>${family?.name || "family circle"}</strong> on CareCircle as a <strong>${validated.data.role}</strong>.
        </p>

        <div style="margin: 32px 0;">
          <a href="${inviteUrl}" style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block;">
            Accept Invitation & Join Circle
          </a>
        </div>

        <p style="color: #6b7280; font-size: 13px; line-height: 1.6; margin-top: 24px;">
          Or copy and paste this link into your browser:<br/>
          <a href="${inviteUrl}" style="color: #2563eb; word-break: break-all;">${inviteUrl}</a>
        </p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 28px 0;" />
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
          This invitation link expires in 7 days. If you were not expecting this invitation, you can safely ignore this email.
        </p>
      </div>
    `,
  });

  console.log(`[Family Invite Link] For ${validated.data.email}: ${inviteUrl}`);

  revalidatePath("/dashboard/members");

  if (emailResult.success) {
    return { success: `Invitation email sent to ${validated.data.email}!`, token };
  } else {
    return {
      success: `Invitation created for ${validated.data.email}!`,
      token,
    };
  }
}

export async function resendInvitation(invitationId: string) {
  const ctx = await authorizeAction({
    actionName: "INVITE_MEMBER",
  });

  const invitation = await prisma.familyInvitation.findUnique({
    where: { id: invitationId },
    include: { family: { select: { name: true } } },
  });

  if (!invitation) {
    throw new SecurityError("NOT_FOUND", "Invitation not found", 404);
  }

  // Refresh expiration
  const token = Array.from(crypto.getRandomValues(new Uint8Array(36)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  await prisma.familyInvitation.update({
    where: { id: invitationId },
    data: {
      token,
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    },
  });

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const inviteUrl = `${baseUrl}/invite/${token}`;

  const emailResult = await sendEmail({
    to: invitation.email,
    subject: `Reminder: You've been invited to join ${invitation.family.name} on CareCircle`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #ffffff;">
        <div style="margin-bottom: 24px;">
          <h1 style="color: #2563eb; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">CareCircle</h1>
          <p style="color: #6b7280; font-size: 14px; margin-top: 4px;">Family care & task coordination</p>
        </div>
        
        <h2 style="color: #111827; font-size: 20px; font-weight: 700; margin-bottom: 12px;">Reminder: You're Invited!</h2>
        <p style="color: #374151; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
          <strong>${ctx.user.name || ctx.user.email}</strong> has invited you to join the <strong>${invitation.family.name}</strong> family circle on CareCircle as a <strong>${invitation.role}</strong>.
        </p>

        <div style="margin: 32px 0;">
          <a href="${inviteUrl}" style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block;">
            Accept Invitation & Join Circle
          </a>
        </div>

        <p style="color: #6b7280; font-size: 13px; line-height: 1.6; margin-top: 24px;">
          Or copy and paste this link into your browser:<br/>
          <a href="${inviteUrl}" style="color: #2563eb; word-break: break-all;">${inviteUrl}</a>
        </p>
      </div>
    `,
  });

  revalidatePath("/dashboard/members");

  if (emailResult.success) {
    return { success: `Invitation email re-sent to ${invitation.email}!`, token };
  } else {
    return {
      success: `Invitation refreshed for ${invitation.email}!`,
      token,
    };
  }
}

export async function getOrCreateShareInviteLink(familyId: string, role: FamilyRole = "MEMBER") {
  const ctx = await authorizeAction({
    familyId,
    requiredRoles: ["OWNER", "ADMIN"],
    actionName: "INVITE_MEMBER",
  });

  if ((role as string) === "OWNER") {
    throw new SecurityError("PRIVILEGE_ESCALATION", "Cannot create invite link as OWNER.", 403);
  }
  if (ctx.membership?.role === "ADMIN" && role === "ADMIN") {
    throw new SecurityError("PRIVILEGE_ESCALATION", "Only the family Owner can invite administrators.", 403);
  }

  const shareEmail = `link-invite-${role.toLowerCase()}@carecircle.internal`;

  const existing = await prisma.familyInvitation.findUnique({
    where: {
      familyId_email: { familyId, email: shareEmail },
    },
  });

  if (existing && existing.expires > new Date()) {
    return { token: existing.token };
  }

  const token = Array.from(crypto.getRandomValues(new Uint8Array(36)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const invitation = await prisma.familyInvitation.upsert({
    where: {
      familyId_email: { familyId, email: shareEmail },
    },
    update: {
      role,
      token,
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    },
    create: {
      familyId,
      email: shareEmail,
      role,
      token,
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    },
  });

  await logAuditEvent({
    action: "FAMILY_INVITATION_SENT",
    entityType: "MEMBER",
    familyId,
    userId: ctx.user.id,
    details: { invitedEmail: shareEmail, role, isShareLink: true },
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
  });

  return { token: invitation.token };
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
  
  const isShareLink = invitation.email.endsWith("@carecircle.internal");

  // Strictly enforce that the logged in user's email matches the invite email for direct email invites
  if (!isShareLink && invitation.email.toLowerCase() !== ctx.user.email.toLowerCase()) {
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

  // Delete consumed invitation only if not a shareable group link
  if (!isShareLink) {
    await prisma.familyInvitation.delete({
      where: { id: invitation.id },
    });
  }

  await logAuditEvent({
    action: "FAMILY_INVITATION_ACCEPTED",
    entityType: "MEMBER",
    familyId: invitation.familyId,
    userId: ctx.user.id,
    entityId: ctx.user.id,
    details: { role: invitation.role, isShareLink },
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

export async function clearAllFamilyData(
  familyId: string,
  options?: {
    clearTasks?: boolean;
    clearEvents?: boolean;
    clearDocuments?: boolean;
    clearAnnouncements?: boolean;
    clearEmergency?: boolean;
    clearNotifications?: boolean;
    clearAuditLogs?: boolean;
  }
) {
  const ctx = await authorizeAction({
    familyId,
    requiredRoles: ["OWNER", "ADMIN"],
    actionName: "CLEAR_FAMILY_DATA",
  });

  const clearAll = !options || Object.keys(options).length === 0;
  const doTasks = clearAll || options?.clearTasks !== false;
  const doEvents = clearAll || options?.clearEvents !== false;
  const doDocs = clearAll || options?.clearDocuments !== false;
  const doAnnouncements = clearAll || options?.clearAnnouncements !== false;
  const doEmergency = clearAll || options?.clearEmergency !== false;
  const doNotifications = clearAll || options?.clearNotifications !== false;
  const doAuditLogs = options?.clearAuditLogs === true;

  await prisma.$transaction(async (tx) => {
    if (doTasks) {
      await tx.task.deleteMany({ where: { familyId } });
    }
    if (doEvents) {
      await tx.event.deleteMany({ where: { familyId } });
    }
    if (doDocs) {
      await tx.document.deleteMany({ where: { familyId } });
    }
    if (doAnnouncements) {
      await tx.announcement.deleteMany({ where: { familyId } });
    }
    if (doEmergency) {
      await tx.emergencyContact.deleteMany({ where: { familyId } });
      await tx.emergencyInstruction.deleteMany({ where: { familyId } });
    }
    if (doNotifications) {
      const members = await tx.familyMember.findMany({
        where: { familyId },
        select: { userId: true },
      });
      const memberIds = members.map((m) => m.userId);
      if (memberIds.length > 0) {
        await tx.notification.deleteMany({
          where: { userId: { in: memberIds } },
        });
      }
    }
    if (doAuditLogs) {
      await tx.auditLog.deleteMany({ where: { familyId } });
    }
  });

  if (!doAuditLogs) {
    await logAuditEvent({
      action: "FAMILY_UPDATED",
      entityType: "FAMILY",
      familyId,
      userId: ctx.user.id,
      entityId: familyId,
      details: {
        action: "CLEAR_ALL_DATA",
        clearedTasks: doTasks,
        clearedEvents: doEvents,
        clearedDocuments: doDocs,
        clearedAnnouncements: doAnnouncements,
        clearedEmergency: doEmergency,
        clearedNotifications: doNotifications,
      },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard", "layout");
  revalidatePath("/dashboard/tasks");
  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard/documents");
  revalidatePath("/dashboard/announcements");
  revalidatePath("/dashboard/emergency");
  revalidatePath("/dashboard/notifications");
  revalidatePath("/dashboard/analytics");
  revalidatePath("/dashboard/settings");

  return { success: "All circle data has been reset to zero successfully!" };
}

