"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { EventForm } from "./EventForm";
import { EventWithParticipants } from "@/types/calendar";

type Member = { id: string; name: string | null; email: string | null; image: string | null };

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: Member[];
  event: EventWithParticipants | null;
  selectedDate: Date | null;
  onSuccess: () => void;
}

export function EventDialog({ open, onOpenChange, members, event, selectedDate, onSuccess }: EventDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{event ? "Edit Event" : "Create Event"}</DialogTitle>
          <DialogDescription>
            {event ? "Make changes to your event." : "Add a new event to the family calendar."}
          </DialogDescription>
        </DialogHeader>
        {open && (
          <EventForm
            key={event?.id || (selectedDate ? selectedDate.toISOString() : "new")}
            members={members}
            event={event}
            selectedDate={selectedDate}
            onSuccess={() => {
              onSuccess();
              onOpenChange(false);
            }}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
