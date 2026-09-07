import { Metadata } from "next";
import { FamilyCalendar } from "@/components/calendar/FamilyCalendar";
import { getFamilyMembers } from "@/actions/tasks";
import { CalendarDays } from "lucide-react";

export const metadata: Metadata = {
  title: "Family Calendar | CareCircle",
  description: "Shared family calendar for events and appointments",
};

export default async function CalendarPage() {
  const members = await getFamilyMembers();

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <CalendarDays className="h-8 w-8 text-primary" />
            Family Calendar
          </h2>
          <p className="text-muted-foreground">
            Schedule and view all family events and appointments.
          </p>
        </div>
      </div>

      <FamilyCalendar members={members} />
    </div>
  );
}
