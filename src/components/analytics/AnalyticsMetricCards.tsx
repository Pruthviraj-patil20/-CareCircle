"use client";

import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Clock, HeartHandshake, Sparkles } from "lucide-react";
import { TaskSummaryMetrics } from "@/types/analytics";

interface AnalyticsMetricCardsProps {
  metrics: TaskSummaryMetrics;
}

export function AnalyticsMetricCards({ metrics }: AnalyticsMetricCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Family Momentum (Completion Rate) */}
      <Card className="border bg-card shadow-2xs hover:shadow-xs transition-all">
        <CardContent className="p-4 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground font-medium truncate">Family Momentum</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-foreground">
                {metrics.completionRate}%
              </span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                completed
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
              {metrics.completedTasks} of {metrics.totalTasks} total goals
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 2. Shared Victories (Completed Tasks) */}
      <Card className="border bg-card shadow-2xs hover:shadow-xs transition-all">
        <CardContent className="p-4 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground font-medium truncate">Shared Victories</p>
            <p className="text-2xl font-bold tracking-tight text-foreground">
              {metrics.completedTasks}
            </p>
            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
              Tasks accomplished together
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 3. Ongoing Care (Pending & In Progress) */}
      <Card className="border bg-card shadow-2xs hover:shadow-xs transition-all">
        <CardContent className="p-4 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
            <Clock className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground font-medium truncate">Ongoing Care</p>
            <p className="text-2xl font-bold tracking-tight text-foreground">
              {metrics.pendingTasks}
            </p>
            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
              Tasks actively in progress
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 4. Tasks Needing a Hand (Overdue/Due Soon) */}
      <Card className="border bg-card shadow-2xs hover:shadow-xs transition-all">
        <CardContent className="p-4 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <HeartHandshake className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground font-medium truncate">Who Needs a Hand?</p>
            <p className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
              {metrics.overdueTasks}
            </p>
            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
              {metrics.overdueTasks > 0 ? "Tasks ready for mutual support" : "All family duties on schedule"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
