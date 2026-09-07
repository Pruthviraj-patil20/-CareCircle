"use client";

import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CreateEventSchema } from "@/lib/validations";
import { createEvent, updateEvent, deleteEvent } from "@/actions/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { EventWithParticipants } from "@/types/calendar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Check, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Member = { id: string; name: string | null; email: string | null; image: string | null };

interface EventFormProps {
  members: Member[];
  event?: EventWithParticipants | null;
  selectedDate?: Date | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function EventForm({ members, event, selectedDate, onSuccess, onCancel }: EventFormProps) {
  const [isPending, startTransition] = useTransition();

  // Format date to local datetime-local string (YYYY-MM-DDThh:mm)
  const formatDateTime = (date: Date) => {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  const defaultStartTime = event 
    ? new Date(event.startTime) 
    : selectedDate 
      ? new Date(selectedDate)
      : new Date();
  
  const defaultEndTime = event 
    ? new Date(event.endTime)
    : new Date(defaultStartTime.getTime() + 60 * 60 * 1000); // +1 hour

  const [participantIds, setParticipantIds] = useState<string[]>(
    event?.participants.map(p => p.user.id) || []
  );

  const toggleParticipant = (id: string) => {
    setParticipantIds(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const form = useForm<z.infer<typeof CreateEventSchema>>({
    resolver: zodResolver(CreateEventSchema),
    defaultValues: {
      title: event?.title || "",
      description: event?.description || "",
      type: event?.type || "OTHER",
      isAllDay: event?.isAllDay || false,
      startTime: formatDateTime(defaultStartTime),
      endTime: formatDateTime(defaultEndTime),
      location: event?.location || "",
      participantIds: participantIds,
    },
  });

  const isAllDay = useWatch({ control: form.control, name: "isAllDay" });

  const onSubmit = (values: z.infer<typeof CreateEventSchema>) => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        Object.entries(values).forEach(([key, value]) => {
          if (key === 'participantIds') return;
          if (value !== undefined && value !== null) {
            formData.append(key, value.toString());
          }
        });
        
        participantIds.forEach(id => formData.append("participantIds", id));

        const result = event
          ? await updateEvent(event.id, formData)
          : await createEvent(formData);

        if (result?.error) {
          toast.error(result.error);
        } else if (result?.success) {
          toast.success(result.success);
          onSuccess();
        }
      } catch {
        toast.error("An error occurred");
      }
    });
  };

  const handleDelete = () => {
    if (!event) return;
    if (!confirm("Are you sure you want to delete this event?")) return;
    
    startTransition(async () => {
      try {
        const result = await deleteEvent(event.id);
        if (result?.success) {
          toast.success(result.success);
          onSuccess();
        }
      } catch {
        toast.error("Failed to delete event");
      }
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Event Title *</Label>
        <Input 
          id="title" 
          disabled={isPending} 
          placeholder="Doctor's Appointment, Birthday Party..." 
          {...form.register("title")} 
        />
        {form.formState.errors.title && <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">Event Type</Label>
          <Select 
            disabled={isPending} 
            defaultValue={form.getValues("type")} 
            onValueChange={(v) => form.setValue("type", v as z.infer<typeof CreateEventSchema>["type"])}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="FAMILY">Family Event</SelectItem>
              <SelectItem value="APPOINTMENT">Appointment</SelectItem>
              <SelectItem value="BIRTHDAY">Birthday</SelectItem>
              <SelectItem value="TRAVEL">Travel</SelectItem>
              <SelectItem value="SCHOOL">School</SelectItem>
              <SelectItem value="RENEWAL">Renewal</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2 pt-8">
          <Checkbox 
            id="isAllDay" 
            checked={isAllDay} 
            onCheckedChange={(c) => form.setValue("isAllDay", c as boolean)}
            disabled={isPending} 
          />
          <Label htmlFor="isAllDay" className="cursor-pointer">All day event</Label>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startTime">Start</Label>
          <Input 
            id="startTime" 
            type={isAllDay ? "date" : "datetime-local"} 
            disabled={isPending} 
            {...form.register("startTime")} 
          />
          {form.formState.errors.startTime && <p className="text-xs text-destructive">{form.formState.errors.startTime.message}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="endTime">End</Label>
          <Input 
            id="endTime" 
            type={isAllDay ? "date" : "datetime-local"} 
            disabled={isPending} 
            {...form.register("endTime")} 
          />
          {form.formState.errors.endTime && <p className="text-xs text-destructive">{form.formState.errors.endTime.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input id="location" disabled={isPending} {...form.register("location")} placeholder="e.g. 123 Main St" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          disabled={isPending}
          {...form.register("description")}
          className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Add notes..."
        />
      </div>

      <div className="space-y-2">
        <Label>Participants</Label>
        <div className="grid grid-cols-2 gap-2 max-h-[120px] overflow-y-auto p-1">
          {members.map((m) => {
            const selected = participantIds.includes(m.id);
            return (
              <div
                key={m.id}
                onClick={() => !isPending && toggleParticipant(m.id)}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-md border text-sm cursor-pointer transition-colors",
                  selected ? "border-primary bg-primary/5" : "hover:bg-muted/50",
                  isPending && "opacity-50 cursor-not-allowed"
                )}
              >
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-[10px]">
                    {(m.name || m.email || "?").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="flex-1 truncate text-xs">{m.name || m.email?.split('@')[0]}</span>
                {selected && <Check className="h-3 w-3 text-primary" />}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-between pt-4">
        {event ? (
          <Button type="button" variant="destructive" size="icon" onClick={handleDelete} disabled={isPending}>
            <Trash2 className="h-4 w-4" />
          </Button>
        ) : (
          <div />
        )}
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : event ? "Save Changes" : "Create Event"}
          </Button>
        </div>
      </div>
    </form>
  );
}
