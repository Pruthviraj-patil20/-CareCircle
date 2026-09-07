"use client";

import React, { useState, useTransition } from "react";
import { updateFamily } from "@/actions/family";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Shield, Save, CheckCircle2, AlertCircle } from "lucide-react";

interface FamilySettingsFormProps {
  family: {
    id: string;
    name: string;
    description: string | null;
  };
  canManage: boolean;
  userRole: string;
}

export function FamilySettingsForm({ family, canManage, userRole }: FamilySettingsFormProps) {
  const [name, setName] = useState(family.name);
  const [description, setDescription] = useState(family.description || "");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;

    setFeedback(null);
    startTransition(async () => {
      try {
        const res = await updateFamily(family.id, name, description);
        if (res.success) {
          setFeedback({ type: "success", message: res.success });
        }
      } catch (err: any) {
        setFeedback({ type: "error", message: err.message || "Failed to update family circle." });
      }
    });
  };

  return (
    <Card className="border border-border/70 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Family Circle Profile
            </CardTitle>
            <CardDescription className="text-xs">
              Manage your family circle name, description, and primary preferences.
            </CardDescription>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 rounded-full text-primary text-xs font-semibold">
            <Shield className="w-3.5 h-3.5" />
            Your Role: {userRole}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {feedback && (
            <div
              className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                feedback.type === "success"
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20"
              }`}
            >
              {feedback.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Family Circle Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!canManage || isPending}
              placeholder="e.g. Miller Family Circle"
              required
              className="text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Circle Description</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={!canManage || isPending}
              placeholder="Shared notes or circle purpose..."
              className="text-sm"
            />
            <p className="text-[11px] text-muted-foreground">
              Brief summary visible to all participating members and caregivers.
            </p>
          </div>

          {canManage ? (
            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={isPending} size="sm" className="gap-2">
                <Save className="w-4 h-4" />
                {isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          ) : (
            <div className="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground border border-border">
              Only Family Owners and Administrators can modify circle settings.
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
