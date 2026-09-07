import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { getActiveFamilyId } from "@/actions/family";
import { getFamilyAnalyticsData } from "@/actions/analytics";
import { AnalyticsDashboardClient } from "@/components/analytics/AnalyticsDashboardClient";
import { AnalyticsSkeleton } from "@/components/analytics/AnalyticsSkeleton";
import { BarChart3, HeartHandshake } from "lucide-react";
import { PageTransition } from "@/components/ui/page-transition";

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const familyId = await getActiveFamilyId();

  if (!familyId) {
    return (
      <div className="p-12 text-center bg-card rounded-2xl border border-border/70 max-w-lg mx-auto mt-12 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
          <BarChart3 className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-bold mb-2">No Family Selected</h2>
        <p className="text-muted-foreground text-sm">
          Please select or create a family in the sidebar to view care insights and workload balance.
        </p>
      </div>
    );
  }

  const analyticsData = await getFamilyAnalyticsData();

  return (
    <PageTransition>
      <div className="space-y-6 max-w-6xl mx-auto pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Family Care Insights</h1>
              <span className="flex items-center gap-1 text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60">
                <HeartHandshake className="h-3 w-3" />
                Shared Balance
              </span>
            </div>
            <p className="text-muted-foreground mt-1 text-sm">
              Insights into shared responsibilities, family momentum, and opportunities to support each other.
            </p>
          </div>
        </div>

        {/* Analytics Content */}
        <Suspense fallback={<AnalyticsSkeleton />}>
          <AnalyticsDashboardClient data={analyticsData} />
        </Suspense>
      </div>
    </PageTransition>
  );
}

