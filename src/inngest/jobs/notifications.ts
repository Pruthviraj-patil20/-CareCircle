import { inngest } from "../client";
import prisma from "@/lib/db";
import { sendEmail } from "@/lib/resend";
// Removed NotificationType import to bypass IDE cache issues

export const dispatchNotification = inngest.createFunction(
  { id: "dispatch-notification", name: "Dispatch Notification", triggers: [{ event: "notification/dispatch" }] },
  async ({ event, step }) => {
    const { userId, title, message, type, link, metadata, sendEmail: shouldEmail, familyId } = event.data;

    // 1. Get user preferences and info
    const user = await step.run("get-user-preferences", async () => {
      const u = await (prisma as any).user.findUnique({
        where: { id: userId },
        include: { notificationPref: true },
      });
      
      if (!u) throw new Error(`User not found: ${userId}`);

      // If no preferences exist, default everything to true
      const prefs = u.notificationPref || {
        emailEnabled: true,
        inAppEnabled: true,
        tasks: true,
        calendar: true,
        documents: true,
        announcements: true,
      };

      return { email: u.email, name: u.name, prefs };
    });

    // 2. Check category preferences
    const isTask = type.startsWith("TASK_");
    const isCalendar = type === "CALENDAR_REMINDER";
    const isDoc = type === "DOCUMENT_EXPIRY";
    const isAnnouncement = type === "ANNOUNCEMENT";

    let categoryEnabled = true;
    if (isTask && !user.prefs.tasks) categoryEnabled = false;
    if (isCalendar && !user.prefs.calendar) categoryEnabled = false;
    if (isDoc && !user.prefs.documents) categoryEnabled = false;
    if (isAnnouncement && !user.prefs.announcements) categoryEnabled = false;

    if (!categoryEnabled) {
      return { skipped: "category_disabled" };
    }

    // 3. Create In-App Notification
    if (user.prefs.inAppEnabled) {
      await step.run("create-in-app-notification", async () => {
        await (prisma as any).notification.create({
          data: {
            userId,
            title,
            message,
            type: type as any,
            link,
            metadata: metadata || {},
          },
        });
      });
    }

    // 4. Send Email
    if (user.prefs.emailEnabled && shouldEmail && user.email) {
      await step.run("send-email", async () => {
        await sendEmail({
          to: user.email!,
          subject: title,
          html: `
            <div style="font-family: sans-serif; padding: 20px;">
              <h2>${title}</h2>
              <p>${message}</p>
              ${link ? `<a href="${process.env.NEXTAUTH_URL}${link}" style="display: inline-block; padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 5px;">View Details</a>` : ""}
            </div>
          `,
        });
      });
    }

    return { success: true };
  }
);
