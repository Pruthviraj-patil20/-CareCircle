"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, isPast, differenceInDays } from "date-fns";
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
  FileText,
  FileImage,
  FileSpreadsheet,
  File,
  Download,
  Eye,
  Trash2,
  MoreVertical,
  AlertTriangle,
  Clock,
  Shield,
  Home,
  GraduationCap,
  Car,
  Landmark,
  User as UserIcon,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { DocumentWithDetails, DocumentCategoryType } from "@/types/document";
import { getDocumentDownloadUrl, deleteDocument } from "@/actions/documents";

const CATEGORY_META: Record<DocumentCategoryType, { label: string; icon: LucideIcon; color: string }> = {
  INSURANCE: { label: "Insurance", icon: Shield, color: "bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-800" },
  PROPERTY: { label: "Property", icon: Home, color: "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800" },
  EDUCATION: { label: "Education", icon: GraduationCap, color: "bg-purple-500/10 text-purple-600 border-purple-200 dark:border-purple-800" },
  VEHICLE: { label: "Vehicle", icon: Car, color: "bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800" },
  FINANCIAL: { label: "Financial", icon: Landmark, color: "bg-cyan-500/10 text-cyan-600 border-cyan-200 dark:border-cyan-800" },
  PERSONAL: { label: "Personal", icon: UserIcon, color: "bg-rose-500/10 text-rose-600 border-rose-200 dark:border-rose-800" },
};

export function DocumentCard({ document: doc }: { document: DocumentWithDetails }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const cat = CATEGORY_META[doc.category] || CATEGORY_META.PERSONAL;
  const CatIcon = cat.icon;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes("pdf")) return <FileText className="h-7 w-7 text-rose-500" />;
    if (mimeType.includes("image")) return <FileImage className="h-7 w-7 text-indigo-500" />;
    if (mimeType.includes("spreadsheet") || mimeType.includes("excel") || mimeType.includes("csv"))
      return <FileSpreadsheet className="h-7 w-7 text-emerald-500" />;
    return <File className="h-7 w-7 text-amber-500" />;
  };

  const getExpiryBadge = (expiryDate: Date | null) => {
    if (!expiryDate) {
      return (
        <Badge variant="outline" className="text-xs text-muted-foreground font-normal border-dashed">
          No Expiry
        </Badge>
      );
    }
    const exp = new Date(expiryDate);
    if (isPast(exp)) {
      return (
        <Badge variant="destructive" className="text-xs font-medium flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Expired
        </Badge>
      );
    }
    const days = differenceInDays(exp, new Date());
    if (days <= 30) {
      return (
        <Badge className="text-xs font-medium bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Expires in {days === 0 ? "today" : `${days}d`}
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="text-xs font-normal text-muted-foreground">
        Exp: {format(exp, "MMM d, yyyy")}
      </Badge>
    );
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      toast.loading("Generating secure download link...", { id: "downloading" });
      const { url } = await getDocumentDownloadUrl(doc.id);
      toast.dismiss("downloading");

      // Trigger download
      const a = window.document.createElement("a");
      a.href = url;
      a.download = doc.fileName;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
    } catch (err: unknown) {
      toast.dismiss("downloading");
      toast.error(err instanceof Error ? err.message : "Failed to download document");
    }
  };

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteDocument(doc.id);
        toast.success("Document deleted permanently");
        setDeleteOpen(false);
        router.refresh();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Failed to delete document");
      }
    });
  };

  const perms = doc.userPermissions || { canView: true, canDownload: true, canEdit: false, canDelete: false };

  return (
    <>
      <Card className="group flex flex-col justify-between overflow-hidden border transition-all duration-200 hover:shadow-md hover:border-primary/40 bg-card">
        <div>
          {/* Header */}
          <CardHeader className="p-4 pb-3 flex flex-row items-start justify-between space-y-0 gap-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`text-xs px-2 py-0.5 font-medium border flex items-center gap-1.5 ${cat.color}`}>
                <CatIcon className="h-3 w-3" />
                {cat.label}
              </Badge>
              {getExpiryBadge(doc.expiryDate)}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-80 group-hover:opacity-100">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                }
              />
              <DropdownMenuContent align="end">
                {perms.canView && (
                  <DropdownMenuItem
                    onClick={() => router.push(`/dashboard/documents/${doc.id}`)}
                    className="cursor-pointer flex items-center"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View & Preview
                  </DropdownMenuItem>
                )}
                {perms.canDownload && (
                  <DropdownMenuItem onClick={handleDownload} className="cursor-pointer">
                    <Download className="h-4 w-4 mr-2" />
                    Download File
                  </DropdownMenuItem>
                )}
                {perms.canDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteOpen(true);
                      }}
                      className="cursor-pointer text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Document
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>

          {/* Body */}
          <CardContent className="p-4 pt-1">
            <Link href={`/dashboard/documents/${doc.id}`} className="block group/link">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-muted/60 flex items-center justify-center shrink-0 border border-border/50 group-hover/link:border-primary/40 group-hover/link:bg-primary/5 transition-colors">
                  {getFileIcon(doc.mimeType)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-base leading-snug line-clamp-1 group-hover/link:text-primary transition-colors">
                    {doc.title}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {doc.fileName} • {formatFileSize(doc.fileSize)}
                  </p>
                  {doc.description && (
                    <p className="text-xs text-muted-foreground/80 line-clamp-2 mt-2">
                      {doc.description}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          </CardContent>
        </div>

        {/* Footer */}
        <CardFooter className="p-4 pt-2 border-t bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Avatar className="h-5 w-5">
              <AvatarImage src={doc.createdBy?.image || undefined} />
              <AvatarFallback className="text-[10px]">
                {doc.createdBy?.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <span className="truncate max-w-[110px]">{doc.createdBy?.name || "Member"}</span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs hover:text-primary"
              render={
                <Link href={`/dashboard/documents/${doc.id}`}>
                  <Eye className="h-3.5 w-3.5 mr-1" />
                  Preview
                </Link>
              }
            />
            {perms.canDownload && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                className="h-7 px-2 text-xs hover:text-primary"
              >
                <Download className="h-3.5 w-3.5 mr-1" />
                Save
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Document?
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete <strong>{doc.title}</strong>? The file will be removed from cloud storage and cannot be recovered.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
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
