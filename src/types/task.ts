import { Task, TaskAssignment, User } from "@prisma/client";

export type TaskStatusType = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE" | "CANCELLED";
export type TaskPriorityType = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type TaskWithAssignments = Task & {
  createdBy: Pick<User, "id" | "name" | "email" | "image">;
  assignments: (TaskAssignment & {
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
