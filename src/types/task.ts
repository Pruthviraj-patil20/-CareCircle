import { User } from "@prisma/client";

export type TaskStatusType = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE" | "CANCELLED";
export type TaskPriorityType = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

// Loose typing to bypass IDE caching issues
export type LooseTask = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatusType;
  priority: TaskPriorityType;
  dueDate: Date | null;
  familyId: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
};

export type LooseTaskAssignment = {
  id: string;
  taskId: string;
  userId: string;
  assignedById: string;
  assignedAt: Date;
};

export type TaskWithAssignments = LooseTask & {
  createdBy: Pick<User, "id" | "name" | "email" | "image">;
  assignments: (LooseTaskAssignment & {
    user: Pick<User, "id" | "name" | "email" | "image">;
  })[];
};

export type TaskFilterOptions = {
  search?: string;
  status?: TaskStatusType;
  priority?: TaskPriorityType;
  sortBy?: "dueDate" | "createdAt" | "priority" | "title";
  sortOrder?: "asc" | "desc";
};
