"use server";

import prisma from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { getActiveFamilyId } from "@/actions/family";
import { CreateTaskSchema, UpdateTaskSchema } from "@/lib/validations";
import { Prisma } from "@prisma/client";
import { TaskStatusType, TaskPriorityType } from "@/types/task";

async function verifyFamilyMembership(familyId: string, userId: string) {
  const membership = await prisma.familyMember.findUnique({
    where: { familyId_userId: { familyId, userId } },
  });
  if (!membership) throw new Error("You are not a member of this family");
  return membership;
}

export async function getTasks(filters?: {
  search?: string;
  status?: TaskStatusType;
  priority?: TaskPriorityType;
  sortBy?: string;
  sortOrder?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const familyId = await getActiveFamilyId();
  if (!familyId) return [];

  await verifyFamilyMembership(familyId, session.user.id);

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
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

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

  if (!task) throw new Error("Task not found");
  await verifyFamilyMembership(task.familyId, session.user.id);

  return task;
}

export async function createTask(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const familyId = await getActiveFamilyId();
  if (!familyId) throw new Error("No family selected");

  await verifyFamilyMembership(familyId, session.user.id);

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

  const task = await (prisma as any).task.create({
    data: {
      title,
      description,
      priority: priority as TaskPriorityType,
      dueDate: dueDate ? new Date(dueDate) : null,
      familyId,
      createdById: session.user.id,
      assignments: assigneeIds?.length
        ? {
            create: assigneeIds.map((userId) => ({
              userId,
              assignedById: session.user.id!,
            })),
          }
        : undefined,
    },
  });

  revalidatePath("/dashboard/tasks");
  return { success: "Task created!", taskId: task.id };
}

export async function updateTask(taskId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const task = await (prisma as any).task.findUnique({ where: { id: taskId } });
  if (!task) throw new Error("Task not found");

  await verifyFamilyMembership(task.familyId, session.user.id);

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

  await (prisma as any).task.update({
    where: { id: taskId },
    data: updateData,
  });

  if (data.assigneeIds) {
    await (prisma as any).taskAssignment.deleteMany({ where: { taskId } });
    if (data.assigneeIds.length > 0) {
      await (prisma as any).taskAssignment.createMany({
        data: data.assigneeIds.map((userId) => ({
          taskId,
          userId,
          assignedById: session.user.id!,
        })),
      });
    }
  }

  revalidatePath("/dashboard/tasks");
  revalidatePath(`/dashboard/tasks/${taskId}`);
  return { success: "Task updated!" };
}

export async function deleteTask(taskId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const task = await (prisma as any).task.findUnique({ where: { id: taskId } });
  if (!task) throw new Error("Task not found");

  await verifyFamilyMembership(task.familyId, session.user.id);

  await (prisma as any).task.delete({ where: { id: taskId } });

  revalidatePath("/dashboard/tasks");
  return { success: "Task deleted!" };
}

export async function changeTaskStatus(taskId: string, status: TaskStatusType) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const task = await (prisma as any).task.findUnique({ where: { id: taskId } });
  if (!task) throw new Error("Task not found");

  await verifyFamilyMembership(task.familyId, session.user.id);

  await (prisma as any).task.update({
    where: { id: taskId },
    data: { status },
  });

  revalidatePath("/dashboard/tasks");
  revalidatePath(`/dashboard/tasks/${taskId}`);
  return { success: "Status updated!" };
}

export async function getFamilyMembers() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const familyId = await getActiveFamilyId();
  if (!familyId) return [];

  await verifyFamilyMembership(familyId, session.user.id);

  const members = await prisma.familyMember.findMany({
    where: { familyId },
    include: { user: { select: { id: true, name: true, email: true, image: true } } },
  });

  return members.map((m) => m.user);
}
