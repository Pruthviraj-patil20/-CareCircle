"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getActiveFamilyId } from "@/actions/family";
import { CreateTaskSchema, UpdateTaskSchema } from "@/lib/validations";
import { TaskStatusType, TaskPriorityType } from "@/types/task";
import { inngest } from "@/inngest/client";
import {
  authorizeAction,
  logAuditEvent,
  SecurityError,
} from "@/lib/security";

export async function getTasks(filters?: {
  search?: string;
  status?: TaskStatusType;
  priority?: TaskPriorityType;
  sortBy?: string;
  sortOrder?: string;
}) {
  const familyId = await getActiveFamilyId();
  if (!familyId) return [];

  await authorizeAction({
    familyId,
    actionName: "GET_TASKS",
  });

  const where: any = { familyId };

  if (filters?.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
    ];
  }
  if (filters?.status) where.status = filters.status;
  if (filters?.priority) where.priority = filters.priority;

  const orderBy: any = {};
  const sortBy = filters?.sortBy || "createdAt";
  const sortOrder = (filters?.sortOrder || "desc") as "asc" | "desc";

  if (sortBy === "dueDate") orderBy.dueDate = sortOrder;
  else if (sortBy === "priority") orderBy.priority = sortOrder;
  else if (sortBy === "title") orderBy.title = sortOrder;
  else orderBy.createdAt = sortOrder;

  return (prisma as any).task.findMany({
    where,
    orderBy,
    include: {
      createdBy: { select: { id: true, name: true, email: true, image: true } },
      assignments: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      },
    },
  });
}

export async function getTask(taskId: string) {
  if (!taskId) throw new SecurityError("INVALID_ID", "Task ID is required", 400);

  const task = await (prisma as any).task.findUnique({
    where: { id: taskId },
    include: {
      createdBy: { select: { id: true, name: true, email: true, image: true } },
      assignments: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      },
    },
  });

  if (!task) throw new SecurityError("NOT_FOUND", "Task not found", 404);

  await authorizeAction({
    familyId: task.familyId,
    actionName: "GET_TASK",
  });

  return task;
}

export async function createTask(formData: FormData) {
  const familyId = await getActiveFamilyId();
  if (!familyId) throw new SecurityError("NO_ACTIVE_FAMILY", "No active family selected", 400);

  const ctx = await authorizeAction({
    familyId,
    actionName: "CREATE_TASK",
  });

  const rawData = {
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || undefined,
    priority: (formData.get("priority") as string) || "MEDIUM",
    dueDate: (formData.get("dueDate") as string) || undefined,
    assigneeIds: formData.getAll("assigneeIds") as string[],
  };

  const validated = CreateTaskSchema.safeParse(rawData);
  if (!validated.success) {
    return { error: validated.error.errors[0].message };
  }

  const { title, description, priority, dueDate, assigneeIds } = validated.data;

  // Cross-tenant protection: ensure all assignees belong to this specific family
  let validAssigneeIds: string[] = [];
  if (assigneeIds && assigneeIds.length > 0) {
    const verifiedMembers = await prisma.familyMember.findMany({
      where: {
        familyId,
        userId: { in: assigneeIds },
      },
      select: { userId: true },
    });
    validAssigneeIds = verifiedMembers.map((m) => m.userId);
  }

  const task = await (prisma as any).task.create({
    data: {
      title,
      description,
      priority: priority as TaskPriorityType,
      dueDate: dueDate ? new Date(dueDate) : null,
      familyId,
      createdById: ctx.user.id,
      assignments: validAssigneeIds.length
        ? {
            create: validAssigneeIds.map((userId: string) => ({
              userId,
              assignedById: ctx.user.id,
            })),
          }
        : undefined,
    },
  });

  await logAuditEvent({
    action: "TASK_CREATED",
    entityType: "TASK",
    familyId,
    userId: ctx.user.id,
    entityId: task.id,
    details: {
      title,
      priority,
      dueDate,
      assigneesCount: validAssigneeIds.length,
    },
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
  });

  if (validAssigneeIds.length > 0) {
    const events = validAssigneeIds.map((userId) => ({
      name: "notification/dispatch" as const,
      data: {
        userId,
        title: "New Task Assigned",
        message: `You have been assigned to the task: ${title}`,
        type: "TASK_ASSIGNED" as const,
        link: `/dashboard/tasks/${task.id}`,
        sendEmail: true,
        familyId,
      },
    }));
    await inngest.send(events);
  }

  if (dueDate) {
    await inngest.send({
      name: "reminder/schedule",
      data: {
        userId: ctx.user.id,
        title: "Task Due Soon",
        message: `The task "${title}" is due soon.`,
        type: "TASK_DUE",
        remindAt: new Date(new Date(dueDate).getTime() - 24 * 60 * 60 * 1000), // Remind 1 day before
        link: `/dashboard/tasks/${task.id}`,
      },
    });

    await inngest.send({
      name: "task/escalation.schedule" as const,
      data: {
        taskId: task.id,
        dueDate: dueDate,
      },
    });
  }

  revalidatePath("/dashboard/tasks");
  return { success: "Task created!", taskId: task.id };
}

