import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getFamilyMembers } from "@/actions/tasks";
import { getActiveFamilyId } from "@/actions/family";
import { TaskForm } from "@/components/tasks/TaskForm";
import { PageTransition } from "@/components/ui/page-transition";
import { Card, CardContent } from "@/components/ui/card";
import { CheckSquare } from "lucide-react";

export default async function NewTaskPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const familyId = await getActiveFamilyId();
  if (!familyId) redirect("/dashboard/tasks");

  const members = await getFamilyMembers();

  return (
    <PageTransition>
      <div className="space-y-6 max-w-3xl mx-auto pb-12">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2.5">
            <CheckSquare className="h-7 w-7 text-primary" />
            Create Task
          </h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Add a new care task or responsibility for your family circle.
          </p>
        </div>

        <Card className="border border-border/70 shadow-xs">
          <CardContent className="p-6 sm:p-8">
            <TaskForm members={members} />
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}

