"use client";

import { useState, useTransition } from "react";
import { FamilyRole } from "@prisma/client";
import { inviteMember } from "@/actions/family";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { MailPlus } from "lucide-react";

export function InviteMemberDialog({ familyId }: { familyId: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<FamilyRole>("MEMBER");

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    startTransition(() => {
      inviteMember(familyId, email, role)
        .then((data) => {
          if (data.success) {
            toast.success(data.success);
            setOpen(false);
            setEmail("");
            setRole("MEMBER");
          }
        })
        .catch((err) => toast.error(err.message || "Failed to invite"));
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <MailPlus className="w-4 h-4 mr-2" />
        Invite Member
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite to Family</DialogTitle>
          <DialogDescription>
            Send an invitation link to add someone to this family.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleInvite} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Email address</Label>
            <Input 
              type="email" 
              placeholder="member@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isPending} 
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select 
              value={role} 
              onValueChange={(v) => setRole(v as FamilyRole)}
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="MEMBER">Member</SelectItem>
                <SelectItem value="CAREGIVER">Caregiver</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Admins can manage the family. Members have standard access. Caregivers have limited access.
            </p>
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Sending..." : "Send Invitation"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
