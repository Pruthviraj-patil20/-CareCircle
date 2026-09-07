import { Inngest } from "inngest";

// Define generic event types that we will send to Inngest
type DispatchNotificationEvent = {
  data: {
    userId: string;
    title: string;
    message: string;
    type: "TASK_ASSIGNED" | "TASK_DUE" | "TASK_OVERDUE" | "TASK_COMPLETED" | "ESCALATION" | "CALENDAR_REMINDER" | "DOCUMENT_EXPIRY" | "ANNOUNCEMENT" | "FAMILY_INVITATION";
    link?: string;
    metadata?: Record<string, unknown>;
    sendEmail?: boolean;
    familyId?: string;
  };
};

type ScheduleReminderEvent = {
  data: {
    userId: string;
    title: string;
    message: string;
    type: "TASK_DUE" | "CALENDAR_REMINDER";
    remindAt: Date;
    link?: string;
    metadata?: Record<string, unknown>;
  };
};

type TaskEscalationEvent = {
  data: {
    taskId: string;
    dueDate: string | Date;
  };
};

type TaskEscalationCancelEvent = {
  data: {
    taskId: string;
  };
};

// Initialize Inngest Client
export const inngest = new Inngest({
  id: "carecircle-app",
  schemas: {
    events: {
      "notification/dispatch": {} as DispatchNotificationEvent,
      "reminder/schedule": {} as ScheduleReminderEvent,
      "task/escalation.schedule": {} as TaskEscalationEvent,
      "task/escalation.cancel": {} as TaskEscalationCancelEvent,
    },
  },
});
