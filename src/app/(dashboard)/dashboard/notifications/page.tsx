import { Metadata } from "next";
import { getNotifications, getNotificationPreferences } from "@/actions/notifications";
import { NotificationList } from "@/components/notifications/NotificationList";
import { Bell } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export const metadata: Metadata = {
  title: "Notifications | CareCircle",
  description: "View and manage your notifications",
};

export default async function NotificationsPage() {
  const notifications = await getNotifications();
  const preferences = await getNotificationPreferences();

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-[1000px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="h-8 w-8 text-primary" />
            Notifications
          </h2>
          <p className="text-muted-foreground">
            Stay updated on your family's activity.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <NotificationList initialNotifications={notifications as any} />
        </div>
        
        <div className="md:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-lg">Preferences</CardTitle>
              <CardDescription>How you receive alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="emailEnabled" className="flex flex-col space-y-1">
                  <span>Email Alerts</span>
                  <span className="font-normal text-xs text-muted-foreground">Receive daily summaries</span>
                </Label>
                <Switch id="emailEnabled" defaultChecked={preferences.emailEnabled} disabled />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="inAppEnabled" className="flex flex-col space-y-1">
                  <span>In-App Alerts</span>
                  <span className="font-normal text-xs text-muted-foreground">Show in dashboard</span>
                </Label>
                <Switch id="inAppEnabled" defaultChecked={preferences.inAppEnabled} disabled />
              </div>
              
              <div className="border-t pt-4 mt-4 space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground">Categories</h4>
                <div className="flex items-center justify-between">
                  <Label htmlFor="tasks" className="text-sm font-normal">Tasks & Reminders</Label>
                  <Switch id="tasks" defaultChecked={preferences.tasks} disabled />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="calendar" className="text-sm font-normal">Calendar Events</Label>
                  <Switch id="calendar" defaultChecked={preferences.calendar} disabled />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
