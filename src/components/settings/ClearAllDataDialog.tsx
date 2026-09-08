"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { clearAllFamilyData } from "@/actions/family";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Layers,
  Calendar,
  FileText,
  Megaphone,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface ClearAllDataDialogProps {
  familyId: string;
  familyName: string;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function ClearAllDataDialog({
  familyId,
  familyName,
  trigger,
  onSuccess,
}: ClearAllDataDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [confirmInput, setConfirmInput] = useState("");
  const router = useRouter();

  // Selection states (all activity selected by default)
  const [clearTasks, setClearTasks] = useState(true);
  const [clearEvents, setClearEvents] = useState(true);
  const [clearDocuments, setClearDocuments] = useState(true);
  const [clearAnnouncements, setClearAnnouncements] = useState(true);
  const [clearEmergency, setClearEmergency] = useState(true);
  const [clearAuditLogs, setClearAuditLogs] = useState(false);

  const isConfirmed = confirmInput.trim().toUpperCase() === "CLEAR";
  const hasSelection =
    clearTasks ||
    clearEvents ||
    clearDocuments ||
    clearAnnouncements ||
    clearEmergency ||
    clearAuditLogs;

  const handleSelectAll = (select: boolean) => {
    setClearTasks(select);
    setClearEvents(select);
    setClearDocuments(select);
    setClearAnnouncements(select);
    setClearEmergency(select);
    setClearAuditLogs(select);
  };

  const handleClear = () => {
    if (!isConfirmed || !hasSelection) return;

    startTransition(async () => {
      try {
        const res = await clearAllFamilyData(familyId, {
          clearTasks,
          clearEvents,
          clearDocuments,
          clearAnnouncements,
          clearEmergency,
          clearNotifications: true,
          clearAuditLogs,
        });

        if (res?.success) {
          toast.success(res.success);
          setOpen(false);
          setConfirmInput("");
          router.refresh();
          if (onSuccess) onSuccess();
        } else {
          toast.error("Failed to clear data.");
        }
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Failed to clear family data.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger ? (
            (trigger as React.ReactElement)
          ) : (
            <Button variant="destructive" size="sm" className="gap-2">
              <Trash2 className="w-4 h-4" />
              Clear All Data
            </Button>
          )
        }
      />

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400 flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                Clear Family Circle Data
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Reset activity records for <span className="font-semibold text-foreground">{familyName}</span>.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Warning Banner */}
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 space-y-1">
            <p className="font-semibold flex items-center gap-1.5 text-xs">
              <ShieldAlert className="w-4 h-4" />
              Destructive Operation
            </p>
            <p className="text-[11px] leading-relaxed text-rose-600/90 dark:text-rose-400/90">
              Selected data will be permanently wiped and dashboard metrics will reset to 0. Family members, circle access, and credentials will not be deleted.
            </p>
          </div>

          {/* Selectable Categories */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground text-xs">Select data to wipe:</span>
              <div className="flex items-center gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => handleSelectAll(true)}
                  className="text-primary hover:underline"
                >
                  Select All
                </button>
                <span className="text-muted-foreground">•</span>
                <button
                  type="button"
                  onClick={() => handleSelectAll(false)}
                  className="text-muted-foreground hover:underline"
                >
                  Deselect All
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label
                className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                  clearTasks
                    ? "bg-card border-rose-500/40 shadow-xs"
                    : "bg-muted/30 border-border/60 opacity-60"
                }`}
              >
                <input
                  type="checkbox"
                  checked={clearTasks}
                  onChange={(e) => setClearTasks(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500"
                />
                <Layers className="w-4 h-4 text-emerald-600" />
                <div>
                  <p className="font-medium text-foreground">Tasks & Assignments</p>
                  <p className="text-[10px] text-muted-foreground">All todo lists & statuses</p>
                </div>
              </label>

              <label
                className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                  clearEvents
                    ? "bg-card border-rose-500/40 shadow-xs"
                    : "bg-muted/30 border-border/60 opacity-60"
                }`}
              >
                <input
                  type="checkbox"
                  checked={clearEvents}
                  onChange={(e) => setClearEvents(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500"
                />
                <Calendar className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="font-medium text-foreground">Calendar Events</p>
                  <p className="text-[10px] text-muted-foreground">Schedules & reminders</p>
                </div>
              </label>

              <label
                className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                  clearDocuments
                    ? "bg-card border-rose-500/40 shadow-xs"
                    : "bg-muted/30 border-border/60 opacity-60"
                }`}
              >
                <input
                  type="checkbox"
                  checked={clearDocuments}
                  onChange={(e) => setClearDocuments(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500"
                />
                <FileText className="w-4 h-4 text-purple-600" />
                <div>
                  <p className="font-medium text-foreground">Vault Documents</p>
                  <p className="text-[10px] text-muted-foreground">Files & permissions</p>
                </div>
              </label>

              <label
                className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                  clearAnnouncements
                    ? "bg-card border-rose-500/40 shadow-xs"
                    : "bg-muted/30 border-border/60 opacity-60"
                }`}
              >
                <input
                  type="checkbox"
                  checked={clearAnnouncements}
                  onChange={(e) => setClearAnnouncements(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500"
                />
                <Megaphone className="w-4 h-4 text-amber-600" />
                <div>
                  <p className="font-medium text-foreground">Announcements</p>
                  <p className="text-[10px] text-muted-foreground">Feed posts & comments</p>
                </div>
              </label>

              <label
                className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                  clearEmergency
                    ? "bg-card border-rose-500/40 shadow-xs"
                    : "bg-muted/30 border-border/60 opacity-60"
                }`}
              >
                <input
                  type="checkbox"
                  checked={clearEmergency}
                  onChange={(e) => setClearEmergency(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500"
                />
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <div>
                  <p className="font-medium text-foreground">Emergency Hub</p>
                  <p className="text-[10px] text-muted-foreground">Contacts & instructions</p>
                </div>
              </label>

              <label
                className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                  clearAuditLogs
                    ? "bg-card border-rose-500/40 shadow-xs"
                    : "bg-muted/30 border-border/60 opacity-60"
                }`}
              >
                <input
                  type="checkbox"
                  checked={clearAuditLogs}
                  onChange={(e) => setClearAuditLogs(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500"
                />
                <ShieldAlert className="w-4 h-4 text-zinc-500" />
                <div>
                  <p className="font-medium text-foreground">Audit Trail Logs</p>
                  <p className="text-[10px] text-muted-foreground">Security activity history</p>
                </div>
              </label>
            </div>
          </div>

          {/* Type Confirmation */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>
                To confirm, type <span className="font-mono text-rose-600 dark:text-rose-400 font-bold">CLEAR</span> below:
              </span>
              {isConfirmed && (
                <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30 gap-1 py-0">
                  <CheckCircle2 className="w-3 h-3" /> Confirmed
                </Badge>
              )}
            </label>
            <Input
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder="Type CLEAR to confirm"
              className="text-xs font-mono"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={!isConfirmed || !hasSelection || isPending}
            onClick={handleClear}
            className="gap-2"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Clearing Data...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Reset & Clear Data
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
