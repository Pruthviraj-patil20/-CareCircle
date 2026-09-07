import { Metadata } from "next";
import { getNotifications, getNotificationPreferences } from "@/actions/notifications";
import { NotificationList } from "@/components/notifications/NotificationList";
import { Bell } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { PageTransition } from "@/components/ui/page-transition";

export const metadata: Metadata = {
  title: "Notifications | CareCircle",
  description: "View and manage your notifications",
};

export default async function NotificationsPage() {
  const notifications = await getNotifications();
  const preferences = await getNotificationPreferences();

  return (
    <PageTransition>
      <div className="flex-1 space-y-6 max-w-[1000px] mx-auto pb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2.5">
              <Bell className="h-7 w-7 text-primary" />
              Notifications
            </h2>
            <p className="text-muted-foreground text-sm mt-0.5">
              Stay updated on your family's care schedule and activity.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <NotificationList initialNotifications={notifications as any} />
          </div>
          
          <div className="lg:col-span-1">
            <Card className="sticky top-6 border border-border/70 shadow-xs">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold">Preferences</CardTitle>
                <CardDescription className="text-xs">How you receive circle alerts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="emailEnabled" className="flex flex-col space-y-0.5 cursor-pointer">
                    <span className="text-sm font-medium">Email Alerts</span>
                    <span className="font-normal text-xs text-muted-foreground">Receive daily summaries</span>
                  </Label>
                  <Switch id="emailEnabled" defaultChecked={preferences.emailEnabled} disabled />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="inAppEnabled" className="flex flex-col space-y-0.5 cursor-pointer">
                    <span className="text-sm font-medium">In-App Alerts</span>
                    <span className="font-normal text-xs text-muted-foreground">Show in dashboard</span>
                  </Label>
                  <Switch id="inAppEnabled" defaultChecked={preferences.inAppEnabled} disabled />
                </div>
                
                <div className="border-t border-border/60 pt-4 mt-4 space-y-3">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Categories</h4>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="tasks" className="text-xs font-medium cursor-pointer">Tasks & Reminders</Label>
                    <Switch id="tasks" defaultChecked={preferences.tasks} disabled />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="calendar" className="text-xs font-medium cursor-pointer">Calendar Events</Label>
                    <Switch id="calendar" defaultChecked={preferences.calendar} disabled />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

