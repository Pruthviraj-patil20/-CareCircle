import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { redirect } from "next/navigation";
import { getActiveFamilyId } from "@/actions/family";
import { DashboardHomeClient } from "@/components/dashboard/DashboardHomeClient";

export const metadata = {
  title: "Dashboard Overview | CareCircle",
  description: "Family care coordination overview and active responsibilities.",
};

export default async function DashboardHome() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const familyId = await getActiveFamilyId();

  let familyName = "Family Circle";
  let metrics = {
    pendingTasks: 0,
    completedTasks: 0,
    upcomingEvents: 0,
    documentsCount: 0,
    urgentAnnouncements: 0,
  };
  let recentActivities: {
    id: string;
    title: string;
    type: "TASK" | "EVENT" | "DOCUMENT" | "ANNOUNCEMENT";
    updatedAt: Date;
    authorName: string | null;
    status?: string;
  }[] = [];

  if (familyId) {
    const [family, pendingTasks, completedTasks, upcomingEvents, docs, urgentAnnouncements, recentTasks] =
      await Promise.all([
        prisma.family.findUnique({ where: { id: familyId }, select: { name: true } }),
        prisma.task.count({
          where: { familyId, status: { in: ["PENDING", "IN_PROGRESS", "OVERDUE"] } },
        }),
        prisma.task.count({
          where: { familyId, status: "COMPLETED" },
        }),
        prisma.event.count({
          where: { familyId, startTime: { gte: new Date() } },
        }),
        prisma.document.count({
          where: { familyId },
        }),
        prisma.announcement.count({
          where: { familyId, priority: { in: ["URGENT", "IMPORTANT"] } },
        }),
        prisma.task.findMany({
          where: { familyId },
          orderBy: { updatedAt: "desc" },
          take: 5,
          include: { createdBy: { select: { name: true } } },
        }),
      ]);

    if (family) familyName = family.name;

    metrics = {
      pendingTasks,
      completedTasks,
      upcomingEvents,
      documentsCount: docs,
      urgentAnnouncements,
    };

    recentActivities = recentTasks.map((t) => ({
      id: t.id,
      title: t.title,
      type: "TASK" as const,
      updatedAt: t.updatedAt,
      authorName: t.createdBy?.name || null,
      status: t.status,
    }));
  }

  return (
    <DashboardHomeClient
      userName={session.user.name?.split(" ")[0] || "Friend"}
      familyName={familyName}
      metrics={metrics}
      recentActivities={recentActivities}
    />
  );
}
