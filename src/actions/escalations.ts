"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { AddEscalationRuleSchema } from "@/lib/validations";
import {
  authorizeAction,
  logAuditEvent,
  SecurityError,
} from "@/lib/security";

export async function getEscalationRules(taskId: string) {
  if (!taskId) throw new SecurityError("INVALID_ID", "Task ID is required", 400);

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { familyId: true },
  });
  if (!task) throw new SecurityError("NOT_FOUND", "Task not found", 404);

  await authorizeAction({
    familyId: task.familyId,
    actionName: "GET_ESCALATION_RULES",
  });

  return prisma.taskEscalation.findMany({
    where: { taskId },
    orderBy: { afterMinutes: "asc" },
  });
}

export async function addEscalationRule(
  taskId: string,
  afterMinutes: number,
  notifyUserId: string,
  channel: "EMAIL" | "IN_APP" | "BOTH"
) {
  const validated = AddEscalationRuleSchema.safeParse({
    taskId,
    afterMinutes,
    notifyUserId,
    channel,
  });

  if (!validated.success) {
    throw new SecurityError("INVALID_INPUT", validated.error.errors[0].message, 400);
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { familyId: true, dueDate: true, createdById: true, title: true },
  });

  if (!task) throw new SecurityError("NOT_FOUND", "Task not found", 404);

  const ctx = await authorizeAction({
    familyId: task.familyId,
    actionName: "ADD_ESCALATION_RULE",
  });

  // Check authorization: creator or Family OWNER/ADMIN
  const isManager = ctx.membership!.role === "OWNER" || ctx.membership!.role === "ADMIN";
  const isCreator = task.createdById === ctx.user.id;

  if (!isManager && !isCreator) {
    throw new SecurityError("FORBIDDEN", "Only task creator or family managers can configure escalation rules", 403);
  }

  // Cross-tenant protection: verify notifyUserId is a member of the same family
  const notifyMembership = await prisma.familyMember.findUnique({
    where: {
      familyId_userId: {
        familyId: task.familyId,
        userId: notifyUserId,
      },
    },
    include: { user: { select: { name: true, email: true } } },
  });

  if (!notifyMembership) {
    throw new SecurityError("CROSS_TENANT_ERROR", "The designated escalation recipient is not a member of this family", 400);
  }

  const newRule = await prisma.taskEscalation.create({
    data: {
      taskId,
      afterMinutes: validated.data.afterMinutes,
      notifyUserId: validated.data.notifyUserId,
      channel: validated.data.channel,
    },
  });

  await logAuditEvent({
    action: "TASK_ESCALATION_CREATED",
    entityType: "ESCALATION",
    familyId: task.familyId,
    userId: ctx.user.id,
    entityId: newRule.id,
    details: {
      taskId,
      taskTitle: task.title,
      afterMinutes: validated.data.afterMinutes,
      notifyUserName: notifyMembership.user.name,
      channel: validated.data.channel,
    },
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
  });

  revalidatePath(`/dashboard/tasks/${taskId}`);
  return { success: true, rule: newRule };
}

export async function deleteEscalationRule(id: string, taskId: string) {
  if (!id || !taskId) throw new SecurityError("INVALID_ID", "ID and Task ID are required", 400);

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { familyId: true, createdById: true, title: true },
  });
  if (!task) throw new SecurityError("NOT_FOUND", "Task not found", 404);

  const ctx = await authorizeAction({
    familyId: task.familyId,
    actionName: "DELETE_ESCALATION_RULE",
  });

  const isManager = ctx.membership!.role === "OWNER" || ctx.membership!.role === "ADMIN";
  const isCreator = task.createdById === ctx.user.id;

  if (!isManager && !isCreator) {
    throw new SecurityError("FORBIDDEN", "Only task creator or family managers can delete escalation rules", 403);
  }

  await prisma.taskEscalation.delete({
    where: { id },
  });

  await logAuditEvent({
    action: "TASK_ESCALATION_DELETED",
    entityType: "ESCALATION",
    familyId: task.familyId,
    userId: ctx.user.id,
    entityId: id,
    details: { taskId, taskTitle: task.title },
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
  });

  revalidatePath(`/dashboard/tasks/${taskId}`);
  return { success: true };
}

export async function getAuditLogs(taskId: string) {
  if (!taskId) throw new SecurityError("INVALID_ID", "Task ID is required", 400);

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { familyId: true },
  });
  if (!task) throw new SecurityError("NOT_FOUND", "Task not found", 404);

  await authorizeAction({
    familyId: task.familyId,
    actionName: "GET_TASK_AUDIT_LOGS",
  });

  return prisma.taskAuditLog.findMany({
    where: { taskId },
    orderBy: { createdAt: "desc" },
  });
}
