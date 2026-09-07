"use server";

import prisma from "@/lib/db";
import { auth } from "@/lib/auth";
import { getActiveFamilyId } from "@/actions/family";
import {
  FamilyAnalyticsData,
  MemberWorkloadData,
  WeeklyActivityData,
  MonthlyActivityData,
  PriorityDistributionData,
  SupportOpportunity,
} from "@/types/analytics";
import {
  subDays,
  subMonths,
  format,
  isSameDay,
  isSameMonth,
  isPast,
} from "date-fns";

export async function getFamilyAnalyticsData(): Promise<FamilyAnalyticsData> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const familyId = await getActiveFamilyId();
  if (!familyId) {
    return {
      summary: {
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        overdueTasks: 0,
        completionRate: 0,
      },
      memberWorkloads: [],
      weeklyActivity: [],
      monthlyActivity: [],
      priorityDistribution: [],
      supportOpportunities: [],
      hasAnyData: false,
    };
  }

  // Verify user is a member of this family
  const membership = await prisma.familyMember.findUnique({
    where: { familyId_userId: { familyId, userId: session.user.id } },
  });
  if (!membership) throw new Error("Unauthorized for this family");

  const now = new Date();

  // Fetch all tasks and members
  const [tasks, members] = await Promise.all([
    (prisma as any).task.findMany({
      where: { familyId },
      include: {
        assignments: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.familyMember.findMany({
      where: { familyId },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
      orderBy: { role: "asc" },
    }),
  ]);

  if (tasks.length === 0) {
    return {
      summary: {
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        overdueTasks: 0,
        completionRate: 0,
      },
      memberWorkloads: members.map((m) => ({
        userId: m.user.id,
        name: m.user.name || m.user.email || "Member",
        email: m.user.email,
        image: m.user.image,
        role: m.role,
        completed: 0,
        inProgress: 0,
        overdue: 0,
        totalAssigned: 0,
      })),
      weeklyActivity: [],
      monthlyActivity: [],
      priorityDistribution: [],
      supportOpportunities: [],
      hasAnyData: false,
    };
  }

  // 1. Summary Metrics
  const nonCancelledTasks = tasks.filter((t: any) => t.status !== "CANCELLED");
  const completedTasks = tasks.filter((t: any) => t.status === "COMPLETED").length;
  
  // Overdue check: explicit OVERDUE status OR (dueDate < now and not completed/cancelled)
  const overdueTasks = tasks.filter((t: any) => {
    if (t.status === "OVERDUE") return true;
    if (t.dueDate && isPast(new Date(t.dueDate)) && t.status !== "COMPLETED" && t.status !== "CANCELLED") {
      return true;
    }
    return false;
  }).length;

  const pendingTasks = tasks.filter(
    (t: any) => t.status === "PENDING" || t.status === "IN_PROGRESS"
  ).length;

  const totalTasks = nonCancelledTasks.length;
  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // 2. Member Workload Data
  const memberWorkloads: MemberWorkloadData[] = members.map((m) => {
    const assignedTasks = tasks.filter((t: any) =>
      t.assignments.some((a: any) => a.userId === m.userId)
    );

    const mCompleted = assignedTasks.filter(
      (t: any) => t.status === "COMPLETED"
    ).length;

    const mOverdue = assignedTasks.filter((t: any) => {
      if (t.status === "OVERDUE") return true;
      if (t.dueDate && isPast(new Date(t.dueDate)) && t.status !== "COMPLETED" && t.status !== "CANCELLED") {
        return true;
      }
      return false;
    }).length;

    const mInProgress = assignedTasks.filter(
      (t: any) => (t.status === "PENDING" || t.status === "IN_PROGRESS") && !(t.dueDate && isPast(new Date(t.dueDate)))
    ).length;

    return {
      userId: m.user.id,
      name: m.user.name || m.user.email || "Member",
      email: m.user.email,
      image: m.user.image,
      role: m.role,
      completed: mCompleted,
      inProgress: mInProgress,
      overdue: mOverdue,
      totalAssigned: assignedTasks.length,
    };
  });

  // Sort by total assigned tasks
  memberWorkloads.sort((a, b) => b.totalAssigned - a.totalAssigned);

  // 3. "Who Needs Help?" Support Opportunities (Collaborative Framing)
  const supportOpportunities: SupportOpportunity[] = [];
  memberWorkloads.forEach((mw) => {
    if (mw.overdue > 0) {
      supportOpportunities.push({
        userId: mw.userId,
        name: mw.name,
        image: mw.image,
        role: mw.role,
        overdueCount: mw.overdue,
        inProgressCount: mw.inProgress,
        message: `${mw.name} has ${mw.overdue} ${
          mw.overdue === 1 ? "task" : "tasks"
        } past due. Jump in to offer a hand!`,
      });
    } else if (mw.inProgress >= 3) {
      supportOpportunities.push({
        userId: mw.userId,
        name: mw.name,
        image: mw.image,
        role: mw.role,
        overdueCount: 0,
        inProgressCount: mw.inProgress,
        message: `${mw.name} is balancing ${mw.inProgress} active responsibilities. Consider taking one over!`,
      });
    }
  });

  // 4. Weekly Activity (Last 7 Days)
  const weeklyActivity: WeeklyActivityData[] = [];
  for (let i = 6; i >= 0; i--) {
    const targetDate = subDays(now, i);
    const dayName = format(targetDate, "EEE");
    const fullDate = format(targetDate, "MMM d");

    const created = tasks.filter((t: any) =>
      isSameDay(new Date(t.createdAt), targetDate)
    ).length;

    const completed = tasks.filter(
      (t: any) =>
        t.status === "COMPLETED" && isSameDay(new Date(t.updatedAt), targetDate)
    ).length;

    weeklyActivity.push({
      day: dayName,
      fullDate,
      created,
      completed,
    });
  }

  // 5. Monthly Activity (Last 6 Months)
  const monthlyActivity: MonthlyActivityData[] = [];
  for (let i = 5; i >= 0; i--) {
    const targetMonth = subMonths(now, i);
    const monthName = format(targetMonth, "MMM");

    const created = tasks.filter((t: any) =>
      isSameMonth(new Date(t.createdAt), targetMonth)
    ).length;

    const completed = tasks.filter(
      (t: any) =>
        t.status === "COMPLETED" &&
        isSameMonth(new Date(t.updatedAt), targetMonth)
    ).length;

    monthlyActivity.push({
      month: monthName,
      created,
      completed,
    });
  }

  // 6. Priority Distribution
  const priorityCounts: Record<string, number> = {
    URGENT: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
  };

  tasks.forEach((t: any) => {
    if (t.status !== "CANCELLED" && priorityCounts[t.priority] !== undefined) {
      priorityCounts[t.priority]++;
    }
  });

  const priorityDistribution: PriorityDistributionData[] = [
    { name: "Urgent", value: priorityCounts.URGENT, color: "#ef4444" },
    { name: "High", value: priorityCounts.HIGH, color: "#f97316" },
    { name: "Medium", value: priorityCounts.MEDIUM, color: "#3b82f6" },
    { name: "Low", value: priorityCounts.LOW, color: "#10b981" },
  ];

  return {
    summary: {
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      completionRate,
    },
    memberWorkloads,
    weeklyActivity,
    monthlyActivity,
    priorityDistribution,
    supportOpportunities,
    hasAnyData: true,
  };
}
