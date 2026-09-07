"use server";

import prisma from "@/lib/db";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getActiveFamilyId } from "@/actions/family";
import {
  EmergencyCenterData,
  EmergencyContactItem,
  EmergencyContactTypeEnum,
  EmergencyInstructionItem,
} from "@/types/emergency";
import {
  authorizeAction,
  logAuditEvent,
  SecurityError,
} from "@/lib/security";
import {
  CreateEmergencyContactSchema,
  UpdateEmergencyContactSchema,
  CreateEmergencyInstructionSchema,
  UpdateEmergencyInstructionSchema,
} from "@/lib/validations";

export async function getEmergencyCenterData(): Promise<EmergencyCenterData> {
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

  const ctx = await authorizeAction({
    familyId,
    actionName: "GET_EMERGENCY_CENTER_DATA",
  });

  const isFamilyAdmin =
    ctx.membership!.role === "OWNER" || ctx.membership!.role === "ADMIN";

  const [familyMembersData, allContacts, instructions] = await Promise.all([
    prisma.familyMember.findMany({
      where: { familyId },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
      orderBy: { role: "asc" },
    }),
    prisma.emergencyContact.findMany({
      where: { familyId },
      orderBy: [{ isEmergencyService: "desc" }, { createdAt: "asc" }],
    }),
    prisma.emergencyInstruction.findMany({
      where: { familyId },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    }),
  ]);

  const familyMembers = familyMembersData.map((m) => ({
    id: m.user.id,
    name: m.user.name,
    email: m.user.email,
    image: m.user.image,
    role: m.role,
  }));

  // Server-side masking: non-admins NEVER receive plaintext sensitiveInfo or secret instructions
  const processedContacts: EmergencyContactItem[] = allContacts.map((c) => ({
    ...c,
    type: c.type as EmergencyContactTypeEnum,
    sensitiveInfo: isFamilyAdmin
      ? c.sensitiveInfo
      : c.sensitiveInfo
      ? "•••••••• (Admin restricted)"
      : null,
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
    (ins) => ({
      ...ins,
      category: ins.category as EmergencyInstructionItem["category"],
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

export async function createEmergencyContact(rawData: {
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
  const validated = CreateEmergencyContactSchema.safeParse(rawData);
  if (!validated.success) {
    throw new SecurityError("INVALID_INPUT", validated.error.errors[0].message, 400);
  }

  const familyId = await getActiveFamilyId();
  if (!familyId) throw new SecurityError("NO_ACTIVE_FAMILY", "No active family selected", 400);

  const ctx = await authorizeAction({
    familyId,
    actionName: "CREATE_EMERGENCY_CONTACT",
  });

  const isFamilyAdmin =
    ctx.membership!.role === "OWNER" || ctx.membership!.role === "ADMIN";

  // Non-admins cannot store sensitiveInfo directly
  const data = validated.data;
  const sensitiveInfo = isFamilyAdmin ? (data.sensitiveInfo || null) : null;

  const contact = await prisma.emergencyContact.create({
    data: {
      familyId,
      name: data.name,
      type: data.type,
      relationship: data.relationship || null,
      phone: data.phone,
      alternatePhone: data.alternatePhone || null,
      email: data.email || null,
      address: data.address || null,
      notes: data.notes || null,
      sensitiveInfo,
      isEmergencyService: Boolean(data.isEmergencyService),
      createdById: ctx.user.id,
    },
  });

  await logAuditEvent({
    action: "EMERGENCY_CONTACT_CREATED",
    entityType: "EMERGENCY",
    familyId,
    userId: ctx.user.id,
    entityId: contact.id,
    details: { name: data.name, type: data.type, phone: data.phone },
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
  });

  revalidatePath("/dashboard/emergency");
  return { success: true };
}

export async function updateEmergencyContact(
  id: string,
  rawData: {
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
  if (!id) throw new SecurityError("INVALID_ID", "Contact ID is required", 400);

  const validated = UpdateEmergencyContactSchema.safeParse(rawData);
  if (!validated.success) {
    throw new SecurityError("INVALID_INPUT", validated.error.errors[0].message, 400);
  }

  const contact = await prisma.emergencyContact.findUnique({
    where: { id },
  });
  if (!contact) throw new SecurityError("NOT_FOUND", "Emergency contact not found", 404);

  const ctx = await authorizeAction({
    familyId: contact.familyId,
    actionName: "UPDATE_EMERGENCY_CONTACT",
  });

  const isFamilyAdmin =
    ctx.membership!.role === "OWNER" || ctx.membership!.role === "ADMIN";
  const canManage = isFamilyAdmin || contact.createdById === ctx.user.id;

  if (!canManage) throw new SecurityError("FORBIDDEN", "Unauthorized to edit this contact", 403);

  const data = validated.data;
  const updatePayload: Prisma.EmergencyContactUpdateInput = {
    name: data.name,
    type: data.type,
    relationship: data.relationship || null,
    phone: data.phone,
    alternatePhone: data.alternatePhone || null,
    email: data.email || null,
    address: data.address || null,
    notes: data.notes || null,
    isEmergencyService: Boolean(data.isEmergencyService),
  };

  // Only family admins can modify sensitiveInfo
  if (isFamilyAdmin && data.sensitiveInfo !== undefined) {
    updatePayload.sensitiveInfo = data.sensitiveInfo || null;
  }

  await prisma.emergencyContact.update({
    where: { id },
    data: updatePayload,
  });

  await logAuditEvent({
    action: "EMERGENCY_CONTACT_UPDATED",
    entityType: "EMERGENCY",
    familyId: contact.familyId,
    userId: ctx.user.id,
    entityId: id,
    details: { name: data.name, type: data.type },
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
  });

  revalidatePath("/dashboard/emergency");
  return { success: true };
}

export async function deleteEmergencyContact(id: string) {
  if (!id) throw new SecurityError("INVALID_ID", "Contact ID is required", 400);

  const contact = await prisma.emergencyContact.findUnique({
    where: { id },
  });
  if (!contact) throw new SecurityError("NOT_FOUND", "Contact not found", 404);

  const ctx = await authorizeAction({
    familyId: contact.familyId,
    actionName: "DELETE_EMERGENCY_CONTACT",
  });

  const canManage =
    ctx.membership!.role === "OWNER" ||
    ctx.membership!.role === "ADMIN" ||
    contact.createdById === ctx.user.id;

  if (!canManage) throw new SecurityError("FORBIDDEN", "Unauthorized to delete this contact", 403);

  await prisma.emergencyContact.delete({
    where: { id },
  });

  await logAuditEvent({
    action: "EMERGENCY_CONTACT_DELETED",
    entityType: "EMERGENCY",
    familyId: contact.familyId,
    userId: ctx.user.id,
    entityId: id,
    details: { name: contact.name },
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
  });

  revalidatePath("/dashboard/emergency");
  return { success: true };
}

export async function createEmergencyInstruction(rawData: {
  title: string;
  category: "MEDICAL" | "HOME_SAFETY" | "EVACUATION" | "GENERAL";
  content: string;
  isSensitive?: boolean;
  priority?: number;
}) {
  const validated = CreateEmergencyInstructionSchema.safeParse(rawData);
  if (!validated.success) {
    throw new SecurityError("INVALID_INPUT", validated.error.errors[0].message, 400);
  }

  const familyId = await getActiveFamilyId();
  if (!familyId) throw new SecurityError("NO_ACTIVE_FAMILY", "No active family selected", 400);

  const ctx = await authorizeAction({
    familyId,
    actionName: "CREATE_EMERGENCY_INSTRUCTION",
  });

  const data = validated.data;
  const instruction = await prisma.emergencyInstruction.create({
    data: {
      familyId,
      title: data.title,
      category: data.category || "GENERAL",
      content: data.content,
      isSensitive: Boolean(data.isSensitive),
      priority: data.priority || 0,
      createdById: ctx.user.id,
    },
  });

  await logAuditEvent({
    action: "EMERGENCY_INSTRUCTION_CREATED",
    entityType: "EMERGENCY",
    familyId,
    userId: ctx.user.id,
    entityId: instruction.id,
    details: { title: data.title, category: data.category, isSensitive: data.isSensitive },
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
  });

  revalidatePath("/dashboard/emergency");
  return { success: true };
}

export async function updateEmergencyInstruction(
  id: string,
  rawData: {
    title: string;
    category: "MEDICAL" | "HOME_SAFETY" | "EVACUATION" | "GENERAL";
    content: string;
    isSensitive?: boolean;
    priority?: number;
  }
) {
  if (!id) throw new SecurityError("INVALID_ID", "Instruction ID is required", 400);

  const validated = UpdateEmergencyInstructionSchema.safeParse(rawData);
  if (!validated.success) {
    throw new SecurityError("INVALID_INPUT", validated.error.errors[0].message, 400);
  }

  const instruction = await prisma.emergencyInstruction.findUnique({
    where: { id },
  });
  if (!instruction) throw new SecurityError("NOT_FOUND", "Instruction not found", 404);

  const ctx = await authorizeAction({
    familyId: instruction.familyId,
    actionName: "UPDATE_EMERGENCY_INSTRUCTION",
  });

  const canManage =
    ctx.membership!.role === "OWNER" ||
    ctx.membership!.role === "ADMIN" ||
    instruction.createdById === ctx.user.id;

  if (!canManage) throw new SecurityError("FORBIDDEN", "Unauthorized to edit this instruction", 403);

  const data = validated.data;
  await prisma.emergencyInstruction.update({
    where: { id },
    data: {
      title: data.title,
      category: data.category,
      content: data.content,
      isSensitive: Boolean(data.isSensitive),
      priority: data.priority || 0,
    },
  });

  await logAuditEvent({
    action: "EMERGENCY_INSTRUCTION_UPDATED",
    entityType: "EMERGENCY",
    familyId: instruction.familyId,
    userId: ctx.user.id,
    entityId: id,
    details: { title: data.title, isSensitive: data.isSensitive },
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
  });

  revalidatePath("/dashboard/emergency");
  return { success: true };
}

export async function deleteEmergencyInstruction(id: string) {
  if (!id) throw new SecurityError("INVALID_ID", "Instruction ID is required", 400);

  const instruction = await prisma.emergencyInstruction.findUnique({
    where: { id },
  });
  if (!instruction) throw new SecurityError("NOT_FOUND", "Instruction not found", 404);

  const ctx = await authorizeAction({
    familyId: instruction.familyId,
    actionName: "DELETE_EMERGENCY_INSTRUCTION",
  });

  const canManage =
    ctx.membership!.role === "OWNER" ||
    ctx.membership!.role === "ADMIN" ||
    instruction.createdById === ctx.user.id;

  if (!canManage) throw new SecurityError("FORBIDDEN", "Unauthorized to delete this instruction", 403);

  await prisma.emergencyInstruction.delete({
    where: { id },
  });

  await logAuditEvent({
    action: "EMERGENCY_INSTRUCTION_DELETED",
    entityType: "EMERGENCY",
    familyId: instruction.familyId,
    userId: ctx.user.id,
    entityId: id,
    details: { title: instruction.title },
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
  });

  revalidatePath("/dashboard/emergency");
  return { success: true };
}
