"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Lock, ShieldCheck, Check, Save } from "lucide-react";
import { toast } from "sonner";
import {
  DocumentPermissionType,
  DocumentPermissionItem,
} from "@/types/document";
import { updateDocumentPermissions } from "@/actions/documents";

interface MemberItem {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string;
}

interface DocumentPermissionsManagerProps {
  documentId: string;
  documentCreatorId: string;
  members: MemberItem[];
  currentPermissions: DocumentPermissionItem[];
  canManage: boolean;
}

const PERMISSION_TYPES: { type: DocumentPermissionType; label: string; desc: string }[] = [
  { type: "VIEW", label: "View", desc: "Can preview" },
  { type: "DOWNLOAD", label: "Download", desc: "Can save file" },
  { type: "EDIT", label: "Edit", desc: "Can update details" },
  { type: "DELETE", label: "Delete", desc: "Can remove file" },
];

export function DocumentPermissionsManager({
  documentId,
  documentCreatorId,
  members,
  currentPermissions,
  canManage,
}: DocumentPermissionsManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Initialize permission state mapping: userId -> Set<DocumentPermissionType>
  const [permMap, setPermMap] = useState<Record<string, Set<DocumentPermissionType>>>(() => {
    const initial: Record<string, Set<DocumentPermissionType>> = {};

    members.forEach((m) => {
      initial[m.id] = new Set<DocumentPermissionType>();
    });

    if (currentPermissions.length > 0) {
      currentPermissions.forEach((p) => {
        if (!initial[p.userId]) initial[p.userId] = new Set();
        initial[p.userId].add(p.permission);
      });
    } else {
      // Default initial state: regular members default to VIEW and DOWNLOAD
      members.forEach((m) => {
        initial[m.id] = new Set(["VIEW", "DOWNLOAD"] as DocumentPermissionType[]);
      });
    }

    return initial;
  });

  const togglePermission = (userId: string, perm: DocumentPermissionType) => {
    if (!canManage) return;

    setPermMap((prev) => {
      const userSet = new Set(prev[userId] || []);
      if (userSet.has(perm)) {
        userSet.delete(perm);
      } else {
        userSet.add(perm);
      }
      return {
        ...prev,
        [userId]: userSet,
      };
    });
  };

  const handleSave = () => {
    startTransition(async () => {
      try {
        const payload = Object.entries(permMap).map(([userId, permsSet]) => ({
          userId,
          permissions: Array.from(permsSet),
        }));

        await updateDocumentPermissions(documentId, payload);
        toast.success("Document access permissions updated successfully!");
        router.refresh();
      } catch (err: any) {
        toast.error(err.message || "Failed to update permissions");
      }
    });
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader className="p-5 pb-3">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Lock className="h-4 w-4 text-primary" />
              Access Control & Permissions
            </CardTitle>
            <CardDescription className="text-xs">
              Manage member rights to view, download, edit, or delete this file.
            </CardDescription>
          </div>
          {canManage && (
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isPending}
              className="gap-1.5 h-8 text-xs shrink-0"
            >
              <Save className="h-3.5 w-3.5" />
              {isPending ? "Saving..." : "Save Rules"}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-5 pt-0 space-y-3">
        <div className="divide-y divide-border/60">
          {members.map((member) => {
            const isPrivileged =
              member.role === "OWNER" ||
              member.role === "ADMIN" ||
              member.id === documentCreatorId;

            const userPerms = permMap[member.id] || new Set();

            return (
              <div
                key={member.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                {/* Member Info */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={member.image || undefined} />
                    <AvatarFallback className="text-xs">
                      {member.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium leading-none truncate">
                        {member.name || member.email}
                      </p>
                      {member.id === documentCreatorId && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-primary/5 text-primary border-primary/20">
                          Uploader
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {member.role.toLowerCase()}
                    </p>
                  </div>
                </div>

                {/* Permission Toggles / Full Access Badge */}
                {isPrivileged ? (
                  <div className="flex items-center gap-1.5">
                    <Badge variant="secondary" className="text-xs font-medium bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Full Access ({member.role === "OWNER" ? "Owner" : member.role === "ADMIN" ? "Admin" : "Creator"})
                    </Badge>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                    {PERMISSION_TYPES.map((pt) => {
                      const isChecked = userPerms.has(pt.type);
                      return (
                        <label
                          key={pt.type}
                          className={`flex items-center gap-1.5 text-xs select-none ${
                            canManage
                              ? "cursor-pointer hover:text-foreground text-muted-foreground"
                              : "cursor-default text-muted-foreground"
                          }`}
                        >
                          <Checkbox
                            checked={isChecked}
                            disabled={!canManage || isPending}
                            onCheckedChange={() => togglePermission(member.id, pt.type)}
                            className="h-3.5 w-3.5"
                          />
                          <span>{pt.label}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
