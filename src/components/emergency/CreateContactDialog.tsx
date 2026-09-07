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
  DialogTrigger,
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
  UserPlus,
  Stethoscope,
  Shield,
  UserCheck,
  HeartPulse,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { createEmergencyContact } from "@/actions/emergency";
import { EmergencyContactTypeEnum } from "@/types/emergency";

export function CreateContactDialog({
  defaultType = "PERSONAL",
}: {
  defaultType?: EmergencyContactTypeEnum;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const [name, setName] = useState("");
  const [type, setType] = useState<EmergencyContactTypeEnum>(defaultType);
  const [relationship, setRelationship] = useState("");
  const [phone, setPhone] = useState("");
  const [alternatePhone, setAlternatePhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [sensitiveInfo, setSensitiveInfo] = useState("");
  const [isEmergencyService, setIsEmergencyService] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Contact name is required");
      return;
    }
    if (!phone.trim()) {
      toast.error("Phone number is required");
      return;
    }

    startTransition(async () => {
      try {
        await createEmergencyContact({
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

        toast.success("Emergency contact added");
        setOpen(false);
        setName("");
        setRelationship("");
        setPhone("");
        setAlternatePhone("");
        setEmail("");
        setAddress("");
        setNotes("");
        setSensitiveInfo("");
        setIsEmergencyService(false);
        router.refresh();
      } catch (err: any) {
        toast.error(err.message || "Failed to create contact");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5">
            <UserPlus className="h-4 w-4" />
            Add Emergency Contact
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Add Emergency Contact
          </DialogTitle>
          <DialogDescription>
            Register doctors, clinics, insurance helplines, or trusted neighbors with instant calling and sensitive info protection.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="contact-name">Contact / Facility Name *</Label>
              <Input
                id="contact-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dr. Sarah Jenkins (Pediatrician)"
                required
              />
            </div>

            <div className="space-y-1">
              <Label>Category *</Label>
              <Select
                value={type}
                onValueChange={(val: any) => setType(val || "PERSONAL")}
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
                      <span>Personal Contact / Neighbor</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="SERVICE">
                    <div className="flex items-center gap-2">
                      <HeartPulse className="h-4 w-4 text-rose-500" />
                      <span>Emergency Service / Facility</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="contact-relationship">Relationship / Role</Label>
              <Input
                id="contact-relationship"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                placeholder="e.g. Primary Physician, Health HMO, Neighbor"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="contact-phone">Primary Phone *</Label>
              <Input
                id="contact-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. (555) 234-5678"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="contact-alt-phone">Alternate / 24h Phone</Label>
              <Input
                id="contact-alt-phone"
                value={alternatePhone}
                onChange={(e) => setAlternatePhone(e.target.value)}
                placeholder="e.g. (555) 999-1234"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="contact-email">Email (Optional)</Label>
              <Input
                id="contact-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="clinic@health.org"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="contact-address">Hospital / Clinic / Residence Address</Label>
            <Input
              id="contact-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 100 Main St, Suite 400, City, ST"
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
              placeholder="Policy ID, Member #, gate security code, medical notes..."
              className="text-xs bg-background"
            />
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Only family Admins and Owners can view unmasked sensitive values.
            </p>
          </div>

          <div className="space-y-1">
            <Label htmlFor="contact-notes">Notes / Instructions</Label>
            <Input
              id="contact-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Call pediatric nurse line for fever over 101F"
            />
          </div>

          <label className="flex items-center gap-2 text-xs select-none cursor-pointer">
            <Checkbox
              checked={isEmergencyService}
              onCheckedChange={(c) => setIsEmergencyService(Boolean(c))}
              className="h-4 w-4"
            />
            <span>Highlight in Top Emergency Speed-Dial cards</span>
          </label>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !name.trim() || !phone.trim()}>
              {isPending ? "Saving..." : "Save Contact"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
