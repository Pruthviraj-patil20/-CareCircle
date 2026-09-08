import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { getActiveFamilyId } from "@/actions/family";
import { canManageFamily } from "@/lib/permissions";
import { InviteMemberDialog } from "@/components/family/invite-member-dialog";
import { PendingInviteActions } from "@/components/family/pending-invite-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Crown, Shield, User, HeartHandshake, Mail, Calendar } from "lucide-react";
import { PageTransition } from "@/components/ui/page-transition";
import { EmptyState } from "@/components/ui/empty-state";
import { format } from "date-fns";

export const metadata = {
  title: "Family Members | CareCircle",
  description: "View and manage family circle members, caregivers, and invitations.",
};

export default async function MembersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const activeFamilyId = await getActiveFamilyId();

  if (!activeFamilyId) {
    return (
      <EmptyState
        icon={Users}
        title="No Family Selected"
        description="Please select or create a family from the sidebar to view members."
      />
    );
  }

  const membership = await prisma.familyMember.findUnique({
    where: { familyId_userId: { familyId: activeFamilyId, userId: session.user.id } },
    include: {
      family: {
        include: {
          members: {
            include: { user: true },
            orderBy: { role: "asc" },
          },
          invitations: {
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });

  if (!membership) redirect("/dashboard");

  const family = membership.family;
  const isManager = canManageFamily(membership.role);

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
    return "U";
  };

  const renderRoleBadge = (role: string) => {
    switch (role) {
      case "OWNER":
        return (
          <Badge className="bg-primary/15 text-primary border border-primary/30 font-semibold gap-1 py-0.5 px-2">
            <Crown className="w-3 h-3 text-primary" />
            Owner
          </Badge>
        );
      case "ADMIN":
        return (
          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-semibold gap-1 py-0.5 px-2">
            <Shield className="w-3 h-3 text-amber-600" />
            Admin
          </Badge>
        );
      case "CAREGIVER":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-semibold gap-1 py-0.5 px-2">
            <HeartHandshake className="w-3 h-3 text-emerald-600" />
            Caregiver
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="gap-1 py-0.5 px-2 font-medium">
            <User className="w-3 h-3 text-muted-foreground" />
            Member
          </Badge>
        );
    }
  };

  return (
    <PageTransition className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="w-7 h-7 text-primary" />
            Family Circle Members
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Members and caregivers sharing responsibilities in <span className="font-semibold text-foreground">{family.name}</span>.
          </p>
        </div>
        {isManager && <InviteMemberDialog familyId={activeFamilyId} familyName={family.name} />}
      </div>

      {/* Members Table */}
      <div className="rounded-2xl border border-border/70 bg-card shadow-xs overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="text-xs font-semibold">Member</TableHead>
              <TableHead className="text-xs font-semibold">Email Address</TableHead>
              <TableHead className="text-xs font-semibold">Role & Access</TableHead>
              <TableHead className="text-xs font-semibold">Member Since</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {family.members.map((member) => (
              <TableRow key={member.id} className="hover:bg-muted/30 transition-colors">
                <TableCell className="py-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-8 w-8 rounded-xl border border-border/80">
                      {member.user.image && <AvatarImage src={member.user.image} alt={member.user.name || "User"} />}
                      <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary rounded-xl">
                        {getInitials(member.user.name, member.user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xs font-semibold text-foreground truncate">
                        {member.user.name || "Family Member"}
                      </span>
                      {member.userId === session.user?.id && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-muted text-muted-foreground border border-border">
                          You
                        </span>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground py-3 font-mono">
                  {member.user.email || "—"}
                </TableCell>
                <TableCell className="py-3">
                  {renderRoleBadge(member.role)}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground py-3">
                  {format(new Date(member.createdAt), "MMM d, yyyy")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pending Invitations */}
      {isManager && family.invitations.filter((inv) => !inv.email.endsWith("@carecircle.internal")).length > 0 && (
        <div className="space-y-3 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase flex items-center gap-2">
              <Mail className="w-4 h-4 text-amber-500" />
              Pending Email Invitations ({family.invitations.filter((inv) => !inv.email.endsWith("@carecircle.internal")).length})
            </h2>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card shadow-xs overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="text-xs font-semibold">Invited Email</TableHead>
                  <TableHead className="text-xs font-semibold">Assigned Role</TableHead>
                  <TableHead className="text-xs font-semibold">Invitation Expiry</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {family.invitations
                  .filter((inv) => !inv.email.endsWith("@carecircle.internal"))
                  .map((inv) => (
                    <TableRow key={inv.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="text-xs font-medium text-foreground py-3 font-mono">
                        {inv.email}
                      </TableCell>
                      <TableCell className="py-3">
                        {renderRoleBadge(inv.role)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground py-3">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                          Expires {format(new Date(inv.expires), "PPP")}
                        </div>
                      </TableCell>
                      <TableCell className="py-2 text-right">
                        <PendingInviteActions
                          invitationId={inv.id}
                          token={inv.token}
                          email={inv.email}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </PageTransition>
  );
}
