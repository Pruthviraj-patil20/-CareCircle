"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Megaphone,
  Pin,
  AlertTriangle,
  AlertCircle,
  Plus,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { createAnnouncement } from "@/actions/announcements";
import { AnnouncementPriorityType } from "@/types/announcement";

export function CreateAnnouncementDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState<AnnouncementPriorityType>("NORMAL");
  const [isPinned, setIsPinned] = useState(false);
  const [expiresAt, setExpiresAt] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Announcement title is required");
      return;
    }
    if (!content.trim()) {
      toast.error("Announcement content is required");
      return;
    }

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("content", content.trim());
    formData.append("priority", priority);
    formData.append("isPinned", String(isPinned));
    if (expiresAt) {
      formData.append("expiresAt", expiresAt);
    }

    startTransition(async () => {
      try {
        const res = await createAnnouncement(formData);
        if (res?.success) {
          toast.success("Announcement broadcasted to family!");
          setOpen(false);
          setTitle("");
          setContent("");
          setPriority("NORMAL");
          setIsPinned(false);
          setExpiresAt("");
          router.refresh();
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to create announcement");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5">
            <Plus className="h-4 w-4" />
            New Announcement
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            Post Family Announcement
          </DialogTitle>
          <DialogDescription>
            Share important notices, trip updates, household reminders, or emergencies with all members.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Title */}
          <div className="space-y-1">
            <Label htmlFor="ann-title">Title *</Label>
            <Input
              id="ann-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Grandma's 80th Birthday Gathering Details"
              required
            />
          </div>

          {/* Content */}
          <div className="space-y-1">
            <Label htmlFor="ann-content">Announcement Content *</Label>
            <textarea
              id="ann-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write the full message, timings, checklist, or instructions..."
              rows={4}
              required
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none resize-none"
            />
          </div>

          {/* Priority & Expiration Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Priority Level</Label>
              <Select
                value={priority}
                onValueChange={(val: any) => setPriority(val || "NORMAL")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NORMAL">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-slate-400" />
                      Normal
                    </span>
                  </SelectItem>
                  <SelectItem value="IMPORTANT">
                    <span className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                      <AlertCircle className="h-3.5 w-3.5" />
                      Important
                    </span>
                  </SelectItem>
                  <SelectItem value="URGENT">
                    <span className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-medium">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Urgent Alert
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="ann-expiry">Auto-Expire On (Optional)</Label>
              <Input
                id="ann-expiry"
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
          </div>

          {/* Pin to Top Toggle */}
          <label className="flex items-center gap-2.5 p-3 rounded-xl border bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors">
            <Checkbox
              checked={isPinned}
              onCheckedChange={(c) => setIsPinned(Boolean(c))}
              className="h-4 w-4"
            />
            <div className="min-w-0">
              <span className="text-sm font-medium flex items-center gap-1.5">
                <Pin className="h-3.5 w-3.5 text-primary" />
                Pin to top of family feed
              </span>
              <p className="text-xs text-muted-foreground">
                Keeps this announcement prominently highlighted above all regular notices.
              </p>
            </div>
          </label>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !title.trim() || !content.trim()}>
              {isPending ? "Broadcasting..." : "Broadcast Notice"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
