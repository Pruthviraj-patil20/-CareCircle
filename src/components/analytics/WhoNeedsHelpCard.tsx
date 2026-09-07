"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HeartHandshake, CheckCircle2, ArrowRight, Clock, AlertCircle } from "lucide-react";
import { SupportOpportunity } from "@/types/analytics";

interface WhoNeedsHelpCardProps {
  opportunities: SupportOpportunity[];
}

export function WhoNeedsHelpCard({ opportunities }: WhoNeedsHelpCardProps) {
  return (
    <Card className="border bg-card shadow-xs">
      <CardHeader className="p-5 pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <HeartHandshake className="h-4 w-4 text-rose-500" />
              Who Could Use a Hand This Week?
            </CardTitle>
            <CardDescription className="text-xs">
              Gentle reminders to step in and share the load with family members who might be stretched thin.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 pt-1 space-y-3">
        {opportunities.length === 0 ? (
          <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-200 dark:border-emerald-900/50 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <p className="font-semibold text-sm text-foreground">
              Workload is Well-Balanced!
            </p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              No family members are currently overwhelmed or behind on tasks. Great teamwork keeping everything running smoothly!
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {opportunities.map((opp) => (
              <div
                key={opp.userId}
                className="p-3 rounded-xl border bg-muted/20 hover:bg-muted/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarImage src={opp.image || undefined} />
                    <AvatarFallback className="text-xs">
                      {opp.name.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm truncate">{opp.name}</span>
                      {opp.overdueCount > 0 ? (
                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0 flex items-center gap-1 font-medium">
                          <AlertCircle className="h-3 w-3" />
                          {opp.overdueCount} due
                        </Badge>
                      ) : (
                        <Badge className="text-[10px] px-1.5 py-0 bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-300 dark:border-sky-800 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {opp.inProgressCount} active
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {opp.message}
                    </p>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs gap-1.5 shrink-0 text-primary hover:text-primary-foreground hover:bg-primary"
                  render={
                    <Link href="/dashboard/tasks">
                      <span>View Tasks</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  }
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
