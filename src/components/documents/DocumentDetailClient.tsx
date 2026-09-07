"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, isPast, differenceInDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Download,
  Edit3,
  Trash2,
  Calendar,
  AlertTriangle,
  Clock,
  Shield,
  Home,
  GraduationCap,
  Car,
  Landmark,
  User as UserIcon,
  HardDrive,
  FileCheck,
} from "lucide-react";
import { toast } from "sonner";
import { DocumentWithDetails, DocumentCategoryType } from "@/types/document";
import { DocumentPreview } from "./DocumentPreview";
import { EditDocumentDialog } from "./EditDocumentDialog";
import { DocumentPermissionsManager } from "./DocumentPermissionsManager";
import { getDocumentDownloadUrl, deleteDocument } from "@/actions/documents";

const CATEGORY_META: Record<DocumentCategoryType, { label: string; icon: any; color: string }> = {
  INSURANCE: { label: "Insurance", icon: Shield, color: "bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-800" },
  PROPERTY: { label: "Property", icon: Home, color: "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800" },
  EDUCATION: { label: "Education", icon: GraduationCap, color: "bg-purple-500/10 text-purple-600 border-purple-200 dark:border-purple-800" },
  VEHICLE: { label: "Vehicle", icon: Car, color: "bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800" },
  FINANCIAL: { label: "Financial", icon: Landmark, color: "bg-cyan-500/10 text-cyan-600 border-cyan-200 dark:border-cyan-800" },
  PERSONAL: { label: "Personal", icon: UserIcon, color: "bg-rose-500/10 text-rose-600 border-rose-200 dark:border-rose-800" },
};

interface DocumentDetailClientProps {
  document: DocumentWithDetails;
  members: Array<{
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    role: string;
  }>;
  canManagePermissions: boolean;
}

