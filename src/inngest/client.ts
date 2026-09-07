import { Inngest } from "inngest";
import { EventTypeType } from "@/types/calendar";

// Define generic event types that we will send to Inngest
type DispatchNotificationEvent = {
  data: {
    userId: string;
    title: string;
    message: string;
    type: "TASK_ASSIGNED" | "TASK_DUE" | "TASK_OVERDUE" | "TASK_COMPLETED" | "ESCALATION" | "CALENDAR_REMINDER" | "DOCUMENT_EXPIRY" | "ANNOUNCEMENT" | "FAMILY_INVITATION";
    link?: string;
    metadata?: any;
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
    metadata?: any;
  };
};

// Initialize Inngest Client
export const inngest = new Inngest({
  id: "carecircle-app",
  schemas: {
    events: {
      "notification/dispatch": {} as DispatchNotificationEvent,
      "reminder/schedule": {} as ScheduleReminderEvent,
    },
  },
});
