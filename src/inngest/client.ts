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
  isDev: process.env.NODE_ENV === "development",
  schemas: {
    events: {
      "notification/dispatch": {} as DispatchNotificationEvent,
      "reminder/schedule": {} as ScheduleReminderEvent,
      "task/escalation.schedule": {} as TaskEscalationEvent,
      "task/escalation.cancel": {} as TaskEscalationCancelEvent,
    },
  },
});

// Fault-tolerant wrapper for inngest.send:
// If Inngest Cloud or Dev Server is unavailable (e.g. 401 Event key not found, or dev server not running),
// catch the error, write in-app notifications directly to the database as fallback, and allow the action to succeed.
const originalSend = inngest.send.bind(inngest);

type SendPayload = Parameters<typeof inngest.send>[0];

interface FallbackNotificationEvent {
  name?: string;
  data?: {
    userId?: string;
    title?: string;
    message?: string;
    type?: string;
    link?: string | null;
    metadata?: Record<string, unknown>;
  };
}

inngest.send = (async (payload: SendPayload) => {
  try {
    return await originalSend(payload);
  } catch (error: unknown) {
    const errObj = error as { status?: number; statusCode?: number; message?: string } | null;
    const errMsg = (errObj?.message || "").toLowerCase();
    const isAuthOrConnectionError =
      errObj?.status === 401 ||
      errObj?.statusCode === 401 ||
      errMsg.includes("401") ||
      errMsg.includes("event key") ||
      errMsg.includes("econnrefused") ||
      errMsg.includes("fetch failed") ||
      errMsg.includes("not sent to inngest") ||
      errMsg.includes("unauthorized");

    console.warn(
      `[Inngest] Background job event delivery bypassed (${errObj?.message || "service unavailable"}). Falling back to direct database notifications.`
    );

    if (isAuthOrConnectionError || process.env.NODE_ENV !== "production") {
      try {
        const rawEvents = Array.isArray(payload) ? payload : [payload];
        const eventsList = rawEvents as unknown as FallbackNotificationEvent[];
        const notificationEvents = eventsList.filter(
          (e) => e?.name === "notification/dispatch" && e?.data?.userId
        );

        if (notificationEvents.length > 0) {
          const { default: prisma } = await import("@/lib/db");
          for (const ev of notificationEvents) {
            const data = ev.data;
            if (!data?.userId) continue;
            await prisma.notification
              .create({
                data: {
                  userId: data.userId,
                  title: data.title || "New Notification",
                  message: data.message || "",
                  type: (data.type as "TASK_ASSIGNED") || "TASK_ASSIGNED",
                  link: data.link || null,
                  metadata: (data.metadata || {}) as Record<string, string>,
                },
              })
              .catch((dbErr) => {
                console.warn("[Inngest Fallback] Failed to create in-app notification:", dbErr);
              });
          }
        }
      } catch (fallbackErr) {
        console.warn("[Inngest Fallback] Notification creation fallback failed:", fallbackErr);
      }

      return { ids: [] } as Awaited<ReturnType<typeof inngest.send>>;
    }

    throw error;
  }
}) as typeof inngest.send;

