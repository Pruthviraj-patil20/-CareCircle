"use client";

// Bypassing IDE cache issues for newly generated Prisma types
export type TaskAuditLog = {
  id: string;
  taskId: string;
  action: string;
  details: string | null;
  createdAt: Date;
};

import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Activity } from "lucide-react";

interface TaskAuditHistoryProps {
  logs: TaskAuditLog[];
}

export function TaskAuditHistory({ logs }: TaskAuditHistoryProps) {
  if (!logs || logs.length === 0) {
    return null; // Don't show the component if there's no history yet
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5 text-muted-foreground" />
          Audit History
        </CardTitle>
        <CardDescription>Automated actions performed on this task.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative border-l border-muted ml-3 space-y-6">
          {logs.map((log) => (
            <div key={log.id} className="relative pl-6">
              <span className="absolute -left-2 top-1 h-4 w-4 rounded-full border-2 border-background bg-primary"></span>
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm">{log.action}</span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(log.createdAt), "MMM d, h:mm a")}
                  </span>
                </div>
                {log.details && (
                  <p className="text-sm text-muted-foreground bg-muted/30 p-2 rounded-md border inline-block mt-1">
                    {log.details}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
