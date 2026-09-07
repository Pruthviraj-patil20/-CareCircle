"use client";

import { TaskWithAssignments } from "@/types/task";
import { TaskCard } from "./TaskCard";
import { CheckSquare } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { StaggerContainer, StaggerItem } from "@/components/ui/page-transition";

export function TaskList({ tasks }: { tasks: TaskWithAssignments[] }) {
  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={CheckSquare}
        title="No tasks found"
        description="No responsibilities match your search or filter. You can assign a new task to any family member."
        actionLabel="Assign First Task"
        actionHref="/dashboard/tasks/new"
        className="my-6"
      />
    );
  }

  return (
    <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {tasks.map((task) => (
        <StaggerItem key={task.id}>
          <TaskCard task={task} />
        </StaggerItem>
      ))}
    </StaggerContainer>
  );
}
