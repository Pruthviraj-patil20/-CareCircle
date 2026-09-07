import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { getTasks } from "@/actions/tasks";
import { getActiveFamilyId } from "@/actions/family";
import { TaskList } from "@/components/tasks/TaskList";
import { TaskFilters } from "@/components/tasks/TaskFilters";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { TaskStatusType, TaskPriorityType } from "@/types/task";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const familyId = await getActiveFamilyId();

  if (!familyId) {
    return (
      <div className="p-8 text-center bg-card rounded-lg border">
        <h2 className="text-2xl font-bold mb-2">No Family Selected</h2>
        <p className="text-muted-foreground">
          Please select or create a family from the sidebar to view tasks.
        </p>
      </div>
    );
  }

  const params = await searchParams;
  const tasks = await getTasks({
    search: params.search,
    status: params.status as TaskStatusType | undefined,
    priority: params.priority as TaskPriorityType | undefined,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track your family tasks.
          </p>
        </div>
        <Button render={<Link href="/dashboard/tasks/new" />}>
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </Button>
      </div>

      <Suspense fallback={<div>Loading filters...</div>}>
        <TaskFilters />
      </Suspense>

      <TaskList tasks={tasks} />
    </div>
  );
}
