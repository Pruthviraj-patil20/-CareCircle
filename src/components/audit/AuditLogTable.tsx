"use client";

import React, { useState, useTransition } from "react";
import { AuditLogItem, AuditLogFilters, AuditLogActionType } from "@/types/audit";
import { getFamilyAuditLogs } from "@/actions/audit";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  ShieldAlert,
  ShieldCheck,
  FileText,
  CheckCircle2,
  UserX,
  UserCheck,
  Lock,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Activity,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AuditLogTableProps {
  initialData: {
    items: AuditLogItem[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export function AuditLogTable({ initialData }: AuditLogTableProps) {
  const [data, setData] = useState(initialData);
  const [filters, setFilters] = useState<AuditLogFilters>({
    actionCategory: "ALL",
    search: "",
    page: 1,
    limit: 15,
  });
  const [isPending, startTransition] = useTransition();
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const fetchLogs = (updatedFilters: AuditLogFilters) => {
    startTransition(async () => {
      try {
        const res = await getFamilyAuditLogs(updatedFilters);
        setData(res);
      } catch (err) {
        console.error("Failed to load audit logs:", err);
      }
    });
  };

  const handleCategoryChange = (category: AuditLogFilters["actionCategory"]) => {
    const nextFilters: AuditLogFilters = { ...filters, actionCategory: category, page: 1 };
    setFilters(nextFilters);
    fetchLogs(nextFilters);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const nextFilters = { ...filters, page: 1 };
    fetchLogs(nextFilters);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > data.totalPages) return;
    const nextFilters = { ...filters, page: newPage };
    setFilters(nextFilters);
    fetchLogs(nextFilters);
  };

  const renderActionBadge = (action: AuditLogActionType) => {
    switch (action) {
      case "AUTH_LOGIN_FAILED":
        return (
          <Badge variant="destructive" className="flex items-center gap-1.5 py-1 px-2.5 bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-900/50">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span>Failed Login</span>
          </Badge>
        );
      case "AUTH_LOGIN_SUCCESS":
        return (
          <Badge className="flex items-center gap-1.5 py-1 px-2.5 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-900/50">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Login Success</span>
          </Badge>
        );
      case "MEMBER_REMOVED":
        return (
          <Badge variant="destructive" className="flex items-center gap-1.5 py-1 px-2.5 bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-900/50">
            <UserX className="w-3.5 h-3.5 text-rose-600" />
            <span>Member Removed</span>
          </Badge>
        );
      case "ROLE_CHANGED":
        return (
          <Badge className="flex items-center gap-1.5 py-1 px-2.5 bg-amber-500/15 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-900/50">
            <UserCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>Role Changed</span>
          </Badge>
        );
      case "PERMISSION_CHANGED":
        return (
          <Badge className="flex items-center gap-1.5 py-1 px-2.5 bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-300 dark:border-purple-900/50">
            <Lock className="w-3.5 h-3.5 text-purple-600" />
            <span>Permissions Edited</span>
          </Badge>
        );
      case "DOCUMENT_UPLOADED":
        return (
          <Badge className="flex items-center gap-1.5 py-1 px-2.5 bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-900/50">
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>Document Uploaded</span>
          </Badge>
        );
      case "DOCUMENT_DELETED":
        return (
          <Badge variant="destructive" className="flex items-center gap-1.5 py-1 px-2.5 bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-900/50">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>Document Deleted</span>
          </Badge>
        );
      case "TASK_COMPLETED":
        return (
          <Badge className="flex items-center gap-1.5 py-1 px-2.5 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-900/50">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Task Completed</span>
          </Badge>
        );
      case "TASK_ESCALATED":
      case "TASK_ESCALATION_CREATED":
        return (
          <Badge className="flex items-center gap-1.5 py-1 px-2.5 bg-amber-500/15 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-900/50">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>{action === "TASK_ESCALATED" ? "Task Escalated" : "Escalation Created"}</span>
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="font-mono text-xs">
            {action.replace(/_/g, " ")}
          </Badge>
        );
    }
  };

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
    return "SYS";
  };

  return (
    <div className="space-y-6">
      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex flex-wrap gap-1.5 p-1 bg-muted/60 dark:bg-muted/30 rounded-xl border border-border/50">
          {(
            [
              { id: "ALL", label: "All Events" },
              { id: "SECURITY", label: "Security & Access" },
              { id: "DOCUMENT", label: "Documents" },
              { id: "TASK", label: "Tasks" },
              { id: "FAMILY", label: "Family & Roles" },
              { id: "AUTH", label: "Auth & Logins" },
              { id: "EMERGENCY", label: "Emergency" },
            ] as const
          ).map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                filters.actionCategory === cat.id
                  ? "bg-background text-foreground shadow-sm font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/40"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <form onSubmit={handleSearch} className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search audit trail..."
              value={filters.search || ""}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="pl-9 text-xs h-9"
            />
          </form>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const reset = { actionCategory: "ALL" as const, search: "", page: 1, limit: 15 };
              setFilters(reset);
              fetchLogs(reset);
            }}
            title="Reset filters"
            className="h-9 px-2.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Main Audit Table */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-[180px] font-semibold text-xs">Event & Action</TableHead>
                <TableHead className="font-semibold text-xs">Actor / Initiator</TableHead>
                <TableHead className="font-semibold text-xs">Target & Details</TableHead>
                <TableHead className="font-semibold text-xs">Origin IP</TableHead>
                <TableHead className="font-semibold text-xs">Timestamp</TableHead>
                <TableHead className="w-[80px] text-right font-semibold text-xs">Inspect</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPending ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-36 text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Activity className="w-5 h-5 animate-spin text-primary" />
                      <span className="text-sm">Loading audit events...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : data.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
                      <ShieldCheck className="w-8 h-8 text-muted-foreground/60" />
                      <p className="text-sm font-medium">No audit events found matching the selected filters.</p>
                      <p className="text-xs text-muted-foreground/80">Security events will appear here automatically when actions occur.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data.items.map((log) => (
                  <TableRow key={log.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="align-middle">
                      {renderActionBadge(log.action)}
                    </TableCell>
                    <TableCell className="align-middle">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-7 w-7 border border-border">
                          {log.user?.image && <AvatarImage src={log.user.image} alt={log.user.name || "User"} />}
                          <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                            {getInitials(log.user?.name, log.user?.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-semibold truncate max-w-[140px]">
                            {log.user?.name || log.user?.email || "System"}
                          </span>
                          {log.user?.name && log.user?.email && (
                            <span className="text-[10px] text-muted-foreground truncate max-w-[140px]">
                              {log.user.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="align-middle">
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-foreground">
                          {log.details?.title ||
                            log.details?.fileName ||
                            log.details?.name ||
                            log.details?.invitedEmail ||
                            log.details?.targetUserName ||
                            log.entityType}
                        </span>
                        {log.details && (
                          <span className="text-[11px] text-muted-foreground truncate max-w-[260px]">
                            {log.details.role ? `Role: ${log.details.role}` : ""}
                            {log.details.newRole ? `Promoted to: ${log.details.newRole}` : ""}
                            {log.details.reason ? `Reason: ${log.details.reason}` : ""}
                            {log.details.disposition ? `Mode: ${log.details.disposition}` : ""}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="align-middle font-mono text-[11px] text-muted-foreground">
                      {log.ipAddress ? (
                        <span className="bg-muted px-1.5 py-0.5 rounded text-[10px]">{log.ipAddress}</span>
                      ) : (
                        <span className="text-muted-foreground/60">—</span>
                      )}
                    </TableCell>
                    <TableCell className="align-middle">
                      <div className="flex flex-col">
                        <span className="text-xs font-medium">
                          {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(log.createdAt), "MMM d, yyyy h:mm a")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="align-middle text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedLog(log)}
                        className="h-7 w-7 p-0"
                        title="Inspect payload"
                      >
                        <Eye className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border/60 bg-muted/20 text-xs text-muted-foreground">
          <div>
            Showing <span className="font-semibold text-foreground">{data.items.length}</span> of{" "}
            <span className="font-semibold text-foreground">{data.total}</span> audit records
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(data.page - 1)}
              disabled={data.page <= 1 || isPending}
              className="h-8 px-2.5"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1" />
              Previous
            </Button>
            <span className="px-2 text-xs font-medium">
              Page {data.page} of {Math.max(1, data.totalPages)}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(data.page + 1)}
              disabled={data.page >= data.totalPages || isPending}
              className="h-8 px-2.5"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* Inspect Event Payload Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <ShieldCheck className="w-4 h-4 text-primary" />
              Audit Event Inspection
            </DialogTitle>
            <DialogDescription className="text-xs">
              Cryptographically timestamped record for audit compliance.
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3 text-xs bg-muted/40 p-3 rounded-lg border border-border/60">
                <div>
                  <p className="text-muted-foreground text-[10px] uppercase font-semibold">Event Action</p>
                  <p className="font-mono font-medium">{selectedLog.action}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-[10px] uppercase font-semibold">Entity Type</p>
                  <p className="font-medium">{selectedLog.entityType}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-[10px] uppercase font-semibold">Client IP</p>
                  <p className="font-mono">{selectedLog.ipAddress || "Internal / Server"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-[10px] uppercase font-semibold">Exact Timestamp</p>
                  <p className="font-medium">{format(new Date(selectedLog.createdAt), "yyyy-MM-dd HH:mm:ss OOO")}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground text-[10px] uppercase font-semibold">User-Agent</p>
                  <p className="font-mono text-[11px] break-all">{selectedLog.userAgent || "Unknown"}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold mb-1.5 text-foreground">Metadata Payload</p>
                <div className="bg-muted/80 p-3 rounded-lg border border-border text-[11px] font-mono overflow-auto max-h-52">
                  <pre className="whitespace-pre-wrap break-all">
                    {JSON.stringify(selectedLog.details || {}, null, 2)}
                  </pre>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button size="sm" variant="outline" onClick={() => setSelectedLog(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
