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
import { PageTransition, HoverCardMotion } from "@/components/ui/page-transition";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata = {
  title: "Family Vault | CareCircle",
  description: "Secure, encrypted family documents, insurance policies, and certificates.",
};

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
      <EmptyState
        icon={Shield}
        title="No Family Selected"
        description="Please select or create a family circle from the sidebar to access your secure document vault."
      />
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
    <PageTransition className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
              <Shield className="w-7 h-7 text-primary" />
              Family Vault
            </h1>
            <span className="flex items-center gap-1 text-[11px] font-semibold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full border border-primary/20">
              <Lock className="h-3 w-3" />
              Encrypted
            </span>
          </div>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
            Protected storage for family deeds, policies, medical records, and certificates with expiring document alerts.
          </p>
        </div>

        <UploadDocumentDialog />
      </div>

      {/* Vault Overview Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <HoverCardMotion>
          <Card className="border border-border/70 bg-card shadow-xs hover:border-primary/40 hover:shadow-md transition-all">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground font-medium uppercase">Total Documents</p>
                <p className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">{stats.totalDocs}</p>
              </div>
            </CardContent>
          </Card>
        </HoverCardMotion>

        <HoverCardMotion>
          <Card className="border border-border/70 bg-card shadow-xs hover:border-amber-500/40 hover:shadow-md transition-all">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground font-medium uppercase">Expiring Soon (30d)</p>
                <p className="text-xl sm:text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">{stats.expiringSoon}</p>
              </div>
            </CardContent>
          </Card>
        </HoverCardMotion>

        <HoverCardMotion>
          <Card className="border border-border/70 bg-card shadow-xs hover:border-rose-500/40 hover:shadow-md transition-all">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground font-medium uppercase">Expired Records</p>
                <p className="text-xl sm:text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">{stats.expired}</p>
              </div>
            </CardContent>
          </Card>
        </HoverCardMotion>

        <HoverCardMotion>
          <Card className="border border-border/70 bg-card shadow-xs hover:border-emerald-500/40 hover:shadow-md transition-all">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <HardDrive className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground font-medium uppercase">Vault Storage</p>
                <p className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">{formatBytes(stats.totalBytes)}</p>
              </div>
            </CardContent>
          </Card>
        </HoverCardMotion>
      </div>

      {/* Filter and Search Bar */}
      <Suspense fallback={<Skeleton className="h-14 rounded-xl" />}>
        <DocumentFilters />
      </Suspense>

      {/* Documents Grid / List */}
      <DocumentList documents={documents} />
    </PageTransition>
  );
}
