import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { redirect } from "next/navigation";
import { getActiveFamilyId } from "@/actions/family";
import { getFamilyAuditLogs, getAuditStats } from "@/actions/audit";
import { SettingsView } from "@/components/settings/SettingsView";
import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";
import { PageTransition } from "@/components/ui/page-transition";

export const metadata = {
  title: "Circle Settings & Security | CareCircle",
  description: "Manage family circle configuration, role permissions, and view the immutable security audit log.",
};

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const familyId = await getActiveFamilyId();
  if (!familyId) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Card className="max-w-md w-full text-center p-6 border-dashed">
          <CardContent className="space-y-3 pt-6">
            <Users className="w-10 h-10 mx-auto text-muted-foreground/60" />
            <h2 className="text-lg font-semibold">No Active Family Circle</h2>
            <p className="text-xs text-muted-foreground">
              Please create or join a family circle from your dashboard to configure settings.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const membership = await prisma.familyMember.findUnique({
    where: {
      familyId_userId: {
        familyId,
        userId: session.user.id,
      },
    },
    include: {
      family: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  if (!membership) {
    redirect("/dashboard");
  }

  const isFamilyAdmin = membership.role === "OWNER" || membership.role === "ADMIN";

  let auditData;
  let auditStats;

  if (isFamilyAdmin) {
    [auditData, auditStats] = await Promise.all([
      getFamilyAuditLogs({ page: 1, limit: 15, actionCategory: "ALL" }),
      getAuditStats(),
    ]);
  }

  return (
    <PageTransition>
      <div className="container py-8 px-4 sm:px-6">
        <SettingsView
          family={{
            id: membership.family.id,
            name: membership.family.name,
            description: membership.family.description,
          }}
          currentUser={{
            id: membership.user.id,
            name: membership.user.name,
            email: membership.user.email,
            role: membership.user.role,
          }}
          userFamilyRole={membership.role}
          isFamilyAdmin={isFamilyAdmin}
          auditData={auditData}
          auditStats={auditStats}
        />
      </div>
    </PageTransition>
  );
}
