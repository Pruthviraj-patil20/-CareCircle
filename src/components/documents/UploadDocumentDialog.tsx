"use client";

import { useState, useRef, useTransition } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  X,
  FileCheck,
  Shield,
  Home,
  GraduationCap,
  Car,
  Landmark,
  User as UserIcon,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { uploadDocument } from "@/actions/documents";
import { DocumentCategoryType } from "@/types/document";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

const CATEGORIES: { value: DocumentCategoryType; label: string; icon: LucideIcon }[] = [
  { value: "INSURANCE", label: "Insurance", icon: Shield },
  { value: "PROPERTY", label: "Property & Housing", icon: Home },
  { value: "EDUCATION", label: "Education & Certificates", icon: GraduationCap },
  { value: "VEHICLE", label: "Vehicle & Transport", icon: Car },
  { value: "FINANCIAL", label: "Financial & Tax", icon: Landmark },
  { value: "PERSONAL", label: "Personal & Identity", icon: UserIcon },
];

export function UploadDocumentDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<DocumentCategoryType>("PERSONAL");
  const [expiryDate, setExpiryDate] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile.size > MAX_FILE_SIZE) {
      toast.error("File exceeds 25 MB maximum limit");
      return;
    }
    setFile(selectedFile);
    if (!title) {
      // Auto-populate title from clean filename without extension
      const baseName = selectedFile.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      setTitle(baseName.charAt(0).toUpperCase() + baseName.slice(1));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error("Please select a file to upload");
      return;
    }
    if (!title.trim()) {
      toast.error("Please provide a title for the document");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title.trim());
    formData.append("category", category);
    if (description.trim()) {
      formData.append("description", description.trim());
    }
    if (expiryDate) {
      formData.append("expiryDate", expiryDate);
    }

    startTransition(async () => {
      try {
        const res = await uploadDocument(formData);
        if (res?.success) {
          toast.success("Document uploaded securely to vault!");
          setOpen(false);
          setFile(null);
          setTitle("");
          setDescription("");
          setExpiryDate("");
          setCategory("PERSONAL");
          router.refresh();
        }
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Failed to upload document");
      }
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Upload to Secure Vault
          </DialogTitle>
          <DialogDescription>
            Documents are stored in encrypted cloud storage with protected signed URLs and granular family access controls.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* File Dropzone */}
          <div>
            <Label className="text-sm font-medium">Document File *</Label>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
              }}
              accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,.txt"
            />

            {!file ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`mt-1 border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  dragOver
                    ? "border-primary bg-primary/5 scale-[1.01]"
                    : "border-border hover:border-primary/50 hover:bg-muted/40"
                }`}
              >
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm font-medium">Click to select or drag & drop</p>
                <p className="text-xs text-muted-foreground mt-1">
                  PDF, Images, Word, Excel (Max 25 MB)
                </p>
              </div>
            ) : (
              <div className="mt-1 flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <FileCheck className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)} • {file.type || "Document"}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setFile(null)}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Title */}
          <div className="space-y-1">
            <Label htmlFor="doc-title" className="text-sm font-medium">
              Document Title *
            </Label>
            <Input
              id="doc-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Home Insurance Policy 2026"
              required
            />
          </div>

          {/* Category & Expiry Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Category *</Label>
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
              <Label htmlFor="doc-expiry" className="text-sm font-medium">
                Expiry Date (Optional)
              </Label>
              <Input
                id="doc-expiry"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <Label htmlFor="doc-desc" className="text-sm font-medium">
              Description / Notes (Optional)
            </Label>
            <Input
              id="doc-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Policy numbers, renew dates, notes..."
            />
          </div>

          <DialogFooter className="pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !file || !title.trim()}>
              {isPending ? (
                <>
                  <Upload className="h-4 w-4 mr-2 animate-spin" />
                  Encrypting & Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Save to Vault
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
