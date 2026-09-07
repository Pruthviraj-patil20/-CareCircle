"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TaskWithAssignments, TaskStatusType } from "@/types/task";
import { TaskPriorityBadge } from "@/components/tasks/TaskPriorityBadge";
import { TaskForm } from "@/components/tasks/TaskForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { changeTaskStatus, deleteTask } from "@/actions/tasks";
import { toast } from "sonner";
import { ArrowLeft, Calendar, Edit, Trash2, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { TaskEscalationManager, type TaskEscalation } from "@/components/tasks/TaskEscalationManager";
import { TaskAuditHistory, type TaskAuditLog } from "@/components/tasks/TaskAuditHistory";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PageTransition } from "@/components/ui/page-transition";
import { format } from "date-fns";

const statusConfig: Record<TaskStatusType, { label: string; className: string }> = {
  PENDING: {
    label: "Pending",
    className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20",
  },
  IN_PROGRESS: {
    label: "In Progress",
    className: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20",
  },
  COMPLETED: {
    label: "Completed",
    className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20",
  },
  OVERDUE: {
    label: "Overdue",
    className: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20 font-semibold",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-muted text-muted-foreground border border-border/80",
  },
};

type Member = { id: string; name: string | null; email: string | null; image: string | null };

export function TaskDetailClient({
  task,
  members,
  escalationRules,
  auditLogs,
}: {
  task: TaskWithAssignments;
  members: Member[];
  escalationRules: TaskEscalation[];
  auditLogs: TaskAuditLog[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleStatusChange = (status: TaskStatusType) => {
    startTransition(async () => {
      try {
        const result = await changeTaskStatus(task.id, status);
        if (result?.success) {
          toast.success(`Task status updated to ${status.toLowerCase()}`);
          router.refresh();
        }
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Failed to update status");
      }
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      try {
        const result = await deleteTask(task.id);
        if (result?.success) {
          toast.success("Task deleted successfully");
          router.push("/dashboard/tasks");
        }
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Failed to delete task");
        setShowDeleteConfirm(false);
      }
    });
  };

  if (editing) {
    return (
      <PageTransition className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon-sm" onClick={() => setEditing(false)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Edit Task</h1>
        </div>
        <TaskForm members={members} task={task} />
      </PageTransition>
    );
  }

  const status = statusConfig[task.status as TaskStatusType] || statusConfig.PENDING;

  return (
    <PageTransition className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/tasks">
            <Button variant="outline" size="icon-sm" className="rounded-xl">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground line-clamp-1">
              {task.title}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className={`text-[10px] py-0.5 px-2 ${status.className}`}>
                {status.label}
              </Badge>
              <TaskPriorityBadge priority={task.priority} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditing(true)}
            disabled={isPending}
            className="gap-1.5"
          >
            <Edit className="h-3.5 w-3.5" />
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isPending}
            className="gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Details */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border border-border/70 shadow-sm">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-base font-semibold">Description</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {task.description ? (
                <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground">
                  {task.description}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground italic">No detailed description provided.</p>
              )}
            </CardContent>
          </Card>

          {/* Quick Status Buttons */}
          <Card className="border border-border/70 shadow-sm">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-sm font-semibold">Update Task Status</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as TaskStatusType[]).map((s) => (
                  <Button
                    key={s}
                    variant={task.status === s ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleStatusChange(s)}
                    disabled={isPending || task.status === s}
                    className="text-xs capitalize"
                  >
                    {statusConfig[s].label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Escalation Rules */}
          <TaskEscalationManager
            taskId={task.id}
            members={members}
            initialRules={escalationRules}
            taskStatus={task.status}
          />

          {/* Audit History */}
          <TaskAuditHistory logs={auditLogs} />
        </div>

        {/* Sidebar Info */}
        <div className="space-y-5">
          <Card className="border border-border/70 shadow-sm">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-sm font-semibold">Task Metadata</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Due Date</span>
                {task.dueDate ? (
                  <div className="flex items-center gap-1.5 font-medium">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    {format(new Date(task.dueDate), "PPP")}
                  </div>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Created By</span>
                <span className="font-medium truncate max-w-[140px]">
                  {task.createdBy.name || task.createdBy.email}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Created At</span>
                <span className="text-muted-foreground">
                  {format(new Date(task.createdAt), "MMM d, yyyy")}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Assignees Card */}
          <Card className="border border-border/70 shadow-sm">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-primary" />
                Assignees
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2.5">
              {task.assignments.length === 0 ? (
                <p className="text-xs text-muted-foreground">No members assigned.</p>
              ) : (
                task.assignments.map((a) => (
                  <div key={a.id} className="flex items-center gap-2.5">
                    <Avatar className="h-7 w-7 border border-border">
                      {a.user.image && <AvatarImage src={a.user.image} alt={a.user.name || "User"} />}
                      <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                        {(a.user.name || a.user.email || "?").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium text-foreground">
                      {a.user.name || a.user.email}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Reusable Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Task"
        description="Are you sure you want to permanently remove this task? This action cannot be undone and will cancel all scheduled escalations."
        confirmLabel="Delete Task"
        variant="destructive"
        isLoading={isPending}
        onConfirm={handleDelete}
      />
    </PageTransition>
  );
}
