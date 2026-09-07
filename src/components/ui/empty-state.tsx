import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-2xl border border-dashed border-border/80 bg-muted/15 ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4 shadow-xs">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-foreground tracking-tight">{title}</h3>
      <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mt-1 mb-5 leading-relaxed">
        {description}
      </p>

      {actionLabel && (
        <>
          {actionHref ? (
            <Link href={actionHref}>
              <Button size="sm">{actionLabel}</Button>
            </Link>
          ) : (
            <Button size="sm" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
