import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { auth } from "@/lib/auth"
import prisma from "@/lib/db"
import { getActiveFamilyId } from "@/actions/family"
import { redirect } from "next/navigation"

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const families = await prisma.familyMember.findMany({
    where: { userId: session.user.id },
    select: { family: { select: { id: true, name: true } } },
  })

  const activeFamilyId = await getActiveFamilyId() || families[0]?.family.id

  return (
    <DashboardLayout families={families} activeFamilyId={activeFamilyId}>
      {children}
    </DashboardLayout>
  )
}
