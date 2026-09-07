import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { getActiveFamilyId } from "@/actions/family";
import { getAnnouncements } from "@/actions/announcements";
import { AnnouncementFilters } from "@/components/announcements/AnnouncementFilters";
import { AnnouncementList } from "@/components/announcements/AnnouncementList";
import { CreateAnnouncementDialog } from "@/components/announcements/CreateAnnouncementDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Megaphone, Pin, Bell, CheckCircle2 } from "lucide-react";
import prisma from "@/lib/db";
import { AnnouncementPriorityType } from "@/types/announcement";

export default async function AnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const familyId = await getActiveFamilyId();

  if (!familyId) {
    return (
      <div className="p-12 text-center bg-card rounded-2xl border max-w-lg mx-auto mt-12 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
          <Megaphone className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-bold mb-2">No Family Selected</h2>
        <p className="text-muted-foreground text-sm">
          Please select or create a family in the sidebar to access announcements.
        </p>
      </div>
    );
  }

  const membership = await prisma.familyMember.findUnique({
    where: { familyId_userId: { familyId, userId: session.user.id } },
  });
  const isFamilyAdmin =
    membership?.role === "OWNER" || membership?.role === "ADMIN";

  const params = await searchParams;
  const announcements = await getAnnouncements({
    search: params.search,
    filter: (params.filter as any) || "active",
    priority: (params.priority as AnnouncementPriorityType | "ALL") || "ALL",
  });

  // Calculate overview metrics
  const totalActive = announcements.filter(
    (a) => !a.expiresAt || new Date(a.expiresAt) >= new Date()
  ).length;
  const totalPinned = announcements.filter((a) => a.isPinned).length;
  const totalUnread = announcements.filter((a) => !a.isReadByCurrentUser).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
            <span className="flex items-center gap-1 text-[11px] font-medium bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2.5 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
              <Megaphone className="h-3 w-3" />
              Family Broadcast
            </span>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Keep everyone aligned with announcements, pinned bulletins, discussions, and expiry tracking.
          </p>
        </div>

        <CreateAnnouncementDialog />
      </div>

      {/* Metric summary badges */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border bg-card shadow-2xs">
          <CardContent className="p-3.5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Bell className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium">Active Notices</p>
              <p className="text-lg font-bold">{totalActive}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border bg-card shadow-2xs">
          <CardContent className="p-3.5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <Pin className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium">Pinned to Top</p>
              <p className="text-lg font-bold text-amber-600">{totalPinned}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border bg-card shadow-2xs">
          <CardContent className="p-3.5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium">Unread for You</p>
              <p className="text-lg font-bold text-blue-600">{totalUnread}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search */}
      <Suspense fallback={<div className="h-16 bg-muted/20 animate-pulse rounded-xl" />}>
        <AnnouncementFilters />
      </Suspense>

      {/* Announcements Feed */}
      <AnnouncementList
        announcements={announcements}
        currentUserId={session.user.id}
        isFamilyAdmin={isFamilyAdmin}
      />
    </div>
  );
}
