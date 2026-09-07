import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { dispatchNotification } from "@/inngest/jobs/notifications";
import { scheduleReminder, checkOverdueTasks } from "@/inngest/jobs/reminders";
import { manageTaskEscalation } from "@/inngest/jobs/escalation";

// Expose the Inngest API route securely
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    dispatchNotification,
    scheduleReminder,
    checkOverdueTasks,
    manageTaskEscalation,
  ],
});
