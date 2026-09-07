"use client";

import Link from "next/link";
import { TaskWithAssignments, TaskStatusType } from "@/types/task";
import { TaskPriorityBadge } from "./TaskPriorityBadge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, User, Clock, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

const statusConfig: Record<
  TaskStatusType,
  { label: string; className: string }
> = {
  PENDING: {
    label: "Pending",
    className:
      "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20",
  },
  IN_PROGRESS: {
    label: "In Progress",
    className:
      "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20",
  },
  COMPLETED: {
    label: "Completed",
    className:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20",
  },
  OVERDUE: {
    label: "Overdue",
    className:
      "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20 font-semibold",
  },
  CANCELLED: {
    label: "Cancelled",
    className:
      "bg-muted text-muted-foreground border border-border/80",
  },
};

export function TaskCard({ task }: { task: TaskWithAssignments }) {
  const status = statusConfig[task.status as TaskStatusType] || statusConfig.PENDING;
  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== "COMPLETED" &&
    task.status !== "CANCELLED";

  return (
    <Link href={`/dashboard/tasks/${task.id}`} className="block group outline-none">
      <Card className="hover:shadow-md hover:border-primary/40 transition-all duration-200 cursor-pointer h-full flex flex-col justify-between group-hover:-translate-y-0.5">
        <CardHeader className="pb-2.5">
          <div className="flex items-start justify-between gap-2.5">
            <h3 className="font-semibold text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2 text-foreground">
              {task.title}
            </h3>
            <TaskPriorityBadge priority={task.priority} />
          </div>
        </CardHeader>

        <CardContent className="pt-0 space-y-3 flex-1 flex flex-col justify-between">
          {task.description ? (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          ) : (
            <div className="flex-1" />
          )}

          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between gap-2">
              <Badge variant="outline" className={`text-[10px] py-0.5 px-2 ${status.className}`}>
                {status.label}
              </Badge>

              {task.dueDate && (
                <div
                  className={`flex items-center gap-1.5 text-[11px] ${
                    isOverdue ? "text-destructive font-medium" : "text-muted-foreground"
                  }`}
                >
                  <Calendar className="h-3 w-3" />
                  <span>{format(new Date(task.dueDate), "MMM d")}</span>
                </div>
              )}
            </div>

            {task.assignments.length > 0 && (
              <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[11px] text-muted-foreground">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground/80">
                  Assigned
                </span>
                <div className="flex items-center -space-x-1.5">
                  {task.assignments.slice(0, 3).map((a: any) => (
                    <Avatar key={a.id} className="h-5 w-5 border-2 border-card ring-1 ring-border/50">
                      {a.user.image && <AvatarImage src={a.user.image} alt={a.user.name || "User"} />}
                      <AvatarFallback className="text-[8px] font-bold bg-primary/10 text-primary">
                        {(a.user.name || a.user.email || "?").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {task.assignments.length > 3 && (
                    <span className="text-[10px] text-muted-foreground pl-1 font-semibold">
                      +{task.assignments.length - 3}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
