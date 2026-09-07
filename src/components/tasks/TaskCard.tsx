"use client";

import Link from "next/link";
import { TaskWithAssignments } from "@/types/task";
import { TaskPriorityBadge } from "./TaskPriorityBadge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, User } from "lucide-react";
import { TaskStatusType } from "@/types/task";

const statusConfig: Record<TaskStatusType, { label: string; className: string }> = {
  PENDING: { label: "Pending", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  IN_PROGRESS: { label: "In Progress", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  COMPLETED: { label: "Completed", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  OVERDUE: { label: "Overdue", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
  CANCELLED: { label: "Cancelled", className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400" },
};

export function TaskCard({ task }: { task: TaskWithAssignments }) {
  const status = statusConfig[task.status as TaskStatusType];
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "COMPLETED" && task.status !== "CANCELLED";

  return (
    <Link href={`/dashboard/tasks/${task.id}`}>
      <Card className="hover:shadow-md transition-all hover:border-primary/30 cursor-pointer group">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm leading-tight group-hover:text-primary transition-colors line-clamp-2">
              {task.title}
            </h3>
            <TaskPriorityBadge priority={task.priority} />
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {task.description}
            </p>
          )}
          <div className="flex items-center justify-between">
            <Badge variant="outline" className={status.className}>
              {status.label}
            </Badge>
            {task.dueDate && (
              <div className={`flex items-center gap-1 text-xs ${isOverdue ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                <Calendar className="h-3 w-3" />
                {new Date(task.dueDate).toLocaleDateString()}
              </div>
            )}
          </div>
          {task.assignments.length > 0 && (
            <div className="flex items-center gap-1">
              <User className="h-3 w-3 text-muted-foreground" />
              <div className="flex -space-x-2">
                {task.assignments.slice(0, 3).map((a: { id: string, user: { name: string | null, email: string | null } }) => (
                  <Avatar key={a.id} className="h-5 w-5 border-2 border-background">
                    <AvatarFallback className="text-[8px]">
                      {(a.user.name || a.user.email || "?").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {task.assignments.length > 3 && (
                  <span className="text-xs text-muted-foreground ml-2">
                    +{task.assignments.length - 3}
                  </span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
