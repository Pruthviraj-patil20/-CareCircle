"use client";

import { useState, useTransition } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Phone,
  Mail,
  MapPin,
  Shield,
  Stethoscope,
  HeartPulse,
  UserCheck,
  Lock,
  MoreVertical,
  Trash2,
  Edit3,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { EmergencyContactItem, EmergencyContactTypeEnum } from "@/types/emergency";
import { deleteEmergencyContact } from "@/actions/emergency";
import { EditContactDialog } from "@/components/emergency/EditContactDialog";

interface EmergencyContactCardProps {
  contact: EmergencyContactItem;
  isFamilyAdmin: boolean;
}

const TYPE_META: Record<EmergencyContactTypeEnum, { label: string; icon: any; color: string }> = {
  FAMILY_DOCTOR: {
    label: "Family Doctor / Clinic",
    icon: Stethoscope,
    color: "bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-800",
  },
  INSURANCE: {
    label: "Insurance Contact",
    icon: Shield,
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800",
  },
  PERSONAL: {
    label: "Emergency Contact",
    icon: UserCheck,
    color: "bg-purple-500/10 text-purple-600 border-purple-200 dark:border-purple-800",
  },
  SERVICE: {
    label: "Emergency Service",
    icon: HeartPulse,
    color: "bg-rose-500/10 text-rose-600 border-rose-200 dark:border-rose-800",
  },
  OTHER: {
    label: "Contact",
    icon: UserCheck,
    color: "bg-slate-500/10 text-slate-600 border-slate-200 dark:border-slate-800",
  },
};

export function EmergencyContactCard({
  contact,
  isFamilyAdmin,
}: EmergencyContactCardProps) {
  const [isPending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const meta = TYPE_META[contact.type] || TYPE_META.PERSONAL;
  const MetaIcon = meta.icon;

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteEmergencyContact(contact.id);
        toast.success("Emergency contact removed");
        setDeleteOpen(false);
      } catch (err: any) {
        toast.error(err.message || "Failed to delete contact");
      }
    });
  };

  return (
    <>
      <Card className="border bg-card shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
        <div>
          {/* Card Header */}
          <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0 gap-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`text-xs px-2 py-0.5 font-medium border flex items-center gap-1.5 ${meta.color}`}>
                <MetaIcon className="h-3.5 w-3.5" />
                {meta.label}
              </Badge>
              {contact.isEmergencyService && (
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                  Priority
                </Badge>
              )}
            </div>

            {isFamilyAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  }
                />
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditOpen(true)} className="cursor-pointer">
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit Contact
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setDeleteOpen(true)}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Contact
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </CardHeader>

          {/* Body */}
          <CardContent className="p-4 pt-1 space-y-3">
            <div>
              <h3 className="font-bold text-base text-foreground leading-snug">{contact.name}</h3>
              {contact.relationship && (
                <p className="text-xs text-muted-foreground mt-0.5">{contact.relationship}</p>
              )}
            </div>

            {/* Quick Call Button */}
            <Button
              className="w-full h-10 gap-2 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
              render={
                <a href={`tel:${contact.phone.replace(/[^0-9+]/g, "")}`}>
                  <Phone className="h-4 w-4" />
                  <span>Call {contact.phone}</span>
                </a>
              }
            />

            {/* Alternate contact methods */}
            <div className="space-y-1.5 text-xs text-muted-foreground pt-1">
              {contact.alternatePhone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground/80 shrink-0" />
                  <a
                    href={`tel:${contact.alternatePhone.replace(/[^0-9+]/g, "")}`}
                    className="hover:text-primary transition-colors truncate"
                  >
                    Alt: {contact.alternatePhone}
                  </a>
                </div>
              )}

              {contact.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground/80 shrink-0" />
                  <a href={`mailto:${contact.email}`} className="hover:text-primary transition-colors truncate">
                    {contact.email}
                  </a>
                </div>
              )}

              {contact.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground/80 shrink-0 mt-0.5" />
                  <span className="truncate">{contact.address}</span>
                </div>
              )}
            </div>

            {contact.notes && (
              <div className="p-2.5 rounded-lg bg-muted/40 border text-xs text-foreground/90 whitespace-pre-wrap">
                {contact.notes}
              </div>
            )}

            {/* Sensitive Information Area */}
            {contact.sensitiveInfo && (
              <div className="p-2.5 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-500/10 text-xs">
                <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-semibold mb-1">
                  <Lock className="h-3.5 w-3.5" />
                  <span>Confidential / Policy Details</span>
                </div>
                <p className="font-mono text-xs text-amber-950 dark:text-amber-100">
                  {contact.sensitiveInfo}
                </p>
              </div>
            )}
          </CardContent>
        </div>
      </Card>

      {/* Edit Modal */}
      <EditContactDialog
        contact={contact}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Contact?
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <strong>{contact.name}</strong> from family emergency contacts?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? "Deleting..." : "Delete Contact"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
