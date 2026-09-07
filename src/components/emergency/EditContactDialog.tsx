"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Edit3,
  Stethoscope,
  Shield,
  UserCheck,
  HeartPulse,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { updateEmergencyContact } from "@/actions/emergency";
import { EmergencyContactItem, EmergencyContactTypeEnum } from "@/types/emergency";

interface EditContactDialogProps {
  contact: EmergencyContactItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditContactDialog({
  contact,
  open,
  onOpenChange,
}: EditContactDialogProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const [name, setName] = useState(contact.name);
  const [type, setType] = useState<EmergencyContactTypeEnum>(contact.type);
  const [relationship, setRelationship] = useState(contact.relationship || "");
  const [phone, setPhone] = useState(contact.phone);
  const [alternatePhone, setAlternatePhone] = useState(contact.alternatePhone || "");
  const [email, setEmail] = useState(contact.email || "");
  const [address, setAddress] = useState(contact.address || "");
  const [notes, setNotes] = useState(contact.notes || "");
  const [sensitiveInfo, setSensitiveInfo] = useState(contact.sensitiveInfo || "");
  const [isEmergencyService, setIsEmergencyService] = useState(contact.isEmergencyService);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    startTransition(async () => {
      try {
        await updateEmergencyContact(contact.id, {
          name: name.trim(),
          type,
          relationship: relationship.trim() || undefined,
          phone: phone.trim(),
          alternatePhone: alternatePhone.trim() || undefined,
          email: email.trim() || undefined,
          address: address.trim() || undefined,
          notes: notes.trim() || undefined,
          sensitiveInfo: sensitiveInfo.trim() || undefined,
          isEmergencyService,
        });

        toast.success("Contact updated");
        onOpenChange(false);
        router.refresh();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Failed to update contact");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-primary" />
            Edit Emergency Contact
          </DialogTitle>
          <DialogDescription>
            Update contact details, numbers, or confidential policy codes.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="edit-c-name">Contact / Facility Name *</Label>
              <Input
                id="edit-c-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <Label>Category *</Label>
              <Select
                value={type}
                onValueChange={(val) => setType((val || "PERSONAL") as EmergencyContactTypeEnum)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FAMILY_DOCTOR">
                    <div className="flex items-center gap-2">
                      <Stethoscope className="h-4 w-4 text-blue-500" />
                      <span>Family Doctor / Clinic</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="INSURANCE">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-emerald-500" />
                      <span>Insurance Provider</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="PERSONAL">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-purple-500" />
                      <span>Personal Contact</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="SERVICE">
                    <div className="flex items-center gap-2">
                      <HeartPulse className="h-4 w-4 text-rose-500" />
                      <span>Emergency Service</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="edit-c-rel">Relationship / Specialty</Label>
              <Input
                id="edit-c-rel"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="edit-c-phone">Primary Phone *</Label>
              <Input
                id="edit-c-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="edit-c-alt">Alternate Phone</Label>
              <Input
                id="edit-c-alt"
                value={alternatePhone}
                onChange={(e) => setAlternatePhone(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="edit-c-email">Email</Label>
              <Input
                id="edit-c-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="edit-c-address">Address</Label>
            <Input
              id="edit-c-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          {/* Sensitive info field */}
          <div className="space-y-1 p-3 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-500/5">
            <div className="flex items-center gap-1.5 mb-1 text-xs font-semibold text-amber-800 dark:text-amber-300">
              <Lock className="h-3.5 w-3.5" />
              <span>Confidential Information (Admin Only)</span>
            </div>
            <Input
              value={sensitiveInfo}
              onChange={(e) => setSensitiveInfo(e.target.value)}
              placeholder="Policy ID, Member #, code..."
              className="text-xs bg-background"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="edit-c-notes">Notes</Label>
            <Input
              id="edit-c-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <label className="flex items-center gap-2 text-xs select-none cursor-pointer">
            <Checkbox
              checked={isEmergencyService}
              onCheckedChange={(c) => setIsEmergencyService(Boolean(c))}
              className="h-4 w-4"
            />
            <span>Highlight in Top Emergency Speed-Dial</span>
          </label>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !name.trim() || !phone.trim()}>
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
