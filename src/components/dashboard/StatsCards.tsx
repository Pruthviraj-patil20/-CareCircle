import { CheckSquare, Calendar, AlertTriangle, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatsData {
  myTasks: number
  dueToday: number
  overdue: number
  familyTasks: number
}

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  description,
  variant = "default"
}: { 
  title: string
  value: number
  icon: React.ElementType
  description: string
  variant?: "default" | "warning" | "danger"
}) {
  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
      variant === "danger" && "border-destructive/30 bg-destructive/5",
      variant === "warning" && "border-orange-500/30 bg-orange-500/5",
    )}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className={cn(
          "text-sm font-medium text-muted-foreground",
          variant === "danger" && "text-destructive",
          variant === "warning" && "text-orange-600 dark:text-orange-400",
        )}>
          {title}
        </CardTitle>
        <div className={cn(
          "p-2 rounded-lg",
          variant === "default" && "bg-primary/10",
          variant === "danger" && "bg-destructive/10",
          variant === "warning" && "bg-orange-500/10",
        )}>
          <Icon className={cn(
            "h-4 w-4",
            variant === "default" && "text-primary",
            variant === "danger" && "text-destructive",
            variant === "warning" && "text-orange-600 dark:text-orange-400",
          )} />
        </div>
      </CardHeader>
      <CardContent>
        <div className={cn(
          "text-3xl font-bold tracking-tight",
          variant === "danger" && "text-destructive",
          variant === "warning" && "text-orange-600 dark:text-orange-400",
        )}>
          {value}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  )
}

export function StatsCards({ stats }: { stats: StatsData }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="My Tasks"
        value={stats.myTasks}
        icon={CheckSquare}
        description="tasks assigned to me"
      />
      <StatCard
        title="Due Today"
        value={stats.dueToday}
        icon={Calendar}
        description="tasks due by end of day"
        variant={stats.dueToday > 0 ? "warning" : "default"}
      />
      <StatCard
        title="Overdue"
        value={stats.overdue}
        icon={AlertTriangle}
        description="tasks past due date"
        variant={stats.overdue > 0 ? "danger" : "default"}
      />
      <StatCard
        title="Family Tasks"
        value={stats.familyTasks}
        icon={Users}
        description="total open family tasks"
      />
    </div>
  )
}

export function StatsCardsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="h-4 w-24 bg-muted rounded" />
            <div className="h-8 w-8 bg-muted rounded-lg" />
          </CardHeader>
          <CardContent>
            <div className="h-8 w-16 bg-muted rounded mb-2" />
            <div className="h-3 w-32 bg-muted rounded" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
