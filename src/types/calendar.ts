import { Event, EventParticipant, User } from "@prisma/client";

export type EventTypeType = "FAMILY" | "APPOINTMENT" | "BIRTHDAY" | "TRAVEL" | "SCHOOL" | "RENEWAL" | "OTHER";

// Loose typing to bypass IDE caching issues
export type LooseEvent = {
  id: string;
  title: string;
  description: string | null;
  type: EventTypeType;
  isAllDay: boolean;
  startTime: Date;
  endTime: Date;
  location: string | null;
  familyId: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
};

export type LooseEventParticipant = {
  id: string;
  eventId: string;
  userId: string;
  assignedById: string;
  createdAt: Date;
};

export type EventWithParticipants = LooseEvent & {
  createdBy: Pick<User, "id" | "name" | "email" | "image">;
  participants: (LooseEventParticipant & {
    user: Pick<User, "id" | "name" | "email" | "image">;
  })[];
};
