import { CheckSquare, AlertTriangle, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface Task {
  id: string
  title: string
  priority: string
  status: string
  dueDate?: Date | null
  assignee?: { name: string | null; image: string | null } | null
}

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: "bg-destructive text-destructive-foreground",
  HIGH: "bg-orange-500 text-white",
  MEDIUM: "bg-yellow-500 text-white",
  LOW: "bg-muted text-muted-foreground",
}

function formatDue(date: Date) {
  const now = new Date()
  const due = new Date(date)
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) return { label: `${Math.abs(diffDays)}d overdue`, overdue: true }
  if (diffDays === 0) return { label: "Due today", overdue: false }
  if (diffDays === 1) return { label: "Due tomorrow", overdue: false }
  return { label: `Due in ${diffDays}d`, overdue: false }
}

export function UpcomingTasks({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Upcoming Tasks</CardTitle>
          <Link href="/dashboard/tasks" className="text-xs text-primary hover:underline">View all</Link>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <CheckSquare className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">All caught up!</p>
            <p className="text-xs text-muted-foreground/70 mt-1">No upcoming tasks</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Upcoming Tasks</CardTitle>
        <Link href="/dashboard/tasks" className="text-xs text-primary hover:underline">View all</Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {tasks.map((task) => {
            const due = task.dueDate ? formatDue(task.dueDate) : null
            return (
              <div
                key={task.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className={cn(
                  "h-2 w-2 rounded-full shrink-0 mt-0.5",
                  task.priority === "URGENT" ? "bg-destructive" :
                  task.priority === "HIGH" ? "bg-orange-500" :
                  task.priority === "MEDIUM" ? "bg-yellow-500" : "bg-muted-foreground"
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{task.title}</p>
                  {due && (
                    <div className="flex items-center gap-1 mt-0.5">
                      {due.overdue 
                        ? <AlertTriangle className="h-3 w-3 text-destructive" />
                        : <Clock className="h-3 w-3 text-muted-foreground" />
                      }
                      <span className={cn(
                        "text-xs",
                        due.overdue ? "text-destructive font-medium" : "text-muted-foreground"
                      )}>
                        {due.label}
                      </span>
                    </div>
                  )}
                </div>
                <Badge className={cn("text-[10px] shrink-0", PRIORITY_COLORS[task.priority])}>
                  {task.priority}
                </Badge>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export function UpcomingTasksSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="h-4 w-28 bg-muted rounded" />
        <div className="h-3 w-12 bg-muted rounded" />
      </CardHeader>
      <CardContent className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
            <div className="h-2 w-2 rounded-full bg-muted" />
            <div className="flex-1 space-y-1">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/3" />
            </div>
            <div className="h-4 w-14 bg-muted rounded-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
