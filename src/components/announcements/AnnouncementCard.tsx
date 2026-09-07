"use client";

import { useState, useTransition } from "react";
import { format, formatDistanceToNow, isPast } from "date-fns";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Pin,
  AlertTriangle,
  AlertCircle,
  MoreVertical,
  CheckCircle2,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Clock,
  Trash2,
  Edit3,
} from "lucide-react";
import { toast } from "sonner";
import { AnnouncementWithDetails } from "@/types/announcement";
import {
  togglePinAnnouncement,
  deleteAnnouncement,
  markAnnouncementAsRead,
} from "@/actions/announcements";
import { EditAnnouncementDialog } from "./EditAnnouncementDialog";
import { AnnouncementComments } from "./AnnouncementComments";

interface AnnouncementCardProps {
  announcement: AnnouncementWithDetails;
  currentUserId?: string;
  isFamilyAdmin: boolean;
}

export function AnnouncementCard({
  announcement: ann,
  currentUserId,
  isFamilyAdmin,
}: AnnouncementCardProps) {
  const [isPending, startTransition] = useTransition();
  const [showComments, setShowComments] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isRead, setIsRead] = useState(ann.isReadByCurrentUser);

  const isExpired = ann.expiresAt ? isPast(new Date(ann.expiresAt)) : false;

  const handleTogglePin = () => {
    startTransition(async () => {
      try {
        await togglePinAnnouncement(ann.id);
        toast.success(ann.isPinned ? "Unpinned from top" : "Pinned to top of feed");
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Failed to update pin");
      }
    });
  };

  const handleMarkAsRead = () => {
    setIsRead(true);
    startTransition(async () => {
      try {
        await markAnnouncementAsRead(ann.id);
        toast.success("Marked as read");
      } catch {
        // Silent catch
      }
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteAnnouncement(ann.id);
        toast.success("Announcement deleted");
        setDeleteOpen(false);
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Failed to delete announcement");
      }
    });
  };

  const priorityStyles = {
    URGENT: "border-rose-500/50 bg-rose-500/5 dark:bg-rose-950/10",
    IMPORTANT: "border-amber-500/50 bg-amber-500/5 dark:bg-amber-950/10",
    NORMAL: "border-border/70 bg-card",
  };

  return (
    <>
      <Card
        className={`border transition-all duration-200 shadow-xs hover:shadow-sm ${
          ann.isPinned ? "ring-1 ring-primary/30" : ""
        } ${priorityStyles[ann.priority] || priorityStyles.NORMAL}`}
      >
        <CardHeader className="p-4 pb-2 space-y-0">
          <div className="flex items-start justify-between gap-3">
            {/* Author Info & Badges */}
            <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
              <Avatar className="h-8 w-8">
                <AvatarImage src={ann.author?.image || undefined} />
                <AvatarFallback className="text-xs">
                  {ann.author?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm">
                    {ann.author?.name || "Family Member"}
                  </span>

                  {ann.isPinned && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/30 flex items-center gap-1">
                      <Pin className="h-3 w-3" />
                      Pinned
                    </Badge>
                  )}

                  {ann.priority === "URGENT" && (
                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0 flex items-center gap-1 font-semibold">
                      <AlertTriangle className="h-3 w-3" />
                      Urgent Alert
                    </Badge>
                  )}

                  {ann.priority === "IMPORTANT" && (
                    <Badge className="text-[10px] px-1.5 py-0 bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Important
                    </Badge>
                  )}

                  {!isRead && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium">
                      New
                    </Badge>
                  )}

                  {isExpired && (
                    <Badge variant="outline" className="text-[10px] text-muted-foreground border-dashed">
                      Expired
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                  <Clock className="h-3 w-3" />
                  <span>{formatDistanceToNow(new Date(ann.createdAt), { addSuffix: true })}</span>
                  {ann.expiresAt && !isExpired && (
                    <>
                      <span>•</span>
                      <span>Expires {format(new Date(ann.expiresAt), "MMM d")}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Actions Menu */}
            <div className="flex items-center gap-1 shrink-0">
              {!isRead && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAsRead}
                  className="h-7 text-xs px-2 text-muted-foreground hover:text-primary gap-1"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Mark Read</span>
                </Button>
              )}

              {(ann.canEdit || ann.canDelete) && (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    }
                  />
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleTogglePin} className="cursor-pointer">
                      <Pin className="h-4 w-4 mr-2" />
                      {ann.isPinned ? "Unpin Announcement" : "Pin to Top"}
                    </DropdownMenuItem>

                    {ann.canEdit && (
                      <DropdownMenuItem onClick={() => setEditOpen(true)} className="cursor-pointer">
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit Message
                      </DropdownMenuItem>
                    )}

                    {ann.canDelete && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeleteOpen(true)}
                          className="cursor-pointer text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Announcement
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </CardHeader>

        {/* Content */}
        <CardContent className="p-4 pt-2 space-y-3">
          <h3 className="font-bold text-base tracking-tight text-foreground">
            {ann.title}
          </h3>

          <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
            {ann.content}
          </p>
        </CardContent>

        {/* Footer: Read count & Comments toggle */}
        <CardFooter className="p-4 pt-2 border-t bg-muted/10 flex items-center justify-between text-xs text-muted-foreground">
          {/* Read By stats */}
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span>
              Read by {ann.reads?.length || 1} {ann.reads?.length === 1 ? "member" : "members"}
            </span>
          </div>

          {/* Comments Toggle Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments(!showComments)}
            className="h-7 text-xs px-2 gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>{ann.comments?.length || 0} Replies</span>
            {showComments ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
        </CardFooter>

        {/* Expandable Comments Drawer */}
        {showComments && (
          <div className="px-4 pb-4 bg-muted/10">
            <AnnouncementComments
              announcementId={ann.id}
              comments={ann.comments || []}
              currentUserId={currentUserId}
              isFamilyAdmin={isFamilyAdmin}
            />
          </div>
        )}
      </Card>

      {/* Edit Dialog */}
      <EditAnnouncementDialog
        announcement={ann}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Announcement?
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <strong>{ann.title}</strong>? This cannot be undone and replies will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? "Deleting..." : "Delete Permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
