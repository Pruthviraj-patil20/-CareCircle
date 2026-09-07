"use server";

import prisma from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { getActiveFamilyId } from "@/actions/family";
import {
  EmergencyCenterData,
  EmergencyContactItem,
  EmergencyContactTypeEnum,
  EmergencyInstructionItem,
} from "@/types/emergency";

async function verifyFamilyMembership(familyId: string, userId: string) {
  const membership = await prisma.familyMember.findUnique({
    where: { familyId_userId: { familyId, userId } },
  });
  if (!membership) throw new Error("You are not a member of this family");
  return membership;
}

export async function getEmergencyCenterData(): Promise<EmergencyCenterData> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const familyId = await getActiveFamilyId();
  if (!familyId) {
    return {
      familyMembers: [],
      emergencyServices: [],
      familyDoctors: [],
      insuranceContacts: [],
      personalContacts: [],
      instructions: [],
      isFamilyAdmin: false,
    };
  }

  const membership = await verifyFamilyMembership(familyId, session.user.id);
  const isFamilyAdmin =
    membership.role === "OWNER" || membership.role === "ADMIN";

  const [familyMembersData, allContacts, instructions] = await Promise.all([
    prisma.familyMember.findMany({
      where: { familyId },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
      orderBy: { role: "asc" },
    }),
    (prisma as any).emergencyContact.findMany({
      where: { familyId },
      orderBy: [{ isEmergencyService: "desc" }, { createdAt: "asc" }],
    }),
    (prisma as any).emergencyInstruction.findMany({
      where: { familyId },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    }),
  ]);

  // Format family members
  const familyMembers = familyMembersData.map((m) => ({
    id: m.user.id,
    name: m.user.name,
    email: m.user.email,
    image: m.user.image,
    role: m.role,
  }));

  // Mask sensitive information for non-admins
  const processedContacts: EmergencyContactItem[] = allContacts.map((c: any) => ({
    ...c,
    sensitiveInfo: isFamilyAdmin ? c.sensitiveInfo : (c.sensitiveInfo ? "•••••••• (Admin restricted)" : null),
  }));

  const emergencyServices = processedContacts.filter(
    (c) => c.isEmergencyService || c.type === "SERVICE"
  );
  const familyDoctors = processedContacts.filter(
    (c) => c.type === "FAMILY_DOCTOR" && !c.isEmergencyService
  );
  const insuranceContacts = processedContacts.filter(
    (c) => c.type === "INSURANCE" && !c.isEmergencyService
  );
  const personalContacts = processedContacts.filter(
    (c) =>
      (c.type === "PERSONAL" || c.type === "OTHER") && !c.isEmergencyService
  );

  const processedInstructions: EmergencyInstructionItem[] = instructions.map(
    (ins: any) => ({
      ...ins,
      content:
        ins.isSensitive && !isFamilyAdmin
          ? "🔒 This instruction contains sensitive information (e.g. security codes/medical records). Only Family Admins can view."
          : ins.content,
    })
  );

  return {
    familyMembers,
    emergencyServices,
    familyDoctors,
    insuranceContacts,
    personalContacts,
    instructions: processedInstructions,
    isFamilyAdmin,
  };
}

