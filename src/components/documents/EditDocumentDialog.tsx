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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Shield,
  Home,
  GraduationCap,
  Car,
  Landmark,
  User as UserIcon,
  Edit3,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { updateDocument } from "@/actions/documents";
import { DocumentCategoryType, DocumentWithDetails } from "@/types/document";

const CATEGORIES: { value: DocumentCategoryType; label: string; icon: LucideIcon }[] = [
  { value: "INSURANCE", label: "Insurance", icon: Shield },
  { value: "PROPERTY", label: "Property & Housing", icon: Home },
  { value: "EDUCATION", label: "Education & Certificates", icon: GraduationCap },
  { value: "VEHICLE", label: "Vehicle & Transport", icon: Car },
  { value: "FINANCIAL", label: "Financial & Tax", icon: Landmark },
  { value: "PERSONAL", label: "Personal & Identity", icon: UserIcon },
];

interface EditDocumentDialogProps {
  document: DocumentWithDetails;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditDocumentDialog({
  document: doc,
  open,
  onOpenChange,
}: EditDocumentDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState(doc.title);
  const [description, setDescription] = useState(doc.description || "");
  const [category, setCategory] = useState<DocumentCategoryType>(doc.category);
  const [expiryDate, setExpiryDate] = useState(
    doc.expiryDate ? format(new Date(doc.expiryDate), "yyyy-MM-dd") : ""
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Document title is required");
      return;
    }

    startTransition(async () => {
      try {
        await updateDocument(doc.id, {
          title: title.trim(),
          description: description.trim() || null,
          category,
          expiryDate: expiryDate ? expiryDate : null,
        });
        toast.success("Document updated successfully");
        onOpenChange(false);
        router.refresh();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Failed to update document");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-primary" />
            Edit Document Details
          </DialogTitle>
          <DialogDescription>
            Update metadata, document classification, or expiration alert dates.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label htmlFor="edit-title">Document Title *</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Category *</Label>
              <Select
                value={category}
                onValueChange={(val) => setCategory((val || "PERSONAL") as DocumentCategoryType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <SelectItem key={cat.value} value={cat.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span>{cat.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="edit-expiry">Expiry Date</Label>
              <Input
                id="edit-expiry"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="edit-desc">Description / Notes</Label>
            <Input
              id="edit-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notes, policy numbers, details..."
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !title.trim()}>
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
