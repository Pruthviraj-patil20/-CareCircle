import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { getActiveFamilyId } from "@/actions/family";
import { canManageFamily, canRemoveMember, canChangeRole } from "@/lib/permissions";
import { InviteMemberDialog } from "@/components/family/invite-member-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function MembersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const activeFamilyId = await getActiveFamilyId();

  if (!activeFamilyId) {
    return (
      <div className="p-8 text-center bg-card rounded-lg border">
        <h2 className="text-2xl font-bold mb-2">No Family Selected</h2>
        <p className="text-muted-foreground">
          Please select or create a family from the sidebar to view members.
        </p>
      </div>
    );
  }

  const membership = await prisma.familyMember.findUnique({
    where: { familyId_userId: { familyId: activeFamilyId, userId: session.user.id } },
    include: { family: { include: { members: { include: { user: true } }, invitations: true } } },
  });

  if (!membership) redirect("/dashboard");

  const family = membership.family;
  const isManager = canManageFamily(membership.role);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Family Members</h1>
          <p className="text-muted-foreground mt-1">
            Manage members of {family.name}
          </p>
        </div>
        {isManager && <InviteMemberDialog familyId={activeFamilyId} />}
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {family.members.map((member) => (
              <TableRow key={member.id}>
                <TableCell className="font-medium">
                  {member.user.name || "Unknown"}
                  {member.userId === session.user?.id && (
                    <Badge variant="secondary" className="ml-2">You</Badge>
                  )}
                </TableCell>
                <TableCell>{member.user.email}</TableCell>
                <TableCell>
                  <Badge variant={member.role === "OWNER" ? "default" : "outline"}>
                    {member.role}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(member.createdAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {isManager && family.invitations.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Pending Invitations</h2>
          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Expires</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {family.invitations.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell>{inv.email}</TableCell>
                    <TableCell><Badge variant="outline">{inv.role}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(inv.expires).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
