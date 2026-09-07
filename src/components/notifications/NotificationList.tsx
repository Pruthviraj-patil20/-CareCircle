"use client";

import { useState, useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { markAsRead, markAllAsRead } from "@/actions/notifications";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StaggerContainer, StaggerItem } from "@/components/ui/page-transition";
import {
  Bell,
  BellCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Megaphone,
  Users,
  Check,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { toast } from "sonner";

type Notification = {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link?: string | null;
  metadata?: unknown;
  createdAt: Date;
};

const TypeIcon = ({ type }: { type: string }) => {
  switch (type) {
    case "TASK_ASSIGNED":
    case "TASK_COMPLETED":
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    case "TASK_DUE":
    case "CALENDAR_REMINDER":
      return <Clock className="h-4 w-4 text-blue-500" />;
    case "TASK_OVERDUE":
    case "ESCALATION":
      return <AlertTriangle className="h-4 w-4 text-rose-500" />;
    case "DOCUMENT_EXPIRY":
      return <FileText className="h-4 w-4 text-amber-500" />;
    case "ANNOUNCEMENT":
      return <Megaphone className="h-4 w-4 text-purple-500" />;
    case "FAMILY_INVITATION":
      return <Users className="h-4 w-4 text-primary" />;
    default:
      return <Bell className="h-4 w-4 text-muted-foreground" />;
  }
};

export function NotificationList({ initialNotifications }: { initialNotifications: Notification[] }) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [isPending, startTransition] = useTransition();

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, isRead: true } : n)));
    startTransition(async () => {
      await markAsRead(id);
    });
  };

  const handleMarkAll = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    startTransition(async () => {
      const res = await markAllAsRead();
      if (res.success) toast.success("All notifications marked as read");
    });
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (notifications.length === 0) {
    return (
      <EmptyState
        icon={BellCheck}
        title="You're all caught up!"
        description="No new alerts or pending notices right now. We'll notify you as soon as there are updates in your circle."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-1">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {unreadCount > 0 ? (
            <span className="text-primary font-bold">{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</span>
          ) : (
            "All notifications read"
          )}
        </span>
        {unreadCount > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleMarkAll}
            disabled={isPending}
            className="text-xs text-muted-foreground hover:text-foreground h-8"
          >
            <Check className="h-3.5 w-3.5 mr-1" />
            Mark all as read
          </Button>
        )}
      </div>
      
      <StaggerContainer className="grid gap-2.5">
        {notifications.map((n) => (
          <StaggerItem key={n.id}>
            <Card 
              className={cn(
                "overflow-hidden transition-all duration-200 border",
                n.isRead 
                  ? "bg-card/40 border-border/50 opacity-80 hover:opacity-100" 
                  : "bg-card border-primary/30 shadow-xs hover:border-primary/50 hover:shadow-sm"
              )}
            >
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start gap-3.5">
                  <div className={cn(
                    "mt-0.5 flex-shrink-0 p-2 rounded-xl transition-colors",
                    n.isRead ? "bg-muted/50" : "bg-primary/10"
                  )}>
                    <TypeIcon type={n.type} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-3 mb-1">
                      <div className="flex items-center gap-2">
                        {!n.isRead && (
                          <span className="h-2 w-2 rounded-full bg-primary shrink-0 animate-pulse" />
                        )}
                        <h4 className={cn("text-sm font-semibold tracking-tight truncate", !n.isRead ? "text-foreground font-bold" : "text-muted-foreground")}>
                          {n.title}
                        </h4>
                      </div>
                      <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-3">
                      {n.message}
                    </p>
                    
                    <div className="flex items-center gap-2">
                      {n.link && (
                        <Link href={n.link}>
                          <Button variant="secondary" size="sm" className="h-7 text-xs font-medium rounded-lg px-2.5 gap-1 hover:bg-secondary/80">
                            <span>View</span>
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                        </Link>
                      )}
                      
                      {!n.isRead && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 text-xs font-medium rounded-lg px-2.5 text-muted-foreground hover:text-foreground"
                          onClick={() => handleMarkAsRead(n.id)}
                        >
                          <Check className="h-3 w-3 mr-1 text-emerald-500" />
                          Mark read
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </div>
  );
}