export function DocumentDetailClient({
  document: doc,
  members,
  canManagePermissions,
}: DocumentDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const cat = CATEGORY_META[doc.category] || CATEGORY_META.PERSONAL;
  const CatIcon = cat.icon;

  const perms = doc.userPermissions || {
    canView: true,
    canDownload: true,
    canEdit: false,
    canDelete: false,
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDownload = async () => {
    try {
      toast.loading("Generating secure download link...", { id: "downloading" });
      const { url } = await getDocumentDownloadUrl(doc.id);
      toast.dismiss("downloading");

      const a = window.document.createElement("a");
      a.href = url;
      a.download = doc.fileName;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
    } catch (err: any) {
      toast.dismiss("downloading");
      toast.error(err.message || "Failed to download document");
    }
  };

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteDocument(doc.id);
        toast.success("Document removed from vault");
        router.push("/dashboard/documents");
      } catch (err: any) {
        toast.error(err.message || "Failed to delete document");
      }
    });
  };

  // Expiry alert calculation
  const renderExpiryBanner = () => {
    if (!doc.expiryDate) return null;
    const exp = new Date(doc.expiryDate);
    const isExpired = isPast(exp);
    const days = differenceInDays(exp, new Date());

    if (isExpired) {
      return (
        <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <div className="min-w-0">
            <p className="font-semibold text-sm">This document has expired</p>
            <p className="text-xs text-destructive/80">
              Expired on {format(exp, "MMMM d, yyyy")}. Please review and upload an updated version or renewal.
            </p>
          </div>
        </div>
      );
    }

    if (days <= 30) {
      return (
        <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-500/10 text-amber-800 dark:text-amber-300 flex items-center gap-3">
          <Clock className="h-5 w-5 shrink-0" />
          <div className="min-w-0">
            <p className="font-semibold text-sm">
              Document expiring soon ({days === 0 ? "today" : `in ${days} days`})
            </p>
            <p className="text-xs text-amber-700/80 dark:text-amber-400/80">
              Expires on {format(exp, "MMMM d, yyyy")}. Automatic reminders are scheduled for family admins.
            </p>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="h-9 w-9 p-0 rounded-full"
            render={
              <Link href="/dashboard/documents">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            }
          />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{doc.title}</h1>
              <Badge variant="outline" className={`text-xs px-2.5 py-0.5 font-medium border flex items-center gap-1.5 ${cat.color}`}>
                <CatIcon className="h-3.5 w-3.5" />
                {cat.label}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Uploaded by {doc.createdBy?.name || "Family Member"} on{" "}
              {format(new Date(doc.createdAt), "MMMM d, yyyy")}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {perms.canDownload && (
            <Button onClick={handleDownload} variant="outline" size="sm" className="gap-1.5">
              <Download className="h-4 w-4" />
              Download
            </Button>
          )}

          {perms.canEdit && (
            <Button onClick={() => setEditOpen(true)} variant="outline" size="sm" className="gap-1.5">
              <Edit3 className="h-4 w-4" />
              Edit Details
            </Button>
          )}

          {perms.canDelete && (
            <Button
              onClick={() => setDeleteOpen(true)}
              variant="destructive"
              size="sm"
              className="gap-1.5"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Expiry Banner if applicable */}
      {renderExpiryBanner()}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Document Preview */}
        <div className="lg:col-span-2 space-y-6">
          <DocumentPreview
            documentId={doc.id}
            mimeType={doc.mimeType}
            fileName={doc.fileName}
            canDownload={perms.canDownload}
          />
        </div>

        {/* Right 1 Col: Metadata & Permissions Manager */}
        <div className="space-y-6">
          {/* Metadata Card */}
          <Card className="border shadow-sm">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-primary" />
                Document Metadata
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-4 text-sm">
              <div className="space-y-3 divide-y divide-border/60">
                <div className="flex items-center justify-between pt-1">
                  <span className="text-muted-foreground text-xs">File Name</span>
                  <span className="font-medium text-xs truncate max-w-[180px]" title={doc.fileName}>
                    {doc.fileName}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2.5">
                  <span className="text-muted-foreground text-xs">File Size</span>
                  <span className="font-medium text-xs">{formatFileSize(doc.fileSize)}</span>
                </div>

                <div className="flex items-center justify-between pt-2.5">
                  <span className="text-muted-foreground text-xs">Format / MIME</span>
                  <span className="font-medium text-xs truncate max-w-[180px]">{doc.mimeType}</span>
                </div>

                <div className="flex items-center justify-between pt-2.5">
                  <span className="text-muted-foreground text-xs">Category</span>
                  <span className="font-medium text-xs">{cat.label}</span>
                </div>

                <div className="flex items-center justify-between pt-2.5">
                  <span className="text-muted-foreground text-xs">Expiration Date</span>
                  <span className="font-medium text-xs">
                    {doc.expiryDate ? format(new Date(doc.expiryDate), "MMM d, yyyy") : "None"}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2.5">
                  <span className="text-muted-foreground text-xs">Uploaded By</span>
                  <div className="flex items-center gap-1.5">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={doc.createdBy?.image || undefined} />
                      <AvatarFallback className="text-[10px]">
                        {doc.createdBy?.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-xs">{doc.createdBy?.name || "Member"}</span>
                  </div>
                </div>
              </div>

              {doc.description && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground font-medium mb-1">Notes & Description</p>
                  <p className="text-xs text-foreground/90 bg-muted/30 p-2.5 rounded-lg whitespace-pre-wrap">
                    {doc.description}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Granular Permissions Manager */}
          <DocumentPermissionsManager
            documentId={doc.id}
            documentCreatorId={doc.createdById}
            members={members}
            currentPermissions={doc.permissions || []}
            canManage={canManagePermissions}
          />
        </div>
      </div>

      {/* Edit Metadata Modal */}
      <EditDocumentDialog
        document={doc}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Permanently Delete Document?
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <strong>{doc.title}</strong>? The file will be deleted from secure storage and will no longer be accessible by any family member.
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
    </div>
  );
}
