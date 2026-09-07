"use client";

import { useState, useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Send, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import {
  addAnnouncementComment,
  deleteAnnouncementComment,
} from "@/actions/announcements";
import { AnnouncementCommentItem } from "@/types/announcement";

interface AnnouncementCommentsProps {
  announcementId: string;
  comments: AnnouncementCommentItem[];
  currentUserId?: string;
  isFamilyAdmin: boolean;
}

export function AnnouncementComments({
  announcementId,
  comments: initialComments,
  currentUserId,
  isFamilyAdmin,
}: AnnouncementCommentsProps) {
  const [comments, setComments] = useState<AnnouncementCommentItem[]>(initialComments);
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    const trimmed = content.trim();
    setContent("");

    startTransition(async () => {
      try {
        const res = await addAnnouncementComment(announcementId, trimmed);
        if (res?.success && res.comment) {
          setComments((prev) => [...prev, res.comment]);
          toast.success("Comment added");
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to add comment");
      }
    });
  };

  const handleDeleteComment = (commentId: string) => {
    startTransition(async () => {
      try {
        await deleteAnnouncementComment(commentId);
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        toast.success("Comment removed");
      } catch (err: any) {
        toast.error(err.message || "Failed to delete comment");
      }
    });
  };

  return (
    <div className="space-y-4 pt-3 border-t">
      {/* Comments List */}
      {comments.length > 0 ? (
        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
          {comments.map((comment) => {
            const canDelete =
              isFamilyAdmin || comment.userId === currentUserId;

            return (
              <div
                key={comment.id}
                className="flex items-start gap-2.5 group/comment text-xs"
              >
                <Avatar className="h-6 w-6 shrink-0 mt-0.5">
                  <AvatarImage src={comment.user?.image || undefined} />
                  <AvatarFallback className="text-[10px]">
                    {comment.user?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 bg-muted/40 rounded-xl p-2.5 border border-border/40">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-semibold text-foreground">
                      {comment.user?.name || "Family Member"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">
                    {comment.content}
                  </p>
                </div>

                {canDelete && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteComment(comment.id)}
                    disabled={isPending}
                    className="h-6 w-6 p-0 opacity-0 group-hover/comment:opacity-100 text-muted-foreground hover:text-destructive shrink-0 transition-opacity"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-3 text-xs text-muted-foreground flex items-center justify-center gap-1.5">
          <MessageSquare className="h-3.5 w-3.5" />
          <span>No comments yet. Start the family discussion!</span>
        </div>
      )}

      {/* Add Comment Form */}
      <form onSubmit={handleAddComment} className="flex items-center gap-2">
        <Input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write a reply or acknowledge..."
          className="text-xs h-8 flex-1"
          disabled={isPending}
        />
        <Button
          type="submit"
          size="sm"
          disabled={isPending || !content.trim()}
          className="h-8 px-3 text-xs gap-1.5"
        >
          <Send className="h-3 w-3" />
          <span>Reply</span>
        </Button>
      </form>
    </div>
  );
}
