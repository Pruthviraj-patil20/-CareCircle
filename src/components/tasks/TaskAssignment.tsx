"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

type Member = { id: string; name: string | null; email: string | null; image: string | null };

export function TaskAssignment({
  members,
  selectedIds,
  onChange,
  disabled,
}: {
  members: Member[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}) {
  const toggle = (id: string) => {
    if (disabled) return;
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((s) => s !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <div className="space-y-2">
      {members.map((m) => {
        const selected = selectedIds.includes(m.id);
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => toggle(m.id)}
            disabled={disabled}
            className={cn(
              "flex items-center gap-3 w-full rounded-lg border p-3 text-left text-sm transition-colors",
              selected
                ? "border-primary bg-primary/5"
                : "border-border hover:bg-muted/50",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-xs">
                {(m.name || m.email || "?").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{m.name || "Unknown"}</p>
              <p className="text-xs text-muted-foreground truncate">{m.email}</p>
            </div>
            {selected && <Check className="h-4 w-4 text-primary shrink-0" />}
          </button>
        );
      })}
    </div>
  );
}
