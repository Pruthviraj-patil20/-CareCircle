import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getTask, getFamilyMembers } from "@/actions/tasks";
import { TaskDetailClient } from "@/components/tasks/TaskDetailClient";
import { getEscalationRules, getAuditLogs } from "@/actions/escalations";

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
  const escalationRules = await getEscalationRules(taskId);
  const auditLogs = await getAuditLogs(taskId);

  return (
    <TaskDetailClient 
      task={task} 
      members={members} 
      escalationRules={escalationRules} 
      auditLogs={auditLogs} 
    />
  );
}
