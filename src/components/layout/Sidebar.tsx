"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  CheckSquare,
  Calendar,
  FileText,
  Megaphone,
  AlertTriangle,
  Users,
  Bell,
  BarChart2,
  Settings,
  ShieldAlert,
  LogOut,
  Sparkles,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Family } from "@prisma/client";
import { FamilySwitcher } from "../family/family-switcher";
import { logoutAction } from "@/actions/auth";

export const sidebarItems = [
  { name: "Home", href: "/dashboard", icon: Home },
  { name: "Tasks", href: "/dashboard/tasks", icon: CheckSquare },
  { name: "Calendar", href: "/dashboard/calendar", icon: Calendar },
  { name: "Documents", href: "/dashboard/documents", icon: FileText },
  { name: "Announcements", href: "/dashboard/announcements", icon: Megaphone },
  { name: "Emergency", href: "/dashboard/emergency", icon: AlertTriangle, variant: "destructive" },
  { name: "Members", href: "/dashboard/members", icon: Users },
  { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart2 },
  { name: "Settings & Security", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar({
  families,
  activeFamilyId,
  onNavigate,
}: {
  families?: { family: Pick<Family, "id" | "name"> }[];
  activeFamilyId?: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-border/60 bg-card/60 backdrop-blur-md">
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-border/60 px-5">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-2.5 transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-primary/80 flex items-center justify-center text-primary-foreground shadow-sm shadow-primary/25">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base tracking-tight text-foreground flex items-center gap-1">
              CareCircle
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 bg-primary/10 text-primary rounded-full">
                SaaS
              </span>
            </span>
            <span className="text-[10px] text-muted-foreground">Family Care Hub</span>
          </div>
        </Link>
      </div>

      {/* Family Switcher */}
      {families && (
        <div className="px-4 py-3.5 border-b border-border/50 bg-muted/20">
          <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider mb-1.5 px-0.5">
            Active Circle
          </p>
          <FamilySwitcher families={families} activeFamilyId={activeFamilyId} />
        </div>
      )}

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto py-3 px-3">
        <nav className="space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-all duration-150 outline-none select-none",
                  isActive
                    ? "bg-primary/10 text-primary font-semibold shadow-2xs dark:bg-primary/15"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground active:scale-[0.99]",
                  item.variant === "destructive" &&
                    (isActive
                      ? "bg-destructive/15 text-destructive font-semibold"
                      : "text-destructive/80 hover:bg-destructive/10 hover:text-destructive")
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-primary" />
                )}
                <Icon
                  className={cn(
                    "h-4 w-4 transition-transform duration-150 group-hover:scale-110",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                    item.variant === "destructive" && "text-destructive"
                  )}
                />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User / Sign Out Footer */}
      <div className="p-3 mt-auto border-t border-border/60 bg-muted/10">
        <button
          onClick={() => logoutAction()}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground transition-all duration-150 hover:bg-destructive/10 hover:text-destructive active:scale-[0.98] cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
