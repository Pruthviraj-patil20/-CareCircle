import { Clock, MapPin } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface ScheduleEvent {
  id: string
  title: string
  startTime: Date
  endTime?: Date | null
  location?: string | null
  createdBy: { name: string | null }
}

function formatTime(date: Date) {
  return new Date(date).toLocaleTimeString("en-US", { 
    hour: "numeric", 
    minute: "2-digit",
    hour12: true 
  })
}

function isNow(start: Date, end?: Date | null) {
  const now = new Date()
  return now >= new Date(start) && (!end || now <= new Date(end))
}

export function TodaySchedule({ events }: { events: ScheduleEvent[] }) {
  if (events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Today&apos;s Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <Clock className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">No events today</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Enjoy your free day!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Today&apos;s Schedule</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {events.map((event) => {
            const active = isNow(event.startTime, event.endTime)
            return (
              <div
                key={event.id}
                className={cn(
                  "flex gap-3 p-3 rounded-lg border transition-colors",
                  active 
                    ? "border-primary/40 bg-primary/5" 
                    : "border-border/50 hover:bg-muted/50"
                )}
              >
                <div className="flex flex-col items-center text-xs text-muted-foreground min-w-[52px] pt-0.5">
                  <span className={cn("font-medium", active && "text-primary")}>
                    {formatTime(event.startTime)}
                  </span>
                  {event.endTime && (
                    <span className="text-muted-foreground/60">{formatTime(event.endTime)}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{event.title}</p>
                    {active && <Badge className="text-[10px] h-4 px-1.5 shrink-0">Now</Badge>}
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground truncate">{event.location}</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export function TodayScheduleSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader>
        <div className="h-4 w-32 bg-muted rounded" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3 p-3 rounded-lg border">
            <div className="w-12 space-y-1">
              <div className="h-3 bg-muted rounded" />
              <div className="h-3 bg-muted rounded" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
