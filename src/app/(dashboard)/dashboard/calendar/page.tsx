import { Metadata } from "next";
import { FamilyCalendar } from "@/components/calendar/FamilyCalendar";
import { getFamilyMembers } from "@/actions/tasks";
import { CalendarDays } from "lucide-react";
import { PageTransition } from "@/components/ui/page-transition";

export const metadata: Metadata = {
  title: "Family Calendar | CareCircle",
  description: "Shared family calendar for events and appointments",
};

export default async function CalendarPage() {
  const members = await getFamilyMembers();

  return (
    <PageTransition>
      <div className="flex-1 space-y-6 max-w-[1200px] mx-auto pb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2.5">
              <CalendarDays className="h-7 w-7 text-primary" />
              Family Calendar
            </h2>
            <p className="text-muted-foreground text-sm mt-0.5">
              Coordinate visits, doctor appointments, and family events seamlessly.
            </p>
          </div>
        </div>

        <FamilyCalendar members={members} />
      </div>
    </PageTransition>
  );
}

