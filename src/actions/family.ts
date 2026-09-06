"use server";

import prisma from "@/lib/db";
import { auth } from "@/lib/auth";
import { FamilyRole } from "@prisma/client";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { canManageFamily, canInviteMembers, canRemoveMember, canChangeRole } from "@/lib/permissions";

export async function getActiveFamilyId() {
  const cookieStore = await cookies();
  return cookieStore.get("activeFamilyId")?.value;
}

export async function setActiveFamily(familyId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Verify the user is actually a member of this family
  const membership = await prisma.familyMember.findUnique({
    where: {
      familyId_userId: {
        familyId,
        userId: session.user.id,
      },
    },
  });

  if (!membership) throw new Error("You are not a member of this family");

  const cookieStore = await cookies();
  cookieStore.set("activeFamilyId", familyId, { path: "/", maxAge: 60 * 60 * 24 * 30 }); // 30 days
  revalidatePath("/");
  
  return { success: true };
}

export async function createFamily(name: string, description?: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const family = await prisma.family.create({
    data: {
      name,
      description,
      members: {
        create: {
          userId: session.user.id,
          role: "OWNER",
        },
      },
    },
  });

  await setActiveFamily(family.id);
  return { success: "Family created successfully!", familyId: family.id };
}

export async function updateFamily(familyId: string, name: string, description?: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const membership = await prisma.familyMember.findUnique({
    where: { familyId_userId: { familyId, userId: session.user.id } },
  });

  if (!membership || !canManageFamily(membership.role)) {
    throw new Error("Unauthorized");
  }

  await prisma.family.update({
    where: { id: familyId },
    data: { name, description },
  });

  revalidatePath("/dashboard");
  return { success: "Family updated successfully!" };
}

export async function inviteMember(familyId: string, email: string, role: FamilyRole) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const membership = await prisma.familyMember.findUnique({
    where: { familyId_userId: { familyId, userId: session.user.id } },
  });

  if (!membership || !canInviteMembers(membership.role)) {
    throw new Error("Unauthorized");
  }
  
  // Can't invite someone as an OWNER unless you are transferring ownership (not implemented)
  if (role === "OWNER") throw new Error("Cannot invite as OWNER");

  // Generate 48 char token
  const token = Array.from(crypto.getRandomValues(new Uint8Array(36)))
    .map(b => b.toString(16).padStart(2, '0')).join('');

  await prisma.familyInvitation.upsert({
    where: {
      familyId_email: { familyId, email },
    },
    update: {
      role,
      token,
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days
    },
    create: {
      familyId,
      email,
      role,
      token,
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    },
  });

  // MOCK EMAIL SENDING
  console.log(`[EMAIL_MOCK] Family invite link for ${email}: http://localhost:3000/invite/${token}`);

  return { success: "Invitation sent!" };
}

export async function acceptInvitation(token: string) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) throw new Error("Unauthorized");

  const invitation = await prisma.familyInvitation.findUnique({
    where: { token },
  });

  if (!invitation) throw new Error("Invalid or expired invitation");
  if (new Date() > invitation.expires) throw new Error("Invitation expired");
  
  // We strictly enforce that the logged in user's email matches the invite email
  if (invitation.email !== session.user.email) {
    throw new Error("This invitation was sent to a different email address");
  }

  // Create membership
  await prisma.familyMember.create({
    data: {
      familyId: invitation.familyId,
      userId: session.user.id,
      role: invitation.role,
    },
  });

  // Delete invitation
  await prisma.familyInvitation.delete({
    where: { id: invitation.id },
  });

  await setActiveFamily(invitation.familyId);
  return { success: "Joined family successfully!" };
}

export async function removeMember(familyId: string, targetUserId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  if (session.user.id === targetUserId) {
    throw new Error("You cannot remove yourself. Use leave family instead.");
  }

  const currentUserMembership = await prisma.familyMember.findUnique({
    where: { familyId_userId: { familyId, userId: session.user.id } },
  });

  const targetUserMembership = await prisma.familyMember.findUnique({
    where: { familyId_userId: { familyId, userId: targetUserId } },
  });

  if (!currentUserMembership || !targetUserMembership) {
    throw new Error("Membership not found");
  }

  if (!canRemoveMember(currentUserMembership.role, targetUserMembership.role)) {
    throw new Error("You do not have permission to remove this member");
  }

  await prisma.familyMember.delete({
    where: { id: targetUserMembership.id },
  });

  revalidatePath("/dashboard/members");
  return { success: "Member removed!" };
}

export async function changeMemberRole(familyId: string, targetUserId: string, newRole: FamilyRole) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const currentUserMembership = await prisma.familyMember.findUnique({
    where: { familyId_userId: { familyId, userId: session.user.id } },
  });

  const targetUserMembership = await prisma.familyMember.findUnique({
    where: { familyId_userId: { familyId, userId: targetUserId } },
  });

  if (!currentUserMembership || !targetUserMembership) {
    throw new Error("Membership not found");
  }

  if (!canChangeRole(currentUserMembership.role, targetUserMembership.role, newRole)) {
    throw new Error("You do not have permission to change this role");
  }

  await prisma.familyMember.update({
    where: { id: targetUserMembership.id },
    data: { role: newRole },
  });

  revalidatePath("/dashboard/members");
  return { success: "Role updated!" };
}
