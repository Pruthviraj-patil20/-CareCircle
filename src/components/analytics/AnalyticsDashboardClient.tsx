"use client";

import { FamilyAnalyticsData } from "@/types/analytics";
import { AnalyticsMetricCards } from "./AnalyticsMetricCards";
import { FamilyWorkloadChart } from "./FamilyWorkloadChart";
import { WhoNeedsHelpCard } from "./WhoNeedsHelpCard";
import { WeeklyActivityChart } from "./WeeklyActivityChart";
import { MonthlyTrendChart } from "./MonthlyTrendChart";
import { TaskPriorityDistributionChart } from "./TaskPriorityDistributionChart";
import { AnalyticsEmptyState } from "./AnalyticsEmptyState";

interface AnalyticsDashboardClientProps {
  data: FamilyAnalyticsData;
}

export function AnalyticsDashboardClient({ data }: AnalyticsDashboardClientProps) {
  if (!data.hasAnyData) {
    return <AnalyticsEmptyState />;
  }

  return (
    <div className="space-y-6">
      {/* 1. Four Summary Metric Cards */}
      <AnalyticsMetricCards metrics={data.summary} />

      {/* 2. Primary Row: Shared Family Workload & "Who Needs Help?" */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <FamilyWorkloadChart data={data.memberWorkloads} />
        </div>
        <div>
          <WhoNeedsHelpCard opportunities={data.supportOpportunities} />
        </div>
      </div>

      {/* 3. Secondary Row: Weekly Activity & Priority Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <WeeklyActivityChart data={data.weeklyActivity} />
        </div>
        <div>
          <TaskPriorityDistributionChart data={data.priorityDistribution} />
        </div>
      </div>

      {/* 4. Tertiary Row: Monthly Momentum Trend */}
      <div>
        <MonthlyTrendChart data={data.monthlyActivity} />
      </div>
    </div>
  );
}