export async function createEmergencyContact(data: {
  name: string;
  type: EmergencyContactTypeEnum;
  relationship?: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  address?: string;
  notes?: string;
  sensitiveInfo?: string;
  isEmergencyService?: boolean;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const familyId = await getActiveFamilyId();
  if (!familyId) throw new Error("No active family selected");

  await verifyFamilyMembership(familyId, session.user.id);

  if (!data.name?.trim()) throw new Error("Contact name is required");
  if (!data.phone?.trim()) throw new Error("Phone number is required");

  await (prisma as any).emergencyContact.create({
    data: {
      familyId,
      name: data.name.trim(),
      type: data.type,
      relationship: data.relationship?.trim() || null,
      phone: data.phone.trim(),
      alternatePhone: data.alternatePhone?.trim() || null,
      email: data.email?.trim() || null,
      address: data.address?.trim() || null,
      notes: data.notes?.trim() || null,
      sensitiveInfo: data.sensitiveInfo?.trim() || null,
      isEmergencyService: Boolean(data.isEmergencyService),
      createdById: session.user.id,
    },
  });

  revalidatePath("/dashboard/emergency");
  return { success: true };
}

export async function updateEmergencyContact(
  id: string,
  data: {
    name: string;
    type: EmergencyContactTypeEnum;
    relationship?: string;
    phone: string;
    alternatePhone?: string;
    email?: string;
    address?: string;
    notes?: string;
    sensitiveInfo?: string;
    isEmergencyService?: boolean;
  }
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const contact = await (prisma as any).emergencyContact.findUnique({
    where: { id },
  });
  if (!contact) throw new Error("Contact not found");

  const membership = await verifyFamilyMembership(
    contact.familyId,
    session.user.id
  );
  const canManage =
    membership.role === "OWNER" ||
    membership.role === "ADMIN" ||
    contact.createdById === session.user.id;

  if (!canManage) throw new Error("Unauthorized to edit this contact");

  await (prisma as any).emergencyContact.update({
    where: { id },
    data: {
      name: data.name.trim(),
      type: data.type,
      relationship: data.relationship?.trim() || null,
      phone: data.phone.trim(),
      alternatePhone: data.alternatePhone?.trim() || null,
      email: data.email?.trim() || null,
      address: data.address?.trim() || null,
      notes: data.notes?.trim() || null,
      sensitiveInfo: data.sensitiveInfo !== undefined ? data.sensitiveInfo?.trim() || null : undefined,
      isEmergencyService: Boolean(data.isEmergencyService),
    },
  });

  revalidatePath("/dashboard/emergency");
  return { success: true };
}

export async function deleteEmergencyContact(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const contact = await (prisma as any).emergencyContact.findUnique({
    where: { id },
  });
  if (!contact) throw new Error("Contact not found");

  const membership = await verifyFamilyMembership(
    contact.familyId,
    session.user.id
  );
  const canManage =
    membership.role === "OWNER" ||
    membership.role === "ADMIN" ||
    contact.createdById === session.user.id;

  if (!canManage) throw new Error("Unauthorized to delete this contact");

  await (prisma as any).emergencyContact.delete({
    where: { id },
  });

  revalidatePath("/dashboard/emergency");
  return { success: true };
}

export async function createEmergencyInstruction(data: {
  title: string;
  category: "MEDICAL" | "HOME_SAFETY" | "EVACUATION" | "GENERAL";
  content: string;
  isSensitive?: boolean;
  priority?: number;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const familyId = await getActiveFamilyId();
  if (!familyId) throw new Error("No active family selected");

  await verifyFamilyMembership(familyId, session.user.id);

  if (!data.title?.trim()) throw new Error("Protocol title is required");
  if (!data.content?.trim()) throw new Error("Instructions content is required");

  await (prisma as any).emergencyInstruction.create({
    data: {
      familyId,
      title: data.title.trim(),
      category: data.category || "GENERAL",
      content: data.content.trim(),
      isSensitive: Boolean(data.isSensitive),
      priority: data.priority || 0,
      createdById: session.user.id,
    },
  });

  revalidatePath("/dashboard/emergency");
  return { success: true };
}

export async function updateEmergencyInstruction(
  id: string,
  data: {
    title: string;
    category: "MEDICAL" | "HOME_SAFETY" | "EVACUATION" | "GENERAL";
    content: string;
    isSensitive?: boolean;
    priority?: number;
  }
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const instruction = await (prisma as any).emergencyInstruction.findUnique({
    where: { id },
  });
  if (!instruction) throw new Error("Instruction not found");

  const membership = await verifyFamilyMembership(
    instruction.familyId,
    session.user.id
  );
  const canManage =
    membership.role === "OWNER" ||
    membership.role === "ADMIN" ||
    instruction.createdById === session.user.id;

  if (!canManage) throw new Error("Unauthorized to edit this instruction");

  await (prisma as any).emergencyInstruction.update({
    where: { id },
    data: {
      title: data.title.trim(),
      category: data.category,
      content: data.content.trim(),
      isSensitive: Boolean(data.isSensitive),
      priority: data.priority || 0,
    },
  });

  revalidatePath("/dashboard/emergency");
  return { success: true };
}

export async function deleteEmergencyInstruction(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const instruction = await (prisma as any).emergencyInstruction.findUnique({
    where: { id },
  });
  if (!instruction) throw new Error("Instruction not found");

  const membership = await verifyFamilyMembership(
    instruction.familyId,
    session.user.id
  );
  const canManage =
    membership.role === "OWNER" ||
    membership.role === "ADMIN" ||
    instruction.createdById === session.user.id;

  if (!canManage) throw new Error("Unauthorized to delete this instruction");

  await (prisma as any).emergencyInstruction.delete({
    where: { id },
  });

  revalidatePath("/dashboard/emergency");
  return { success: true };
}

export async function getSensitiveContactInfo(contactId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const contact = await (prisma as any).emergencyContact.findUnique({
    where: { id: contactId },
  });
  if (!contact) throw new Error("Contact not found");

  const membership = await verifyFamilyMembership(
    contact.familyId,
    session.user.id
  );
  if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
    throw new Error("Only Family Admins can reveal sensitive emergency details");
  }

  return { sensitiveInfo: contact.sensitiveInfo };
}
