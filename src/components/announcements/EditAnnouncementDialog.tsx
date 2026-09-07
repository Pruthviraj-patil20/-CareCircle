"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Edit3,
  Pin,
} from "lucide-react";
import { toast } from "sonner";
import { updateAnnouncement } from "@/actions/announcements";
import { AnnouncementWithDetails, AnnouncementPriorityType } from "@/types/announcement";

interface EditAnnouncementDialogProps {
  announcement: AnnouncementWithDetails;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditAnnouncementDialog({
  announcement,
  open,
  onOpenChange,
}: EditAnnouncementDialogProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const [title, setTitle] = useState(announcement.title);
  const [content, setContent] = useState(announcement.content);
  const [priority, setPriority] = useState<AnnouncementPriorityType>(announcement.priority);
  const [isPinned, setIsPinned] = useState(announcement.isPinned);
  const [expiresAt, setExpiresAt] = useState(
    announcement.expiresAt ? format(new Date(announcement.expiresAt), "yyyy-MM-dd") : ""
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    startTransition(async () => {
      try {
        await updateAnnouncement(announcement.id, {
          title: title.trim(),
          content: content.trim(),
          priority,
          isPinned,
          expiresAt: expiresAt ? expiresAt : null,
        });
        toast.success("Announcement updated");
        onOpenChange(false);
        router.refresh();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Failed to update announcement");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-primary" />
            Edit Announcement
          </DialogTitle>
          <DialogDescription>
            Update broadcast details, change priority or expiration settings.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label htmlFor="edit-ann-title">Title *</Label>
            <Input
              id="edit-ann-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="edit-ann-content">Announcement Content *</Label>
            <textarea
              id="edit-ann-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              required
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Priority Level</Label>
              <Select
                value={priority}
                onValueChange={(val) => setPriority((val || "NORMAL") as AnnouncementPriorityType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NORMAL">Normal</SelectItem>
                  <SelectItem value="IMPORTANT">Important</SelectItem>
                  <SelectItem value="URGENT">Urgent Alert</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="edit-ann-expiry">Expiration Date</Label>
              <Input
                id="edit-ann-expiry"
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
          </div>

          <label className="flex items-center gap-2.5 p-3 rounded-xl border bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors">
            <Checkbox
              checked={isPinned}
              onCheckedChange={(c) => setIsPinned(Boolean(c))}
              className="h-4 w-4"
            />
            <div className="min-w-0">
              <span className="text-sm font-medium flex items-center gap-1.5">
                <Pin className="h-3.5 w-3.5 text-primary" />
                Pin to top of feed
              </span>
            </div>
          </label>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !title.trim() || !content.trim()}>
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
