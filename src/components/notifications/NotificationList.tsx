"use client";

import { useState, useTransition } from "react";
import { Notification } from "@prisma/client";
import { formatDistanceToNow } from "date-fns";
import { markAsRead, markAllAsRead } from "@/actions/notifications";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, Check, CheckCircle2, Circle, Clock, AlertTriangle, Calendar, FileText, Megaphone, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { toast } from "sonner";

const TypeIcon = ({ type }: { type: string }) => {
  switch (type) {
    case "TASK_ASSIGNED":
    case "TASK_COMPLETED":
      return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
    case "TASK_DUE":
    case "CALENDAR_REMINDER":
      return <Clock className="h-5 w-5 text-blue-500" />;
    case "TASK_OVERDUE":
    case "ESCALATION":
      return <AlertTriangle className="h-5 w-5 text-rose-500" />;
    case "DOCUMENT_EXPIRY":
      return <FileText className="h-5 w-5 text-amber-500" />;
    case "ANNOUNCEMENT":
      return <Megaphone className="h-5 w-5 text-purple-500" />;
    case "FAMILY_INVITATION":
      return <Users className="h-5 w-5 text-indigo-500" />;
    default:
      return <Bell className="h-5 w-5 text-slate-500" />;
  }
};

export function NotificationList({ initialNotifications }: { initialNotifications: Notification[] }) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [isPending, startTransition] = useTransition();

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
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
      <div className="flex flex-col items-center justify-center p-12 text-center border rounded-xl bg-card/50 shadow-sm border-dashed">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Check className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">You're all caught up!</h3>
        <p className="text-muted-foreground max-w-sm">
          No new notifications right now. Enjoy your day!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-1">
        <span className="text-sm text-muted-foreground font-medium">
          {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
        </span>
        {unreadCount > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleMarkAll}
            disabled={isPending}
            className="text-primary hover:text-primary/80"
          >
            Mark all as read
          </Button>
        )}
      </div>
      
      <div className="grid gap-3">
        {notifications.map((n) => (
          <Card 
            key={n.id} 
            className={cn(
              "overflow-hidden transition-all duration-200 border-l-4",
              n.isRead 
                ? "bg-background border-l-transparent shadow-sm opacity-70" 
                : "bg-card border-l-primary shadow-md hover:shadow-lg"
            )}
          >
            <CardContent className="p-0">
              <div className="flex items-start gap-4 p-4 sm:p-5">
                <div className="mt-1 flex-shrink-0 bg-secondary p-2 rounded-full">
                  <TypeIcon type={n.type} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-4 mb-1">
                    <h4 className={cn("text-base font-semibold truncate", !n.isRead && "text-foreground")}>
                      {n.title}
                    </h4>
                    <span className="text-xs text-muted-foreground whitespace-nowrap font-medium flex-shrink-0">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {n.message}
                  </p>
                  
                  <div className="flex items-center gap-3">
                    {n.link && (
                      <Link href={n.link}>
                        <Button variant="outline" size="sm" className="h-8 rounded-full px-4 text-xs font-medium">
                          View Details
                        </Button>
                      </Link>
                    )}
                    
                    {!n.isRead && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 rounded-full px-3 text-xs font-medium hover:bg-primary/10 hover:text-primary"
                        onClick={() => handleMarkAsRead(n.id)}
                      >
                        <Circle className="h-3.5 w-3.5 mr-1.5" />
                        Mark Read
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
