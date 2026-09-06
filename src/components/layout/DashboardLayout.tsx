import { Sidebar } from "./Sidebar"
import { Header } from "./Header"
import { Family } from "@prisma/client"

interface DashboardLayoutProps {
  children: React.ReactNode
  families?: { family: Pick<Family, "id" | "name"> }[]
  activeFamilyId?: string
}

export function DashboardLayout({ children, families, activeFamilyId }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar families={families} activeFamilyId={activeFamilyId} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-muted/10 p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
