"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Pin, Bell, Sparkles, History } from "lucide-react";
import { useCallback, useState } from "react";

const FILTER_PILLS = [
  { id: "active", label: "Active Notices", icon: Sparkles },
  { id: "pinned", label: "Pinned", icon: Pin },
  { id: "all", label: "All Announcements", icon: Bell },
  { id: "expired", label: "Expired", icon: History },
];

export function AnnouncementFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const currentFilter = searchParams.get("filter") || "active";

  const updateFilter = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "all" && value !== "ALL") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/dashboard/announcements?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilter("search", search || null);
  };

  return (
    <div className="space-y-3">
      {/* Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {FILTER_PILLS.map((pill) => {
          const Icon = pill.icon;
          const isActive = currentFilter === pill.id;
          return (
            <Button
              key={pill.id}
              type="button"
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => updateFilter("filter", pill.id)}
              className={`rounded-full shrink-0 text-xs transition-all ${
                isActive ? "shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5 mr-1.5" />
              {pill.label}
            </Button>
          );
        })}
      </div>

      {/* Search & Priority Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search announcements..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </form>

        <Select
          value={searchParams.get("priority") || "ALL"}
          onValueChange={(v) => updateFilter("priority", v)}
        >
          <SelectTrigger className="w-full sm:w-[160px] h-9 text-xs">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Priorities</SelectItem>
            <SelectItem value="NORMAL">Normal</SelectItem>
            <SelectItem value="IMPORTANT">Important</SelectItem>
            <SelectItem value="URGENT">Urgent Alert</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