export async function updateTask(taskId: string, formData: FormData) {
  if (!taskId) throw new SecurityError("INVALID_ID", "Task ID is required", 400);

  const task = await (prisma as any).task.findUnique({
    where: { id: taskId },
    include: { assignments: true },
  });
  if (!task) throw new SecurityError("NOT_FOUND", "Task not found", 404);

  const ctx = await authorizeAction({
    familyId: task.familyId,
    actionName: "UPDATE_TASK",
  });

  // Check authorization: creator, assigned user, or family manager (OWNER/ADMIN)
  const isManager = ctx.membership!.role === "OWNER" || ctx.membership!.role === "ADMIN";
  const isCreator = task.createdById === ctx.user.id;
  const isAssignee = task.assignments.some((a: any) => a.userId === ctx.user.id);

  if (!isManager && !isCreator && !isAssignee) {
    throw new SecurityError("FORBIDDEN_TASK_EDIT", "You do not have permission to modify this task", 403);
  }

  const rawData: Record<string, unknown> = {};
  const title = formData.get("title") as string | null;
  const description = formData.get("description") as string | null;
  const status = formData.get("status") as string | null;
  const priority = formData.get("priority") as string | null;
  const dueDate = formData.get("dueDate") as string | null;
  const assigneeIds = formData.getAll("assigneeIds") as string[];

  if (title) rawData.title = title;
  if (description !== null) rawData.description = description;
  if (status) rawData.status = status;
  if (priority) rawData.priority = priority;
  if (dueDate !== null) rawData.dueDate = dueDate || null;
  if (assigneeIds.length > 0) rawData.assigneeIds = assigneeIds;

  const validated = UpdateTaskSchema.safeParse(rawData);
  if (!validated.success) {
    return { error: validated.error.errors[0].message };
  }

  const data = validated.data;
  const updateData: any = {};
  if (data.title) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.status) updateData.status = data.status as TaskStatusType;
  if (data.priority) updateData.priority = data.priority as TaskPriorityType;
  if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;

  const prevStatus = task.status;

  await (prisma as any).task.update({
    where: { id: taskId },
    data: updateData,
  });

  // Cross-tenant protection: verify assignees belong to this family before updating
  if (data.assigneeIds) {
    const verifiedMembers = await prisma.familyMember.findMany({
      where: {
        familyId: task.familyId,
        userId: { in: data.assigneeIds },
      },
      select: { userId: true },
    });
    const validAssigneeIds = verifiedMembers.map((m) => m.userId);

    await (prisma as any).taskAssignment.deleteMany({ where: { taskId } });
    if (validAssigneeIds.length > 0) {
      await (prisma as any).taskAssignment.createMany({
        data: validAssigneeIds.map((userId) => ({
          taskId,
          userId,
          assignedById: ctx.user.id,
        })),
      });
    }
  }

  // Audit logging: update and completion
  if (data.status && data.status !== prevStatus) {
    if (data.status === "COMPLETED") {
      await logAuditEvent({
        action: "TASK_COMPLETED",
        entityType: "TASK",
        familyId: task.familyId,
        userId: ctx.user.id,
        entityId: taskId,
        details: { title: task.title, previousStatus: prevStatus },
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });
    } else {
      await logAuditEvent({
        action: "TASK_STATUS_CHANGED",
        entityType: "TASK",
        familyId: task.familyId,
        userId: ctx.user.id,
        entityId: taskId,
        details: { title: task.title, previousStatus: prevStatus, newStatus: data.status },
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });
    }
  } else {
    await logAuditEvent({
      action: "TASK_UPDATED",
      entityType: "TASK",
      familyId: task.familyId,
      userId: ctx.user.id,
      entityId: taskId,
      details: { title: data.title || task.title, changes: Object.keys(updateData) },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });
  }

  if (data.dueDate || data.status) {
    await inngest.send({
      name: "task/escalation.cancel" as const,
      data: { taskId },
    });

    if (data.dueDate && data.status !== "COMPLETED" && data.status !== "CANCELLED") {
      await inngest.send({
        name: "task/escalation.schedule" as const,
        data: { taskId, dueDate: data.dueDate },
      });
    }
  }

  revalidatePath("/dashboard/tasks");
  revalidatePath(`/dashboard/tasks/${taskId}`);
  return { success: "Task updated!" };
}

