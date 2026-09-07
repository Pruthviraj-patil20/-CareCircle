"use client";

import { AnnouncementWithDetails } from "@/types/announcement";
import { AnnouncementCard } from "./AnnouncementCard";
import { CreateAnnouncementDialog } from "./CreateAnnouncementDialog";
import { Megaphone } from "lucide-react";

interface AnnouncementListProps {
  announcements: AnnouncementWithDetails[];
  currentUserId?: string;
  isFamilyAdmin: boolean;
}

export function AnnouncementList({
  announcements,
  currentUserId,
  isFamilyAdmin,
}: AnnouncementListProps) {
  if (announcements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border-2 border-dashed border-border/80 bg-muted/15">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
          <Megaphone className="h-7 w-7" />
        </div>
        <h3 className="text-xl font-bold tracking-tight">No announcements posted</h3>
        <p className="text-muted-foreground text-sm max-w-md mt-1 mb-6">
          Keep all family members informed. Post urgent notices, trip plans, schedule adjustments, or household updates.
        </p>
        <CreateAnnouncementDialog />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {announcements.map((ann) => (
        <AnnouncementCard
          key={ann.id}
          announcement={ann}
          currentUserId={currentUserId}
          isFamilyAdmin={isFamilyAdmin}
        />
      ))}
    </div>
  );
}
