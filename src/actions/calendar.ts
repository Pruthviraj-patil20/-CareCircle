"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getActiveFamilyId } from "@/actions/family";
import { CreateEventSchema, UpdateEventSchema } from "@/lib/validations";
import { EventTypeType } from "@/types/calendar";
import {
  authorizeAction,
  SecurityError,
} from "@/lib/security";

export async function getEvents(start?: string, end?: string) {
  const familyId = await getActiveFamilyId();
  if (!familyId) return [];

  await authorizeAction({
    familyId,
    actionName: "GET_EVENTS",
  });

  const where: any = { familyId };
  
  if (start && end) {
    where.OR = [
      { startTime: { gte: new Date(start), lte: new Date(end) } },
      { endTime: { gte: new Date(start), lte: new Date(end) } },
      { startTime: { lte: new Date(start) }, endTime: { gte: new Date(end) } },
    ];
  }

  return (prisma as any).event.findMany({
    where,
    include: {
      createdBy: { select: { id: true, name: true, email: true, image: true } },
      participants: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      },
    },
    orderBy: { startTime: "asc" },
  });
}

export async function getEvent(eventId: string) {
  if (!eventId) throw new SecurityError("INVALID_ID", "Event ID is required", 400);

  const event = await (prisma as any).event.findUnique({
    where: { id: eventId },
    include: {
      createdBy: { select: { id: true, name: true, email: true, image: true } },
      participants: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      },
    },
  });

  if (!event) throw new SecurityError("NOT_FOUND", "Event not found", 404);

  await authorizeAction({
    familyId: event.familyId,
    actionName: "GET_EVENT",
  });

  return event;
}

export async function createEvent(formData: FormData) {
  const familyId = await getActiveFamilyId();
  if (!familyId) throw new SecurityError("NO_ACTIVE_FAMILY", "No family selected", 400);

  const ctx = await authorizeAction({
    familyId,
    actionName: "CREATE_EVENT",
  });

  const rawData = {
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || undefined,
    type: formData.get("type") as string,
    isAllDay: formData.get("isAllDay") === "true",
    startTime: formData.get("startTime") as string,
    endTime: formData.get("endTime") as string,
    location: (formData.get("location") as string) || undefined,
    participantIds: formData.getAll("participantIds") as string[],
  };

  const validated = CreateEventSchema.safeParse(rawData);
  if (!validated.success) {
    return { error: validated.error.errors[0].message };
  }

  const { title, description, type, isAllDay, startTime, endTime, location, participantIds } = validated.data;

  // Cross-tenant protection: verify participantIds belong to this family
  let validParticipantIds: string[] = [];
  if (participantIds && participantIds.length > 0) {
    const verifiedMembers = await prisma.familyMember.findMany({
      where: {
        familyId,
        userId: { in: participantIds },
      },
      select: { userId: true },
    });
    validParticipantIds = verifiedMembers.map((m) => m.userId);
  }

  const event = await (prisma as any).event.create({
    data: {
      title,
      description,
      type: type as EventTypeType,
      isAllDay,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      location,
      familyId,
      createdById: ctx.user.id,
      participants: validParticipantIds.length
        ? {
            create: validParticipantIds.map((userId) => ({
              userId,
              assignedById: ctx.user.id,
            })),
          }
        : undefined,
    },
  });

  revalidatePath("/dashboard/calendar");
  return { success: "Event created!", eventId: event.id };
}

export async function updateEvent(eventId: string, formData: FormData) {
  if (!eventId) throw new SecurityError("INVALID_ID", "Event ID is required", 400);

  const event = await (prisma as any).event.findUnique({ where: { id: eventId } });
  if (!event) throw new SecurityError("NOT_FOUND", "Event not found", 404);

  const ctx = await authorizeAction({
    familyId: event.familyId,
    actionName: "UPDATE_EVENT",
  });

  const isManager = ctx.membership!.role === "OWNER" || ctx.membership!.role === "ADMIN";
  const isCreator = event.createdById === ctx.user.id;

  if (!isManager && !isCreator) {
    throw new SecurityError("FORBIDDEN", "Only event creator or family managers can edit events", 403);
  }

  const rawData: Record<string, unknown> = {};
  const title = formData.get("title") as string | null;
  const description = formData.get("description") as string | null;
  const type = formData.get("type") as string | null;
  const isAllDay = formData.get("isAllDay");
  const startTime = formData.get("startTime") as string | null;
  const endTime = formData.get("endTime") as string | null;
  const location = formData.get("location") as string | null;
  const participantIds = formData.getAll("participantIds") as string[];

  if (title) rawData.title = title;
  if (description !== null) rawData.description = description || undefined;
  if (type) rawData.type = type;
  if (isAllDay !== null) rawData.isAllDay = isAllDay === "true";
  if (startTime) rawData.startTime = startTime;
  if (endTime) rawData.endTime = endTime;
  if (location !== null) rawData.location = location || undefined;
  if (participantIds.length > 0) rawData.participantIds = participantIds;

  const validated = UpdateEventSchema.safeParse(rawData);
  if (!validated.success) {
    return { error: validated.error.errors[0].message };
  }

  const data = validated.data;
  const updateData: any = {};
  if (data.title) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.type) updateData.type = data.type as EventTypeType;
  if (data.isAllDay !== undefined) updateData.isAllDay = data.isAllDay;
  if (data.startTime) updateData.startTime = new Date(data.startTime);
  if (data.endTime) updateData.endTime = new Date(data.endTime);
  if (data.location !== undefined) updateData.location = data.location;

  await (prisma as any).event.update({
    where: { id: eventId },
    data: updateData,
  });

  if (data.participantIds) {
    const verifiedMembers = await prisma.familyMember.findMany({
      where: {
        familyId: event.familyId,
        userId: { in: data.participantIds },
      },
      select: { userId: true },
    });
    const validParticipantIds = verifiedMembers.map((m) => m.userId);

    await (prisma as any).eventParticipant.deleteMany({ where: { eventId } });
    if (validParticipantIds.length > 0) {
      await (prisma as any).eventParticipant.createMany({
        data: validParticipantIds.map((userId: string) => ({
          eventId,
          userId,
          assignedById: ctx.user.id,
        })),
      });
    }
  }

  revalidatePath("/dashboard/calendar");
  return { success: "Event updated!" };
}

export async function deleteEvent(eventId: string) {
  if (!eventId) throw new SecurityError("INVALID_ID", "Event ID is required", 400);

  const event = await (prisma as any).event.findUnique({ where: { id: eventId } });
  if (!event) throw new SecurityError("NOT_FOUND", "Event not found", 404);

  const ctx = await authorizeAction({
    familyId: event.familyId,
    actionName: "DELETE_EVENT",
  });

  const isManager = ctx.membership!.role === "OWNER" || ctx.membership!.role === "ADMIN";
  const isCreator = event.createdById === ctx.user.id;

  if (!isManager && !isCreator) {
    throw new SecurityError("FORBIDDEN", "Only event creator or family managers can delete events", 403);
  }

  await (prisma as any).event.delete({ where: { id: eventId } });

  revalidatePath("/dashboard/calendar");
  return { success: "Event deleted!" };
}
