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
import { Edit3, Lock } from "lucide-react";
import { toast } from "sonner";
import { updateEmergencyInstruction } from "@/actions/emergency";
import { EmergencyInstructionItem } from "@/types/emergency";

interface EditInstructionDialogProps {
  instruction: EmergencyInstructionItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditInstructionDialog({
  instruction,
  open,
  onOpenChange,
}: EditInstructionDialogProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const [title, setTitle] = useState(instruction.title);
  const [category, setCategory] = useState<"MEDICAL" | "HOME_SAFETY" | "EVACUATION" | "GENERAL">(
    instruction.category
  );
  const [content, setContent] = useState(instruction.content);
  const [isSensitive, setIsSensitive] = useState(instruction.isSensitive);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    startTransition(async () => {
      try {
        await updateEmergencyInstruction(instruction.id, {
          title: title.trim(),
          category,
          content: content.trim(),
          isSensitive,
        });

        toast.success("Protocol updated");
        onOpenChange(false);
        router.refresh();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Failed to update protocol");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-primary" />
            Edit Emergency Protocol
          </DialogTitle>
          <DialogDescription>
            Update step-by-step instructions or sensitivity flags.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label htmlFor="edit-i-title">Protocol Title *</Label>
            <Input
              id="edit-i-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <Label>Category</Label>
            <Select
              value={category}
              onValueChange={(val) => setCategory((val || "GENERAL") as "MEDICAL" | "HOME_SAFETY" | "EVACUATION" | "GENERAL")}
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
            <Label htmlFor="edit-i-content">Step-by-Step Instructions *</Label>
            <textarea
              id="edit-i-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
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
