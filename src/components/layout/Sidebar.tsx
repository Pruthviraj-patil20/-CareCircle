"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Home, CheckSquare, Calendar, FileText, 
  Megaphone, AlertTriangle, Users, Bell, 
  BarChart2, Settings, ShieldAlert
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Family } from "@prisma/client"
import { FamilySwitcher } from "../family/family-switcher"

const sidebarItems = [
  { name: "Home", href: "/dashboard", icon: Home },
  { name: "Tasks", href: "/dashboard/tasks", icon: CheckSquare },
  { name: "Calendar", href: "/dashboard/calendar", icon: Calendar },
  { name: "Documents", href: "/dashboard/documents", icon: FileText },
  { name: "Announcements", href: "/dashboard/announcements", icon: Megaphone },
  { name: "Emergency", href: "/dashboard/emergency", icon: AlertTriangle, variant: "destructive" },
  { name: "Members", href: "/dashboard/members", icon: Users },
  { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart2 },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

export function Sidebar({ 
  families, 
  activeFamilyId 
}: { 
  families?: { family: Pick<Family, "id" | "name"> }[], 
  activeFamilyId?: string 
}) {
  const pathname = usePathname()

  return (
    <div className="hidden lg:flex h-screen w-64 flex-col border-r border-border/40 bg-background/95 backdrop-blur">
      <div className="flex h-16 items-center border-b border-border/40 px-6">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <ShieldAlert className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg tracking-tight">CareCircle</span>
        </Link>
      </div>
      
      {families && (
        <div className="px-4 py-4 border-b border-border/40">
          <FamilySwitcher families={families} activeFamilyId={activeFamilyId} />
        </div>
      )}

      <div className="flex-1 overflow-auto py-4">
        <nav className="grid gap-1 px-4">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground",
                  isActive ? "bg-primary/10 text-primary hover:bg-primary/20" : "text-muted-foreground",
                  item.variant === "destructive" && "text-destructive hover:bg-destructive/10 hover:text-destructive"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
      <div className="p-4 mt-auto border-t border-border/40">
        <button
          onClick={() => {
            import("@/actions/auth").then((m) => m.logoutAction());
          }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <Settings className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  )
}
