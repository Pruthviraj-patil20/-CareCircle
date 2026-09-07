import { inngest } from "../client";
import prisma from "@/lib/db";

export const scheduleReminder = inngest.createFunction(
  { id: "schedule-reminder", name: "Schedule Reminder", triggers: [{ event: "reminder/schedule" }] },
  async ({ event, step }) => {
    const { userId, title, message, type, remindAt, link, metadata } = event.data;

    // Wait until the reminder date
    await step.sleepUntil("wait-for-reminder", new Date(remindAt));

    // Dispatch the actual notification event
    await step.sendEvent("dispatch-notification", {
      name: "notification/dispatch",
      data: {
        userId,
        title,
        message,
        type,
        link,
        metadata,
        sendEmail: true,
      },
    });

    return { scheduled: true };
  }
);

// Cron job to run every hour to check for overdue tasks
export const checkOverdueTasks = inngest.createFunction(
  { id: "check-overdue-tasks", name: "Check Overdue Tasks", triggers: [{ cron: "0 * * * *" }] },
  async ({ step }) => {
    const overdueTasks = await step.run("find-overdue-tasks", async () => {
      const now = new Date();
      return prisma.task.findMany({
        where: {
          dueDate: { lt: now },
          status: { notIn: ["COMPLETED", "CANCELLED", "OVERDUE"] },
        },
        include: { assignments: true },
      });
    });

    if (overdueTasks.length === 0) return { updated: 0 };

    // Update statuses
    await step.run("update-task-statuses", async () => {
      const taskIds = overdueTasks.map((t) => t.id);
      await prisma.task.updateMany({
        where: { id: { in: taskIds } },
        data: { status: "OVERDUE" },
      });
    });

    // Send notifications to assignees
    const events = overdueTasks.flatMap((task) =>
      task.assignments.map((assignment) => ({
        name: "notification/dispatch",
        data: {
          userId: assignment.userId,
          title: "Task Overdue",
          message: `The task "${task.title}" is now overdue!`,
          type: "TASK_OVERDUE",
          link: `/dashboard/tasks/${task.id}`,
          sendEmail: true,
        },
      }))
    );

    if (events.length > 0) {
      await step.sendEvent("send-overdue-notifications", events);
    }

    return { updated: overdueTasks.length };
  }
);
