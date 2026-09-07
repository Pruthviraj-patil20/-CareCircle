"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Bell, Menu, Search, LogOut, Settings, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "./Sidebar";
import { Family } from "@prisma/client";
import { logoutAction } from "@/actions/auth";

interface HeaderProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  families?: { family: Pick<Family, "id" | "name"> }[];
  activeFamilyId?: string;
}

export function Header({ user, families, activeFamilyId }: HeaderProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) return email.slice(0, 2).toUpperCase();
    return "CC";
  };

  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-border/60 bg-card/60 backdrop-blur-md px-4 sm:px-6 z-20">
      {/* Mobile Drawer Trigger */}
      <div className="flex items-center gap-3 lg:hidden">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger render={<Button variant="outline" size="icon-sm" className="rounded-lg" />}>
            <Menu className="h-4 w-4" />
            <span className="sr-only">Toggle navigation menu</span>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 border-r border-border/70">
            <Sidebar
              families={families}
              activeFamilyId={activeFamilyId}
              onNavigate={() => setSheetOpen(false)}
            />
          </SheetContent>
        </Sheet>
        <Link href="/dashboard" className="font-bold text-sm tracking-tight flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-primary" />
          CareCircle
        </Link>
      </div>

      {/* Global Search Bar with Shortcut Hint */}
      <div className="flex-1 max-w-md hidden md:block">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search tasks, documents, family records..."
            className="w-full rounded-xl bg-muted/40 pl-9 pr-12 text-xs h-9 border-border/60 focus-visible:ring-primary/30"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-0.5 rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>
      </div>

      {/* Action Utilities & User Avatar */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Notifications */}
        <Link href="/dashboard/notifications">
          <Button variant="ghost" size="icon-sm" className="relative rounded-xl text-muted-foreground hover:text-foreground">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background"></span>
            <span className="sr-only">Notifications</span>
          </Button>
        </Link>

        {/* Theme Switcher */}
        <ThemeToggle />

        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="sm"
                className="rounded-xl p-1 gap-2 text-left hover:bg-muted/60"
              />
            }
          >
            <Avatar className="h-7 w-7 rounded-lg border border-border/80">
              {user?.image && <AvatarImage src={user.image} alt={user.name || "User"} />}
              <AvatarFallback className="text-[11px] font-bold bg-primary/10 text-primary rounded-lg">
                {getInitials(user?.name, user?.email)}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:flex flex-col text-left text-xs leading-tight pr-1">
              <span className="font-semibold text-foreground truncate max-w-[120px]">
                {user?.name || "Family Member"}
              </span>
              <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                {user?.email || "Signed in"}
              </span>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl border border-border/80 p-1.5">
            <DropdownMenuGroup>
              <div className="px-2 py-1.5">
                <p className="text-xs font-semibold text-foreground truncate">{user?.name || "User Account"}</p>
                <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
              </div>
              <Link href="/dashboard/settings">
                <DropdownMenuItem className="rounded-lg text-xs cursor-pointer flex items-center gap-2">
                  <Settings className="w-3.5 h-3.5 text-muted-foreground" />
                  Circle Settings & Profile
                </DropdownMenuItem>
              </Link>
              <Link href="/dashboard/settings">
                <DropdownMenuItem className="rounded-lg text-xs cursor-pointer flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-muted-foreground" />
                  Security & Audit Logs
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => logoutAction()}
                className="rounded-lg text-xs text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer flex items-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
