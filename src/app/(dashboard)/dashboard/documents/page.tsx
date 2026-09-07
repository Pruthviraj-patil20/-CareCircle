import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { getActiveFamilyId } from "@/actions/family";
import { getDocuments, getDocumentVaultStats } from "@/actions/documents";
import { DocumentFilters } from "@/components/documents/DocumentFilters";
import { DocumentList } from "@/components/documents/DocumentList";
import { UploadDocumentDialog } from "@/components/documents/UploadDocumentDialog";
import { Card, CardContent } from "@/components/ui/card";
import {
  Shield,
  FileText,
  Clock,
  AlertTriangle,
  HardDrive,
  Lock,
} from "lucide-react";
import { DocumentCategoryType } from "@/types/document";

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 KB";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const familyId = await getActiveFamilyId();

  if (!familyId) {
    return (
      <div className="p-12 text-center bg-card rounded-2xl border max-w-lg mx-auto mt-12 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
          <Shield className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-bold mb-2">No Family Selected</h2>
        <p className="text-muted-foreground text-sm mb-4">
          Please select or create a family in the sidebar to access your secure document vault.
        </p>
      </div>
    );
  }

  const params = await searchParams;
  const [documents, stats] = await Promise.all([
    getDocuments({
      search: params.search,
      category: params.category as DocumentCategoryType | "ALL" | undefined,
      expiryStatus: params.expiryStatus as any,
      sortBy: params.sortBy as any,
      sortOrder: (params.sortOrder as any) || "desc",
    }),
    getDocumentVaultStats(),
  ]);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Family Vault</h1>
            <span className="flex items-center gap-1 text-[11px] font-medium bg-primary/10 text-primary px-2.5 py-0.5 rounded-full border border-primary/20">
              <Lock className="h-3 w-3" />
              End-to-End Protected
            </span>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Encrypted storage for family deeds, policies, IDs, and certificates with signed URL access and expiration alerts.
          </p>
        </div>

        <UploadDocumentDialog />
      </div>

      {/* Vault Overview Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border bg-card shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total Documents</p>
              <p className="text-xl font-bold">{stats.totalDocs}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border bg-card shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Expiring Soon (30d)</p>
              <p className="text-xl font-bold text-amber-600">{stats.expiringSoon}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border bg-card shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Expired Records</p>
              <p className="text-xl font-bold text-rose-600">{stats.expired}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border bg-card shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <HardDrive className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Vault Storage</p>
              <p className="text-xl font-bold">{formatBytes(stats.totalBytes)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Suspense fallback={<div className="h-20 bg-muted/20 animate-pulse rounded-xl" />}>
        <DocumentFilters />
      </Suspense>

      {/* Documents Grid / List */}
      <DocumentList documents={documents} />
    </div>
  );
}
