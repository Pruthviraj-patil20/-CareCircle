"use client";

import { useState, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import type { DatesSetArg, EventClickArg } from "@fullcalendar/core";
import type { DateClickArg } from "@fullcalendar/interaction";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { EventWithParticipants, EventTypeType } from "@/types/calendar";
import { getEvents } from "@/actions/calendar";
import { EventDialog } from "./EventDialog";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";

type Member = { id: string; name: string | null; email: string | null; image: string | null };

const typeColors: Record<EventTypeType, string> = {
  FAMILY: "#10b981", // Emerald 500
  APPOINTMENT: "#3b82f6", // Blue 500
  BIRTHDAY: "#ec4899", // Pink 500
  TRAVEL: "#f59e0b", // Amber 500
  SCHOOL: "#8b5cf6", // Violet 500
  RENEWAL: "#f43f5e", // Rose 500
  OTHER: "#64748b", // Slate 500
};

export function FamilyCalendar({ members }: { members: Member[] }) {
  const [events, setEvents] = useState<EventWithParticipants[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventWithParticipants | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const calendarRef = useRef<FullCalendar | null>(null);

  const fetchEvents = async (start: Date, end: Date) => {
    try {
      const data = await getEvents(start.toISOString(), end.toISOString());
      setEvents(data as unknown as EventWithParticipants[]);
    } catch {
      toast.error("Failed to load events");
    }
  };

  const handleDatesSet = (arg: DatesSetArg) => {
    fetchEvents(arg.start, arg.end);
  };

  const handleDateClick = (arg: DateClickArg) => {
    setSelectedEvent(null);
    setSelectedDate(arg.date);
    setDialogOpen(true);
  };

  const handleEventClick = (arg: EventClickArg) => {
    const eventId = arg.event.id;
    const event = events.find((e) => e.id === eventId);
    if (event) {
      setSelectedEvent(event);
      setSelectedDate(null);
      setDialogOpen(true);
    }
  };

  const formattedEvents = events.map((e) => ({
    id: e.id,
    title: e.title,
    start: e.startTime,
    end: e.endTime,
    allDay: e.isAllDay,
    backgroundColor: typeColors[e.type] || typeColors.OTHER,
    borderColor: typeColors[e.type] || typeColors.OTHER,
  }));

  const refreshEvents = () => {
    if (calendarRef.current) {
      const api = calendarRef.current.getApi();
      fetchEvents(api.view.activeStart, api.view.activeEnd);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 sm:p-6 overflow-x-auto bg-card border shadow-sm rounded-xl">
        <div className="min-w-[700px]">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            events={formattedEvents}
            datesSet={handleDatesSet}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            height="auto"
            contentHeight="700px"
            dayMaxEvents={true}
            nowIndicator={true}
            eventTimeFormat={{
              hour: 'numeric',
              minute: '2-digit',
              meridiem: 'short'
            }}
            // Some CSS overrides for Tailwind dark mode compatibility
            eventClassNames="cursor-pointer font-medium border-0 shadow-sm"
          />
        </div>
      </Card>

      <EventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        members={members}
        event={selectedEvent}
        selectedDate={selectedDate}
        onSuccess={refreshEvents}
      />
      
      <style jsx global>{`
        .fc-theme-standard td, .fc-theme-standard th {
          border-color: var(--border);
        }
        .fc-theme-standard .fc-scrollgrid {
          border-color: var(--border);
        }
        .fc-button-primary {
          background-color: var(--primary) !important;
          border-color: var(--primary) !important;
          color: var(--primary-foreground) !important;
          border-radius: 0.5rem !important;
          font-size: 0.8rem !important;
          font-weight: 600 !important;
          padding: 0.35rem 0.75rem !important;
        }
        .fc-button-primary:not(:disabled):active,
        .fc-button-primary:not(:disabled).fc-button-active {
          opacity: 0.9 !important;
        }
        .fc .fc-toolbar-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--foreground);
        }
        .fc .fc-col-header-cell-cushion {
          color: var(--foreground);
          padding: 8px 4px;
          font-size: 0.8rem;
          font-weight: 600;
        }
        .fc .fc-daygrid-day-number {
          color: var(--foreground);
          font-weight: 500;
          font-size: 0.8rem;
          padding: 6px;
        }
        .fc .fc-list-event-title a {
          color: var(--foreground);
        }
        .fc .fc-timegrid-axis-cushion, 
        .fc .fc-timegrid-slot-label-cushion {
          color: var(--muted-foreground);
          font-size: 0.75rem;
        }
        .fc-day-today {
          background-color: var(--primary) / 5% !important;
        }
      `}</style>
    </div>
  );
}
