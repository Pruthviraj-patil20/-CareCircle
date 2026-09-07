"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaskAssignment } from "./TaskAssignment";
import { createTask, updateTask } from "@/actions/tasks";
import { toast } from "sonner";
import { TaskWithAssignments } from "@/types/task";

type Member = { id: string; name: string | null; email: string | null; image: string | null };

interface TaskFormProps {
  members: Member[];
  task?: TaskWithAssignments;
}

export function TaskForm({ members, task }: TaskFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [assigneeIds, setAssigneeIds] = useState<string[]>(
    task?.assignments.map((a: { user: { id: string } }) => a.user.id) || []
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    // Clear and re-add assigneeIds since multi-select is custom
    formData.delete("assigneeIds");
    assigneeIds.forEach((id) => formData.append("assigneeIds", id));

    startTransition(async () => {
      try {
        const result = task
          ? await updateTask(task.id, formData)
          : await createTask(formData);

        if (result?.error) {
          toast.error(result.error);
        } else if (result?.success) {
          toast.success(result.success);
          router.push("/dashboard/tasks");
          router.refresh();
        }
      } catch (err) {
        toast.error((err as Error).message || "Something went wrong");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          name="title"
          defaultValue={task?.title || ""}
          placeholder="e.g., Buy groceries"
          required
          disabled={isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          name="description"
          defaultValue={task?.description || ""}
          placeholder="Add more details..."
          rows={4}
          disabled={isPending}
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select name="priority" defaultValue={task?.priority || "MEDIUM"} disabled={isPending}>
            <SelectTrigger>
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="URGENT">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {task && (
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select name="status" defaultValue={task.status} disabled={isPending}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="OVERDUE">Overdue</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="dueDate">Due Date</Label>
          <Input
            id="dueDate"
            name="dueDate"
            type="date"
            defaultValue={task?.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : ""}
            disabled={isPending}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Assign to</Label>
        <TaskAssignment
          members={members}
          selectedIds={assigneeIds}
          onChange={setAssigneeIds}
          disabled={isPending}
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? (task ? "Saving..." : "Creating...") : task ? "Save Changes" : "Create Task"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
