"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BarChart3, Plus } from "lucide-react";

export function AnalyticsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-2xl border-2 border-dashed border-border/80 bg-muted/15 max-w-2xl mx-auto my-8">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
        <BarChart3 className="h-8 w-8" />
      </div>
      <h3 className="text-xl font-bold tracking-tight">Family Insights Awaiting Activity</h3>
      <p className="text-muted-foreground text-sm max-w-md mt-1 mb-6">
        As your family creates and shares tasks, CareCircle will automatically generate insights on workload balance, collaborative momentum, and helpful support suggestions.
      </p>
      <Button
        className="gap-2"
        render={
          <Link href="/dashboard/tasks/new">
            <Plus className="h-4 w-4" />
            Create Your First Task
          </Link>
        }
      />
    </div>
  );
}
