import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { Family } from "@prisma/client";

interface DashboardLayoutProps {
  children: React.ReactNode;
  families?: { family: Pick<Family, "id" | "name"> }[];
  activeFamilyId?: string;
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function DashboardLayout({
  children,
  families,
  activeFamilyId,
  user,
}: DashboardLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="hidden lg:flex h-full">
        <Sidebar families={families} activeFamilyId={activeFamilyId} />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Header user={user} families={families} activeFamilyId={activeFamilyId} />
        <main className="flex-1 overflow-y-auto bg-muted/15 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
