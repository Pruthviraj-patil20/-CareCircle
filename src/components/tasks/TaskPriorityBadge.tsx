import { TaskPriorityType } from "@/types/task";
import { Badge } from "@/components/ui/badge";

const priorityConfig: Record<TaskPriorityType, { label: string; className: string }> = {
  LOW: { label: "Low", className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
  MEDIUM: { label: "Medium", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  HIGH: { label: "High", className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  URGENT: { label: "Urgent", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

export function TaskPriorityBadge({ priority }: { priority: TaskPriorityType }) {
  const config = priorityConfig[priority];
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
