"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TaskWithAssignments } from "@/types/task";
import { TaskPriorityBadge } from "@/components/tasks/TaskPriorityBadge";
import { TaskForm } from "@/components/tasks/TaskForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { changeTaskStatus, deleteTask } from "@/actions/tasks";
import { toast } from "sonner";
// Force IDE refresh
import { TaskStatusType } from "@/types/task";
import { ArrowLeft, Calendar, Edit, Trash2, User as UserIcon } from "lucide-react";
import Link from "next/link";

const statusConfig: Record<TaskStatusType, { label: string; className: string }> = {
  PENDING: { label: "Pending", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  IN_PROGRESS: { label: "In Progress", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  COMPLETED: { label: "Completed", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  OVERDUE: { label: "Overdue", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
  CANCELLED: { label: "Cancelled", className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400" },
};

type Member = { id: string; name: string | null; email: string | null; image: string | null };

export function TaskDetailClient({
  task,
  members,
}: {
  task: TaskWithAssignments;
  members: Member[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleStatusChange = (status: TaskStatusType) => {
    startTransition(async () => {
      try {
        const result = await changeTaskStatus(task.id, status);
        if (result?.success) {
          toast.success(result.success);
          router.refresh();
        }
      } catch (err) {
        toast.error((err as Error).message);
      }
    });
  };

  const handleDelete = () => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    startTransition(async () => {
      try {
        const result = await deleteTask(task.id);
        if (result?.success) {
          toast.success(result.success);
          router.push("/dashboard/tasks");
        }
      } catch (err) {
        toast.error((err as Error).message);
      }
    });
  };

  if (editing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setEditing(false)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Edit Task</h1>
        </div>
        <TaskForm members={members} task={task} />
      </div>
    );
  }

  const status = statusConfig[task.status as TaskStatusType];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" render={<Link href="/dashboard/tasks" />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{task.title}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditing(true)} disabled={isPending}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" onClick={handleDelete} disabled={isPending} className="text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {task.description ? (
              <p className="text-sm whitespace-pre-wrap">{task.description}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">No description provided.</p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant="outline" className={status.className}>{status.label}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Priority</span>
                <TaskPriorityBadge priority={task.priority} />
              </div>
              {task.dueDate && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Due Date</span>
                  <div className="flex items-center gap-1.5 text-sm">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(task.dueDate).toLocaleDateString()}
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Created by</span>
                <span className="text-sm font-medium">{task.createdBy.name || task.createdBy.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Created</span>
                <span className="text-sm">{new Date(task.createdAt).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Quick Status</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              {(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as TaskStatusType[]).map((s) => (
                <Button
                  key={s}
                  variant={task.status === s ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleStatusChange(s)}
                  disabled={isPending || task.status === s}
                  className="text-xs"
                >
                  {statusConfig[s].label}
                </Button>
              ))}
            </CardContent>
          </Card>

          {task.assignments.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <UserIcon className="h-4 w-4" />
                  Assigned to
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {task.assignments.map((a: { id: string, user: { name: string | null, email: string | null } }) => (
                  <div key={a.id} className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {(a.user.name || a.user.email || "?").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{a.user.name || a.user.email}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
