import { Card, CardContent } from "@/components/ui/card";

export function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-pulse">
      {/* Top metrics skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border bg-card">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-muted shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-3 w-20 bg-muted rounded" />
                <div className="h-6 w-12 bg-muted rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main chart skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border bg-card p-6 space-y-4">
          <div className="h-5 w-48 bg-muted rounded" />
          <div className="h-64 w-full bg-muted/40 rounded-xl" />
        </Card>
        <Card className="border bg-card p-6 space-y-4">
          <div className="h-5 w-36 bg-muted rounded" />
          <div className="h-64 w-full bg-muted/40 rounded-xl" />
        </Card>
      </div>

      {/* Secondary charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border bg-card p-6 space-y-4">
          <div className="h-5 w-48 bg-muted rounded" />
          <div className="h-60 w-full bg-muted/40 rounded-xl" />
        </Card>
        <Card className="border bg-card p-6 space-y-4">
          <div className="h-5 w-48 bg-muted rounded" />
          <div className="h-60 w-full bg-muted/40 rounded-xl" />
        </Card>
      </div>
    </div>
  );
}
