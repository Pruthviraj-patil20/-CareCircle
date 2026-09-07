import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { getTasks } from "@/actions/tasks";
import { getActiveFamilyId } from "@/actions/family";
import { TaskList } from "@/components/tasks/TaskList";
import { TaskFilters } from "@/components/tasks/TaskFilters";
import { Button } from "@/components/ui/button";
import { Plus, CheckSquare } from "lucide-react";
import { TaskStatusType, TaskPriorityType } from "@/types/task";
import { PageTransition } from "@/components/ui/page-transition";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata = {
  title: "Family Tasks | CareCircle",
  description: "Coordinate, assign, and track daily responsibilities and care tasks.",
};

function FiltersSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <Skeleton className="h-10 flex-1" />
      <Skeleton className="h-10 w-32" />
      <Skeleton className="h-10 w-32" />
    </div>
  );
}

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
      <EmptyState
        icon={CheckSquare}
        title="No Family Circle Selected"
        description="Please create or join a family circle from the sidebar to organize tasks."
      />
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
    <PageTransition className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CheckSquare className="w-7 h-7 text-primary" />
            Family Tasks
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Coordinate, assign, and track daily household care and responsibilities.
          </p>
        </div>
        <Link href="/dashboard/tasks/new">
          <Button size="sm" className="gap-2 shadow-sm">
            <Plus className="h-4 w-4" />
            New Task
          </Button>
        </Link>
      </div>

      <Suspense fallback={<FiltersSkeleton />}>
        <TaskFilters />
      </Suspense>

      <TaskList tasks={tasks} />
    </PageTransition>
  );
}
