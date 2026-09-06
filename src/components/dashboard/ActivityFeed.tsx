import { Activity } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface ActivityItem {
  id: string
  action: string
  entityType: string
  entityName: string
  createdAt: Date
  user: { name: string | null; image: string | null }
}

function timeAgo(date: Date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function getInitials(name: string | null) {
  if (!name) return "?"
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
}

const ACTION_COLORS: Record<string, string> = {
  created: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  completed: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  updated: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  deleted: "bg-red-500/10 text-red-600 dark:text-red-400",
  invited: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  uploaded: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
}

export function ActivityFeed({ activities }: { activities: ActivityItem[] }) {
  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <Activity className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">No activity yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Actions in your family will appear here</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((item, idx) => (
            <div key={item.id} className="flex gap-3 items-start">
              <Avatar size="sm" className="shrink-0 mt-0.5">
                <AvatarImage src={item.user.image ?? undefined} />
                <AvatarFallback className="text-xs">{getInitials(item.user.name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-snug">
                  <span className="font-medium">{item.user.name ?? "Someone"}</span>
                  {" "}
                  <span className="text-muted-foreground">{item.action}</span>
                  {" "}
                  <span className="font-medium truncate">&quot;{item.entityName}&quot;</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(item.createdAt)}</p>
              </div>
              {idx !== activities.length - 1 && (
                <div className="absolute left-[39px] mt-7 w-px h-4 bg-border" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function ActivityFeedSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader>
        <div className="h-4 w-28 bg-muted rounded" />
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-3 items-start">
            <div className="h-6 w-6 rounded-full bg-muted shrink-0" />
            <div className="flex-1 space-y-1">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/4" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