export async function deleteTask(taskId: string) {
  if (!taskId) throw new SecurityError("INVALID_ID", "Task ID is required", 400);

  const task = await (prisma as any).task.findUnique({ where: { id: taskId } });
  if (!task) throw new SecurityError("NOT_FOUND", "Task not found", 404);

  const ctx = await authorizeAction({
    familyId: task.familyId,
    actionName: "DELETE_TASK",
  });

  // Only creator or Family OWNER/ADMIN can delete tasks
  const isManager = ctx.membership!.role === "OWNER" || ctx.membership!.role === "ADMIN";
  const isCreator = task.createdById === ctx.user.id;

  if (!isManager && !isCreator) {
    throw new SecurityError("FORBIDDEN_TASK_DELETE", "Only the task creator or family managers can delete tasks", 403);
  }

  await (prisma as any).task.delete({ where: { id: taskId } });

  await logAuditEvent({
    action: "TASK_DELETED",
    entityType: "TASK",
    familyId: task.familyId,
    userId: ctx.user.id,
    entityId: taskId,
    details: { title: task.title },
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
  });

  revalidatePath("/dashboard/tasks");
  return { success: "Task deleted!" };
}

export async function changeTaskStatus(taskId: string, status: TaskStatusType) {
  if (!taskId) throw new SecurityError("INVALID_ID", "Task ID is required", 400);

  const task = await (prisma as any).task.findUnique({
    where: { id: taskId },
    include: { assignments: true },
  });
  if (!task) throw new SecurityError("NOT_FOUND", "Task not found", 404);

  const ctx = await authorizeAction({
    familyId: task.familyId,
    actionName: "CHANGE_TASK_STATUS",
  });

  const isManager = ctx.membership!.role === "OWNER" || ctx.membership!.role === "ADMIN";
  const isCreator = task.createdById === ctx.user.id;
  const isAssignee = task.assignments.some((a: any) => a.userId === ctx.user.id);

  if (!isManager && !isCreator && !isAssignee) {
    throw new SecurityError("FORBIDDEN_STATUS_CHANGE", "You are not authorized to change the status of this task", 403);
  }

  const prevStatus = task.status;

  await (prisma as any).task.update({
    where: { id: taskId },
    data: { status },
  });

  if (status === "COMPLETED") {
    await logAuditEvent({
      action: "TASK_COMPLETED",
      entityType: "TASK",
      familyId: task.familyId,
      userId: ctx.user.id,
      entityId: taskId,
      details: { title: task.title, previousStatus: prevStatus },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });
  } else {
    await logAuditEvent({
      action: "TASK_STATUS_CHANGED",
      entityType: "TASK",
      familyId: task.familyId,
      userId: ctx.user.id,
      entityId: taskId,
      details: { title: task.title, previousStatus: prevStatus, newStatus: status },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });
  }

  revalidatePath("/dashboard/tasks");
  revalidatePath(`/dashboard/tasks/${taskId}`);
  return { success: "Status updated!" };
}

export async function getFamilyMembers() {
  const familyId = await getActiveFamilyId();
  if (!familyId) return [];

  await authorizeAction({
    familyId,
    actionName: "GET_FAMILY_MEMBERS",
  });

  const members = await prisma.familyMember.findMany({
    where: { familyId },
    include: { user: { select: { id: true, name: true, email: true, image: true } } },
  });

  return members.map((m) => m.user);
}
