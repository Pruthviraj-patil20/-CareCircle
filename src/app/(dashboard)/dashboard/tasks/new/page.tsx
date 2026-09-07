import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getFamilyMembers } from "@/actions/tasks";
import { getActiveFamilyId } from "@/actions/family";
import { TaskForm } from "@/components/tasks/TaskForm";

export default async function NewTaskPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const familyId = await getActiveFamilyId();
  if (!familyId) redirect("/dashboard/tasks");

  const members = await getFamilyMembers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Task</h1>
        <p className="text-muted-foreground mt-1">
          Add a new task for your family.
        </p>
      </div>
      <TaskForm members={members} />
    </div>
  );
}
