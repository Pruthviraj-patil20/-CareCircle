import { auth } from "@/lib/auth"
import prisma from "@/lib/db"
import { getActiveFamilyId } from "@/actions/family"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import { StatsCards, StatsCardsSkeleton } from "@/components/dashboard/StatsCards"
import { TodaySchedule, TodayScheduleSkeleton } from "@/components/dashboard/TodaySchedule"
import { UpcomingTasks, UpcomingTasksSkeleton } from "@/components/dashboard/UpcomingTasks"
import { ActivityFeed, ActivityFeedSkeleton } from "@/components/dashboard/ActivityFeed"
import { FamilyMembers, FamilyMembersSkeleton } from "@/components/dashboard/FamilyMembers"
import { QuickActions } from "@/components/dashboard/QuickActions"

async function DashboardData({ familyId, userId }: { familyId: string; userId: string }) {
  const now = new Date()
  const todayStart = new Date(now); todayStart.setHours(0,0,0,0)
  const todayEnd = new Date(now); todayEnd.setHours(23,59,59,999)

  const [
    myTasksCount, 
    dueTodayCount, 
    overdueCount, 
    familyTasksCount,
    todayEvents,
    upcomingTasks,
    recentActivity,
    members,
  ] = await Promise.all([
    // My open tasks
    prisma.task.count({
      where: { familyId, assigneeId: userId, status: { not: "DONE" } }
    }),
    // Tasks due today assigned to me
    prisma.task.count({
      where: { familyId, assigneeId: userId, status: { not: "DONE" }, dueDate: { gte: todayStart, lte: todayEnd } }
    }),
    // Overdue tasks assigned to me
    prisma.task.count({
      where: { familyId, assigneeId: userId, status: { not: "DONE" }, dueDate: { lt: todayStart } }
    }),
    // All family open tasks
    prisma.task.count({
      where: { familyId, status: { not: "DONE" } }
    }),
    // Today's events
    prisma.event.findMany({
      where: { familyId, startTime: { gte: todayStart, lte: todayEnd } },
      orderBy: { startTime: "asc" },
      select: {
        id: true, title: true, startTime: true, endTime: true, location: true,
        createdBy: { select: { name: true } }
      },
    }),
    // Upcoming tasks (not done, ordered by due date)
    prisma.task.findMany({
      where: { familyId, assigneeId: userId, status: { not: "DONE" } },
      orderBy: [{ dueDate: "asc" }, { priority: "asc" }],
      take: 6,
      select: {
        id: true, title: true, priority: true, status: true, dueDate: true,
        assignee: { select: { name: true, image: true } }
      },
    }),
    // Recent activity
    prisma.activityLog.findMany({
      where: { familyId },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true, action: true, entityType: true, entityName: true, createdAt: true,
        user: { select: { name: true, image: true } }
      },
    }),
    // Family members
    prisma.familyMember.findMany({
      where: { familyId },
      select: {
        id: true, role: true,
        user: { select: { id: true, name: true, image: true, email: true } }
      },
    }),
  ])

  const stats = { myTasks: myTasksCount, dueToday: dueTodayCount, overdue: overdueCount, familyTasks: familyTasksCount }

  return { stats, todayEvents, upcomingTasks, recentActivity, members }
}

async function DashboardContent({ familyId, userId }: { familyId: string; userId: string }) {
  const { stats, todayEvents, upcomingTasks, recentActivity, members } = await DashboardData({ familyId, userId })

  return (
    <>
      <StatsCards stats={stats} />
      
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          <TodaySchedule events={todayEvents} />
          <UpcomingTasks tasks={upcomingTasks} />
          <ActivityFeed activities={recentActivity} />
        </div>
        
        {/* Right column */}
        <div className="space-y-6">
          <QuickActions />
          <FamilyMembers members={members} />
        </div>
      </div>
    </>
  )
}

function DashboardSkeleton() {
  return (
    <>
      <StatsCardsSkeleton />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <TodayScheduleSkeleton />
          <UpcomingTasksSkeleton />
          <ActivityFeedSkeleton />
        </div>
        <div className="space-y-6">
          <div className="h-64 rounded-xl bg-card ring-1 ring-foreground/10 animate-pulse" />
          <FamilyMembersSkeleton />
        </div>
      </div>
    </>
  )
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const activeFamilyId = await getActiveFamilyId()
  
  // Get user's first family if no active family cookie set
  const membership = activeFamilyId
    ? await prisma.familyMember.findUnique({
        where: { familyId_userId: { familyId: activeFamilyId, userId: session.user.id } },
        include: { family: true },
      })
    : await prisma.familyMember.findFirst({
        where: { userId: session.user.id },
        include: { family: true },
      })

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return "Good morning"
    if (h < 17) return "Good afternoon"
    return "Good evening"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {greeting()}, {session.user.name?.split(" ")[0] ?? "there"} 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          {membership
            ? `Here's what's happening in ${membership.family.name} today.`
            : "Create or join a family to get started."}
        </p>
      </div>

      {!membership ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <span className="text-2xl">👨‍👩‍👧‍👦</span>
          </div>
          <h2 className="text-xl font-semibold mb-2">No Family Yet</h2>
          <p className="text-muted-foreground max-w-sm">
            Use the family switcher in the sidebar to create your first family or accept an invite.
          </p>
        </div>
      ) : (
        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardContent familyId={membership.familyId} userId={session.user.id} />
        </Suspense>
      )}
    </div>
  )
}
