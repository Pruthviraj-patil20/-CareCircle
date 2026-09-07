import { inngest } from "../client";
import prisma from "@/lib/db";

export const manageTaskEscalation = inngest.createFunction(
  { 
    id: "manage-task-escalation", 
    name: "Manage Task Escalation", 
    triggers: [{ event: "task/escalation.schedule" }],
    cancelOn: [
      {
        event: "task/escalation.cancel",
        match: "data.taskId",
      },
    ]
  },
  async ({ event, step }) => {
    const { taskId, dueDate } = event.data;

    if (!dueDate) return { skipped: "no_due_date" };

    // 1. Wait until the task is actually due
    await step.sleepUntil("wait-for-due-date", new Date(dueDate));

    // 2. Check initial status
    const initialCheck = await step.run("check-initial-status", async () => {
      const task = await (prisma as any).task.findUnique({ where: { id: taskId } });
      return task?.status;
    });

    if (!initialCheck || initialCheck === "COMPLETED" || initialCheck === "CANCELLED") {
      return { skipped: `task_${initialCheck?.toLowerCase()}` };
    }

    // 3. Fetch escalation rules for this task
    const rules = await step.run("fetch-escalation-rules", async () => {
      return (prisma as any).taskEscalation.findMany({
        where: { taskId },
        orderBy: { afterMinutes: 'asc' }
      });
    });

    if (rules.length === 0) return { completed: "no_rules" };

    let elapsedMinutes = 0;

    // 4. Loop through escalation steps dynamically
    for (const rule of rules) {
      // Calculate how long to sleep based on what has already elapsed
      const sleepTime = rule.afterMinutes - elapsedMinutes;
      
      if (sleepTime > 0) {
        // Sleep for the delta time
        await step.sleep(`sleep-for-escalation-${rule.id}`, `${sleepTime}m`);
        elapsedMinutes += sleepTime;
      }

      // Check task status again before notifying
      const currentStatus = await step.run(`check-status-${rule.id}`, async () => {
        const task = await (prisma as any).task.findUnique({ where: { id: taskId } });
        return { status: task?.status, title: task?.title, familyId: task?.familyId };
      });

      if (!currentStatus.status || currentStatus.status === "COMPLETED" || currentStatus.status === "CANCELLED") {
        return { completed: "task_completed_during_escalation" };
      }

      // Dispatch Notification
      const sendEmail = rule.channel === "EMAIL" || rule.channel === "BOTH";
      
      await step.sendEvent(`dispatch-notification-${rule.id}`, {
        name: "notification/dispatch",
        data: {
          userId: rule.notifyUserId,
          title: "Task Escalation Alert",
          message: `The task "${currentStatus.title}" is ${rule.afterMinutes} minutes overdue!`,
          type: "ESCALATION",
          link: `/dashboard/tasks/${taskId}`,
          sendEmail,
          familyId: currentStatus.familyId,
        }
      });

      // Log Audit Event
      await step.run(`log-audit-${rule.id}`, async () => {
        await (prisma as any).taskAuditLog.create({
          data: {
            taskId,
            action: "ESCALATED",
            details: `Escalated to user ${rule.notifyUserId} after ${rule.afterMinutes} minutes. Channel: ${rule.channel}`
          }
        });
      });
    }

    return { completed: "all_escalations_processed" };
  }
);
