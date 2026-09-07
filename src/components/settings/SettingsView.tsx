"use client";

import React, { useState } from "react";
import { FamilySettingsForm } from "./FamilySettingsForm";
import { AuditLogTable } from "@/components/audit/AuditLogTable";
import { AuditLogItem } from "@/types/audit";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ShieldCheck,
  ShieldAlert,
  Users,
  KeyRound,
  FileCheck2,
  CheckSquare,
  Lock,
  Layers,
  History,
} from "lucide-react";

interface SettingsViewProps {
  family: {
    id: string;
    name: string;
    description: string | null;
  };
  currentUser: {
    id: string;
    name: string | null;
    email: string | null;
    role: string;
  };
  userFamilyRole: string;
  isFamilyAdmin: boolean;
  auditData?: {
    items: AuditLogItem[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  auditStats?: {
    total: number;
    security: number;
    documents: number;
    tasks: number;
  };
}

export function SettingsView({
  family,
  currentUser,
  userFamilyRole,
  isFamilyAdmin,
  auditData,
  auditStats,
}: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState<"family" | "security" | "account">(
    isFamilyAdmin ? "security" : "family"
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-primary" />
            Circle Settings & Security
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Manage your family circle configuration, access controls, and compliance audit trail.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex p-1 bg-muted/60 dark:bg-muted/30 rounded-xl border border-border/50 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("security")}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg transition-all ${
              activeTab === "security"
                ? "bg-background text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-background/40"
            }`}
          >
            <History className="w-4 h-4 text-primary" />
            Audit Logs & Security
          </button>
          <button
            onClick={() => setActiveTab("family")}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg transition-all ${
              activeTab === "family"
                ? "bg-background text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-background/40"
            }`}
          >
            <Users className="w-4 h-4" />
            Family Profile
          </button>
          <button
            onClick={() => setActiveTab("account")}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg transition-all ${
              activeTab === "account"
                ? "bg-background text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-background/40"
            }`}
          >
            <KeyRound className="w-4 h-4" />
            Account
          </button>
        </div>
      </div>

      {/* Security & Audit Logs Tab */}
      {activeTab === "security" && (
        <div className="space-y-6">
          {/* Security Stats Summary Cards */}
          {auditStats && isFamilyAdmin && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border border-border/60 bg-card shadow-sm">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground uppercase">Total Events</p>
                    <p className="text-2xl font-bold tracking-tight text-foreground mt-0.5">{auditStats.total}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Layers className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-border/60 bg-card shadow-sm">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground uppercase">Security & Roles</p>
                    <p className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400 mt-0.5">
                      {auditStats.security}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-border/60 bg-card shadow-sm">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground uppercase">Vault Events</p>
                    <p className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400 mt-0.5">
                      {auditStats.documents}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                    <FileCheck2 className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-border/60 bg-card shadow-sm">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground uppercase">Task Actions</p>
                    <p className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {auditStats.tasks}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                    <CheckSquare className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Table or Restricted Notice */}
          {isFamilyAdmin && auditData ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-foreground">Family Security Audit Trail</h2>
                <p className="text-xs text-muted-foreground">
                  Complete immutable ledger of logins, document modifications, task executions, and role adjustments.
                </p>
              </div>
              <AuditLogTable initialData={auditData} />
            </div>
          ) : (
            <Card className="border border-border/60 p-8 text-center bg-muted/20">
              <div className="flex flex-col items-center justify-center max-w-md mx-auto space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold text-foreground">Admin-Restricted Security Log</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Security audit logs contain sensitive timestamps, IP records, and access histories reserved for Family
                  Owners and Administrators. Your current role is <span className="font-semibold text-foreground">{userFamilyRole}</span>.
                </p>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Family Profile Tab */}
      {activeTab === "family" && (
        <FamilySettingsForm family={family} canManage={isFamilyAdmin} userRole={userFamilyRole} />
      )}

      {/* Account Tab */}
      {activeTab === "account" && (
        <Card className="border border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-primary" />
              Account & Credentials
            </CardTitle>
            <CardDescription className="text-xs">
              Your personal authentication credentials and active session metadata.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-muted/30 p-4 rounded-xl border border-border/60">
              <div>
                <p className="text-muted-foreground font-semibold">Display Name</p>
                <p className="font-medium mt-0.5 text-sm">{currentUser.name || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground font-semibold">Email Address</p>
                <p className="font-medium mt-0.5 text-sm">{currentUser.email || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground font-semibold">User Role</p>
                <p className="font-medium mt-0.5">{currentUser.role}</p>
              </div>
              <div>
                <p className="text-muted-foreground font-semibold">Active Family Circle</p>
                <p className="font-medium mt-0.5">{family.name}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-xs flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">Multi-Factor & Session Hardening Active</p>
                <p className="text-muted-foreground mt-0.5 leading-relaxed">
                  CareCircle strictly monitors session integrity, IP changes, and unauthorized privilege escalation across all devices.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
