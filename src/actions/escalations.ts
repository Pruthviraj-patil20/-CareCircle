"use server";

import prisma from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getEscalationRules(taskId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  return (prisma as any).taskEscalation.findMany({
    where: { taskId },
    orderBy: { afterMinutes: 'asc' },
  });
}

export async function addEscalationRule(taskId: string, afterMinutes: number, notifyUserId: string, channel: "EMAIL" | "IN_APP" | "BOTH") {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Validate task belongs to a family the user is in
  const task = await (prisma as any).task.findUnique({
    where: { id: taskId },
    select: { familyId: true, dueDate: true },
  });

  if (!task) throw new Error("Task not found");

  const newRule = await (prisma as any).taskEscalation.create({
    data: {
      taskId,
      afterMinutes,
      notifyUserId,
      channel,
    },
  });

  revalidatePath(`/dashboard/tasks/${taskId}`);
  return { success: true, rule: newRule };
}

export async function deleteEscalationRule(id: string, taskId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await (prisma as any).taskEscalation.delete({
    where: { id },
  });

  revalidatePath(`/dashboard/tasks/${taskId}`);
  return { success: true };
}

export async function getAuditLogs(taskId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  return (prisma as any).taskAuditLog.findMany({
    where: { taskId },
    orderBy: { createdAt: 'desc' },
  });
}
