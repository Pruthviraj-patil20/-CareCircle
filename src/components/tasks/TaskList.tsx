import { TaskWithAssignments } from "@/types/task";
import { TaskCard } from "./TaskCard";
import { ClipboardList } from "lucide-react";

export function TaskList({ tasks }: { tasks: TaskWithAssignments[] }) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <ClipboardList className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold">No tasks found</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Create a new task or adjust your filters.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  );
}
