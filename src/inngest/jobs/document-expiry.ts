import { inngest } from "../client";
import prisma from "@/lib/db";

export const checkDocumentExpiry = inngest.createFunction(
  {
    id: "check-document-expiry",
    name: "Check Document Expiry Reminders",
    triggers: [{ cron: "0 8 * * *" }], // Run daily at 8:00 AM
  },
  async ({ step }) => {
    // Step 1: Find expiring and expired documents
    const expiringDocuments = await step.run("find-expiring-documents", async () => {
      const now = new Date();
      const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      // Fetch documents expiring within the next 30 days or recently expired
      return (prisma as any).document.findMany({
        where: {
          expiryDate: {
            lte: in30Days,
          },
        },
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          family: {
            include: {
              members: {
                where: {
                  role: { in: ["OWNER", "ADMIN"] },
                },
                include: {
                  user: { select: { id: true, name: true, email: true } },
                },
              },
            },
          },
        },
      });
    });

    if (expiringDocuments.length === 0) {
      return { checked: 0, notificationsSent: 0 };
    }

    // Step 2: Build notifications for document uploaders and family admins
    const events = await step.run("prepare-notifications", async () => {
      const now = new Date();
      const notificationEvents: any[] = [];

      for (const doc of expiringDocuments) {
        if (!doc.expiryDate) continue;

        const expiryDate = new Date(doc.expiryDate);
        const diffDays = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        let message = "";
        let urgencyTitle = "";

        if (diffDays < 0) {
          urgencyTitle = "Document Expired";
          message = `Your ${doc.category.toLowerCase()} document "${doc.title}" expired on ${expiryDate.toLocaleDateString()}. Please update or renew it.`;
        } else if (diffDays === 0) {
          urgencyTitle = "Document Expires Today";
          message = `Your ${doc.category.toLowerCase()} document "${doc.title}" expires today (${expiryDate.toLocaleDateString()})!`;
        } else if (diffDays === 1) {
          urgencyTitle = "Document Expires Tomorrow";
          message = `Reminder: Your ${doc.category.toLowerCase()} document "${doc.title}" expires tomorrow.`;
        } else if (diffDays <= 7) {
          urgencyTitle = "Document Expiring Soon";
          message = `Your ${doc.category.toLowerCase()} document "${doc.title}" will expire in ${diffDays} days (${expiryDate.toLocaleDateString()}).`;
        } else if (diffDays === 30) {
          urgencyTitle = "Document Expiry Notice (30 Days)";
          message = `Your ${doc.category.toLowerCase()} document "${doc.title}" will expire in 30 days (${expiryDate.toLocaleDateString()}).`;
        } else {
          continue; // Only notify on milestones
        }

        // Notify document creator
        const recipients = new Set<string>();
        if (doc.createdById) {
          recipients.add(doc.createdById);
        }

        // Also notify family admins/owner
        for (const member of doc.family.members) {
          recipients.add(member.userId);
        }

        for (const userId of recipients) {
          notificationEvents.push({
            name: "notification/dispatch",
            data: {
              userId,
              title: urgencyTitle,
              message,
              type: "DOCUMENT_EXPIRY",
              link: `/dashboard/documents/${doc.id}`,
              metadata: {
                documentId: doc.id,
                category: doc.category,
                expiryDate: doc.expiryDate,
              },
              sendEmail: true,
              familyId: doc.familyId,
            },
          });
        }
      }

      return notificationEvents;
    });

    // Step 3: Dispatch notifications via Inngest
    if (events.length > 0) {
      await step.sendEvent("send-document-expiry-notifications", events);
    }

    return {
      checked: expiringDocuments.length,
      notificationsSent: events.length,
    };
  }
);
