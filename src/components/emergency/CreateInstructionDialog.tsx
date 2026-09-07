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
import { Plus, BookOpen, Lock } from "lucide-react";
import { toast } from "sonner";
import { createEmergencyInstruction } from "@/actions/emergency";

export function CreateInstructionDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<"MEDICAL" | "HOME_SAFETY" | "EVACUATION" | "GENERAL">("MEDICAL");
  const [content, setContent] = useState("");
  const [isSensitive, setIsSensitive] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Title and instructions are required");
      return;
    }

    startTransition(async () => {
      try {
        await createEmergencyInstruction({
          title: title.trim(),
          category,
          content: content.trim(),
          isSensitive,
        });

        toast.success("Emergency protocol saved");
        setOpen(false);
        setTitle("");
        setContent("");
        setIsSensitive(false);
        router.refresh();
      } catch (err: any) {
        toast.error(err.message || "Failed to save instruction");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
            <Plus className="h-3.5 w-3.5" />
            Add Protocol
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Add Emergency Protocol
          </DialogTitle>
          <DialogDescription>
            Document critical instructions for medical conditions, home safety shutoffs, or evacuation meeting points.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label htmlFor="inst-title">Protocol Title *</Label>
            <Input
              id="inst-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Main Water Shutoff Valve Location"
              required
            />
          </div>

          <div className="space-y-1">
            <Label>Category</Label>
            <Select
              value={category}
              onValueChange={(val: any) => setCategory(val || "GENERAL")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MEDICAL">Medical & Allergy Protocol</SelectItem>
                <SelectItem value="HOME_SAFETY">Home Safety & Shutoffs</SelectItem>
                <SelectItem value="EVACUATION">Evacuation & Meeting Point</SelectItem>
                <SelectItem value="GENERAL">General Emergency Info</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="inst-content">Step-by-Step Instructions *</Label>
            <textarea
              id="inst-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Provide exact instructions, item locations, doses, or emergency actions..."
              rows={4}
              required
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none resize-none"
            />
          </div>

          <label className="flex items-center gap-2.5 p-3 rounded-xl border bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors">
            <Checkbox
              checked={isSensitive}
              onCheckedChange={(c) => setIsSensitive(Boolean(c))}
              className="h-4 w-4"
            />
            <div className="min-w-0">
              <span className="text-sm font-medium flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                <Lock className="h-3.5 w-3.5" />
                Sensitive Protocol (Admin Only)
              </span>
              <p className="text-xs text-muted-foreground">
                Hide this instruction from guests or non-admin accounts (e.g. alarm passcodes, gun safe codes).
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
              {isPending ? "Saving..." : "Save Protocol"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
