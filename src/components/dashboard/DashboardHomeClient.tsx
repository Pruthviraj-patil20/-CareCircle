"use client";

import React from "react";
import Link from "next/link";
import {
  CheckSquare,
  AlertTriangle,
  Calendar as CalendarIcon,
  FileText,
  PlusCircle,
  ArrowUpRight,
  Clock,
  Sparkles,
  PhoneCall,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageTransition, StaggerContainer, StaggerItem, HoverCardMotion } from "@/components/ui/page-transition";
import { formatDistanceToNow } from "date-fns";

interface DashboardHomeClientProps {
  userName: string;
  familyName: string;
  metrics: {
    pendingTasks: number;
    completedTasks: number;
    upcomingEvents: number;
    documentsCount: number;
    urgentAnnouncements: number;
  };
  recentActivities: {
    id: string;
    title: string;
    type: "TASK" | "EVENT" | "DOCUMENT" | "ANNOUNCEMENT";
    updatedAt: Date;
    authorName: string | null;
    status?: string;
  }[];
}

export function DashboardHomeClient({
  userName,
  familyName,
  metrics,
  recentActivities,
}: DashboardHomeClientProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <PageTransition className="space-y-8">
      {/* Top Banner & Family Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase border-primary/30 text-primary bg-primary/5">
              {familyName}
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {getGreeting()}, {userName}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Here is what needs family coordination and care today.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/dashboard/tasks">
            <Button size="sm" className="gap-2 shadow-sm">
              <PlusCircle className="w-4 h-4" />
              New Task
            </Button>
          </Link>
          <Link href="/dashboard/emergency">
            <Button variant="outline" size="sm" className="gap-2">
              <PhoneCall className="w-3.5 h-3.5 text-destructive" />
              Emergency
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Pending Tasks */}
        <StaggerItem>
          <HoverCardMotion>
            <Card className="hover:border-primary/40 hover:shadow-md transition-all">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Active Tasks
                </CardTitle>
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <CheckSquare className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  {metrics.pendingTasks}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {metrics.completedTasks} tasks completed
                </p>
              </CardContent>
            </Card>
          </HoverCardMotion>
        </StaggerItem>

        {/* Upcoming Events */}
        <StaggerItem>
          <HoverCardMotion>
            <Card className="hover:border-primary/40 hover:shadow-md transition-all">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Upcoming Events
                </CardTitle>
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <CalendarIcon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  {metrics.upcomingEvents}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Scheduled on family calendar
                </p>
              </CardContent>
            </Card>
          </HoverCardMotion>
        </StaggerItem>

        {/* Document Vault */}
        <StaggerItem>
          <HoverCardMotion>
            <Card className="hover:border-primary/40 hover:shadow-md transition-all">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Document Vault
                </CardTitle>
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <FileText className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  {metrics.documentsCount}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Encrypted family documents
                </p>
              </CardContent>
            </Card>
          </HoverCardMotion>
        </StaggerItem>

        {/* Urgent & Important Alerts */}
        <StaggerItem>
          <HoverCardMotion>
            <Card className="hover:border-destructive/40 hover:shadow-md transition-all border-destructive/20 bg-destructive/5">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold text-destructive uppercase tracking-wider">
                  Action Required
                </CardTitle>
                <div className="w-8 h-8 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold tracking-tight text-destructive">
                  {metrics.urgentAnnouncements}
                </div>
                <p className="text-[11px] text-destructive/80 mt-1">
                  Urgent family bulletins
                </p>
              </CardContent>
            </Card>
          </HoverCardMotion>
        </StaggerItem>
      </StaggerContainer>

      {/* Main Content Grid: Activity & Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Family Care Activity */}
        <Card className="col-span-4 border border-border/70 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/40">
            <div>
              <CardTitle className="text-base font-semibold">Recent Care Activities</CardTitle>
              <CardDescription className="text-xs">
                Real-time updates across chores, calendar, and vault
              </CardDescription>
            </div>
            <Link href="/dashboard/tasks">
              <Button variant="ghost" size="sm" className="text-xs gap-1">
                View All
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {recentActivities.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No recent family activity recorded. Create your first task or event to begin.
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {recentActivities.map((act) => (
                  <div key={act.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                        {act.type === "TASK" ? (
                          <CheckSquare className="w-4 h-4" />
                        ) : act.type === "DOCUMENT" ? (
                          <FileText className="w-4 h-4" />
                        ) : (
                          <CalendarIcon className="w-4 h-4" />
                        )}
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate max-w-[260px] sm:max-w-md">
                          {act.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {act.authorName ? `by ${act.authorName}` : "Family task"} •{" "}
                          {formatDistanceToNow(new Date(act.updatedAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    {act.status && (
                      <Badge variant="secondary" className="text-[10px] font-mono capitalize">
                        {act.status.toLowerCase().replace(/_/g, " ")}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Family Shortcuts */}
        <Card className="col-span-3 border border-border/70 shadow-sm">
          <CardHeader className="pb-4 border-b border-border/40">
            <CardTitle className="text-base font-semibold">Quick Tools</CardTitle>
            <CardDescription className="text-xs">Frequent family workflows</CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <Link
              href="/dashboard/tasks"
              className="flex items-center gap-3.5 p-3.5 rounded-xl border border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-105 transition-transform flex-shrink-0">
                <CheckSquare className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                  Assign Task
                </h4>
                <p className="text-[11px] text-muted-foreground truncate">Delegate daily tasks and medications</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>

            <Link
              href="/dashboard/documents"
              className="flex items-center gap-3.5 p-3.5 rounded-xl border border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform flex-shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                  Upload Vault File
                </h4>
                <p className="text-[11px] text-muted-foreground truncate">Insurance, health records, IDs</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>

            <Link
              href="/dashboard/emergency"
              className="flex items-center gap-3.5 p-3.5 rounded-xl border border-destructive/30 bg-destructive/5 hover:border-destructive/50 hover:bg-destructive/10 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-destructive/15 flex items-center justify-center text-destructive group-hover:scale-105 transition-transform flex-shrink-0">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-semibold text-destructive">Emergency Hub</h4>
                <p className="text-[11px] text-destructive/80 truncate">Family doctor, 911, insurance</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-destructive" />
            </Link>

            <Link
              href="/dashboard/analytics"
              className="flex items-center gap-3.5 p-3.5 rounded-xl border border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform flex-shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                  Care Insights
                </h4>
                <p className="text-[11px] text-muted-foreground truncate">Workload balance &amp; &quot;Who needs help?&quot;</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
