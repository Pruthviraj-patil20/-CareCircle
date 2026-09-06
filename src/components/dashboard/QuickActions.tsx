"use client"

import { CheckSquare, CalendarPlus, Upload, Megaphone } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

const actions = [
  {
    id: "create-task",
    label: "Create Task",
    description: "Assign work to family members",
    icon: CheckSquare,
    href: "/dashboard/tasks",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20",
  },
  {
    id: "add-event",
    label: "Add Event",
    description: "Schedule a family event",
    icon: CalendarPlus,
    href: "/dashboard/calendar",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20",
  },
  {
    id: "upload-document",
    label: "Upload Document",
    description: "Share important files",
    icon: Upload,
    href: "/dashboard/documents",
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/20",
  },
  {
    id: "create-announcement",
    label: "Create Announcement",
    description: "Broadcast to the family",
    icon: Megaphone,
    href: "/dashboard/announcements",
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/20",
  },
]

export function QuickActions() {
  const router = useRouter()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action) => {
            const Icon = action.icon
            return (
              <button
                key={action.id}
                id={action.id}
                onClick={() => router.push(action.href)}
                className={cn(
                  "flex flex-col items-start gap-2 p-3 rounded-xl border text-left transition-all duration-150",
                  "hover:-translate-y-0.5 hover:shadow-sm active:translate-y-0",
                  action.bg
                )}
              >
                <div className={cn("p-2 rounded-lg bg-background/60", action.color)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium leading-none">{action.label}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-snug">{action.description}</p>
                </div>
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
