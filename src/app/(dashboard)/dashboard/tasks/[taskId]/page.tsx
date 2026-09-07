import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getTask, getFamilyMembers } from "@/actions/tasks";
import { TaskDetailClient } from "@/components/tasks/TaskDetailClient";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { taskId } = await params;

  let task;
  try {
    task = await getTask(taskId);
  } catch {
    redirect("/dashboard/tasks");
  }

  const members = await getFamilyMembers();

  return <TaskDetailClient task={task} members={members} />;
}
