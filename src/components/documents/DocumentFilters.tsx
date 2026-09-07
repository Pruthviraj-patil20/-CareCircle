"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Search,
  Shield,
  Home,
  GraduationCap,
  Car,
  Landmark,
  User,
  Files,
} from "lucide-react";
import { useCallback, useState } from "react";
import { DocumentCategoryType } from "@/types/document";

const CATEGORY_ITEMS: { value: DocumentCategoryType | "ALL"; label: string; icon: any }[] = [
  { value: "ALL", label: "All Vault", icon: Files },
  { value: "INSURANCE", label: "Insurance", icon: Shield },
  { value: "PROPERTY", label: "Property", icon: Home },
  { value: "EDUCATION", label: "Education", icon: GraduationCap },
  { value: "VEHICLE", label: "Vehicle", icon: Car },
  { value: "FINANCIAL", label: "Financial", icon: Landmark },
  { value: "PERSONAL", label: "Personal", icon: User },
];

export function DocumentFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const currentCategory = searchParams.get("category") || "ALL";

  const updateFilter = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "ALL" && value !== "all") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/dashboard/documents?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilter("search", search || null);
  };

  return (
    <div className="space-y-4">
      {/* Category Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORY_ITEMS.map((cat) => {
          const Icon = cat.icon;
          const isActive = currentCategory === cat.value;
          return (
            <Button
              key={cat.value}
              type="button"
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => updateFilter("category", cat.value === "ALL" ? null : cat.value)}
              className={`rounded-full shrink-0 transition-all ${
                isActive ? "shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5 mr-1.5" />
              {cat.label}
            </Button>
          );
        })}
      </div>

      {/* Search & Select Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents by title, description, or filename..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </form>

        <Select
          value={searchParams.get("expiryStatus") || "ALL"}
          onValueChange={(v) => updateFilter("expiryStatus", v)}
        >
          <SelectTrigger className="w-full sm:w-[170px]">
            <SelectValue placeholder="Expiry Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Expiry States</SelectItem>
            <SelectItem value="ACTIVE">Active (Valid)</SelectItem>
            <SelectItem value="EXPIRING_SOON">Expiring Soon (30d)</SelectItem>
            <SelectItem value="EXPIRED">Expired</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={searchParams.get("sortBy") || "createdAt"}
          onValueChange={(v) => updateFilter("sortBy", v)}
        >
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt">Newest Uploads</SelectItem>
            <SelectItem value="expiryDate">Expiry Date</SelectItem>
            <SelectItem value="title">Document Title</SelectItem>
            <SelectItem value="fileSize">File Size</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
