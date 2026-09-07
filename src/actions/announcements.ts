"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getActiveFamilyId } from "@/actions/family";
import {
  AnnouncementFilterOptions,
  AnnouncementWithDetails,
  AnnouncementPriorityType,
  AttachmentItem,
} from "@/types/announcement";
import { inngest } from "@/inngest/client";
import {
  authorizeAction,
  logAuditEvent,
  SecurityError,
} from "@/lib/security";
import {
  CreateAnnouncementSchema,
  UpdateAnnouncementSchema,
  AnnouncementCommentSchema,
} from "@/lib/validations";

export async function getAnnouncements(
  filters?: AnnouncementFilterOptions
): Promise<AnnouncementWithDetails[]> {
  const familyId = await getActiveFamilyId();
  if (!familyId) return [];

  const ctx = await authorizeAction({
    familyId,
    actionName: "GET_ANNOUNCEMENTS",
  });

  const where: any = { familyId };

  if (filters?.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { content: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const now = new Date();
  if (filters?.filter === "active") {
    where.OR = [{ expiresAt: null }, { expiresAt: { gte: now } }];
  } else if (filters?.filter === "expired") {
    where.expiresAt = { lt: now };
  } else if (filters?.filter === "pinned") {
    where.isPinned = true;
  }

  if (filters?.priority && filters.priority !== "ALL") {
    where.priority = filters.priority;
  }

  const announcements = await (prisma as any).announcement.findMany({
    where,
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    include: {
      author: { select: { id: true, name: true, email: true, image: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      },
      reads: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      },
    },
  });

  const isPrivileged =
    ctx.membership!.role === "OWNER" || ctx.membership!.role === "ADMIN";

  return announcements.map((a: any) => {
    const isReadByCurrentUser = a.reads.some(
      (r: any) => r.userId === ctx.user.id
    );
    const canManage = isPrivileged || a.createdById === ctx.user.id;

    return {
      ...a,
      isReadByCurrentUser,
      canEdit: canManage,
      canDelete: canManage,
    };
  });
}

export async function createAnnouncement(formData: FormData) {
  const familyId = await getActiveFamilyId();
  if (!familyId) throw new SecurityError("NO_ACTIVE_FAMILY", "No active family selected", 400);

  const ctx = await authorizeAction({
    familyId,
    actionName: "CREATE_ANNOUNCEMENT",
  });

  const title = (formData.get("title") as string)?.trim();
  const content = (formData.get("content") as string)?.trim();
  const priority = (formData.get("priority") as AnnouncementPriorityType) || "NORMAL";
  const isPinned = formData.get("isPinned") === "true";
  const expiresAtStr = formData.get("expiresAt") as string | null;
  const expiresAt = expiresAtStr ? expiresAtStr : null;
  const attachmentsJson = formData.get("attachments") as string | null;

  let attachments: AttachmentItem[] | null = null;
  if (attachmentsJson) {
    try {
      attachments = JSON.parse(attachmentsJson);
    } catch {
      attachments = null;
    }
  }

  const validated = CreateAnnouncementSchema.safeParse({
    title,
    content,
    priority,
    isPinned,
    expiresAt,
    attachments,
  });

  if (!validated.success) {
    throw new SecurityError("INVALID_INPUT", validated.error.errors[0].message, 400);
  }

  const announcement = await (prisma as any).announcement.create({
    data: {
      familyId,
      title: validated.data.title,
      content: validated.data.content,
      priority: validated.data.priority,
      isPinned: validated.data.isPinned,
      expiresAt: validated.data.expiresAt ? new Date(validated.data.expiresAt) : null,
      attachments: validated.data.attachments || undefined,
      createdById: ctx.user.id,
      reads: {
        create: {
          userId: ctx.user.id,
        },
      },
    },
  });

  await logAuditEvent({
    action: "ANNOUNCEMENT_CREATED",
    entityType: "ANNOUNCEMENT",
    familyId,
    userId: ctx.user.id,
    entityId: announcement.id,
    details: {
      title: validated.data.title,
      priority: validated.data.priority,
      isPinned: validated.data.isPinned,
    },
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
  });

  // Notify other family members if IMPORTANT or URGENT
  if (priority === "IMPORTANT" || priority === "URGENT") {
    const members = await prisma.familyMember.findMany({
      where: { familyId, userId: { not: ctx.user.id } },
      select: { userId: true },
    });

    const events = members.map((m) => ({
      name: "notification/dispatch" as const,
      data: {
        userId: m.userId,
        title: `${priority === "URGENT" ? "🚨 Urgent" : "📢 Important"} Announcement`,
        message: `${validated.data.title}: ${validated.data.content.slice(0, 100)}${validated.data.content.length > 100 ? "..." : ""}`,
        type: "ANNOUNCEMENT" as const,
        link: "/dashboard/announcements",
        sendEmail: priority === "URGENT",
        familyId,
      },
    }));

    if (events.length > 0) {
      await inngest.send(events);
    }
  }

  revalidatePath("/dashboard/announcements");
  return { success: true, id: announcement.id };
}

export async function updateAnnouncement(
  id: string,
  data: {
    title: string;
    content: string;
    priority: AnnouncementPriorityType;
    isPinned: boolean;
    expiresAt?: string | null;
  }
) {
  if (!id) throw new SecurityError("INVALID_ID", "Announcement ID is required", 400);

  const validated = UpdateAnnouncementSchema.safeParse(data);
  if (!validated.success) {
    throw new SecurityError("INVALID_INPUT", validated.error.errors[0].message, 400);
  }

  const announcement = await (prisma as any).announcement.findUnique({
    where: { id },
  });
  if (!announcement) throw new SecurityError("NOT_FOUND", "Announcement not found", 404);

  const ctx = await authorizeAction({
    familyId: announcement.familyId,
    actionName: "UPDATE_ANNOUNCEMENT",
  });

  const canManage =
    ctx.membership!.role === "OWNER" ||
    ctx.membership!.role === "ADMIN" ||
    announcement.createdById === ctx.user.id;

  if (!canManage) throw new SecurityError("FORBIDDEN", "Unauthorized to edit this announcement", 403);

  await (prisma as any).announcement.update({
    where: { id },
    data: {
      title: validated.data.title,
      content: validated.data.content,
      priority: validated.data.priority,
      isPinned: validated.data.isPinned,
      expiresAt: validated.data.expiresAt ? new Date(validated.data.expiresAt) : null,
    },
  });

  await logAuditEvent({
    action: "ANNOUNCEMENT_UPDATED",
    entityType: "ANNOUNCEMENT",
    familyId: announcement.familyId,
    userId: ctx.user.id,
    entityId: id,
    details: { title: validated.data.title, priority: validated.data.priority },
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
  });

  revalidatePath("/dashboard/announcements");
  return { success: true };
}

export async function deleteAnnouncement(id: string) {
  if (!id) throw new SecurityError("INVALID_ID", "Announcement ID is required", 400);

  const announcement = await (prisma as any).announcement.findUnique({
    where: { id },
  });
  if (!announcement) throw new SecurityError("NOT_FOUND", "Announcement not found", 404);

  const ctx = await authorizeAction({
    familyId: announcement.familyId,
    actionName: "DELETE_ANNOUNCEMENT",
  });

  const canManage =
    ctx.membership!.role === "OWNER" ||
    ctx.membership!.role === "ADMIN" ||
    announcement.createdById === ctx.user.id;

  if (!canManage) throw new SecurityError("FORBIDDEN", "Unauthorized to delete this announcement", 403);

  await (prisma as any).announcement.delete({
    where: { id },
  });

  await logAuditEvent({
    action: "ANNOUNCEMENT_DELETED",
    entityType: "ANNOUNCEMENT",
    familyId: announcement.familyId,
    userId: ctx.user.id,
    entityId: id,
    details: { title: announcement.title },
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
  });

  revalidatePath("/dashboard/announcements");
  return { success: true };
}

export async function togglePinAnnouncement(id: string) {
  if (!id) throw new SecurityError("INVALID_ID", "Announcement ID is required", 400);

  const announcement = await (prisma as any).announcement.findUnique({
    where: { id },
  });
  if (!announcement) throw new SecurityError("NOT_FOUND", "Announcement not found", 404);

  const ctx = await authorizeAction({
    familyId: announcement.familyId,
    actionName: "TOGGLE_PIN_ANNOUNCEMENT",
  });

  const canManage =
    ctx.membership!.role === "OWNER" ||
    ctx.membership!.role === "ADMIN" ||
    announcement.createdById === ctx.user.id;

  if (!canManage) throw new SecurityError("FORBIDDEN", "Only admins or the author can pin announcements", 403);

  const updated = await (prisma as any).announcement.update({
    where: { id },
    data: { isPinned: !announcement.isPinned },
  });

  revalidatePath("/dashboard/announcements");
  return { success: true, isPinned: updated.isPinned };
}

export async function markAnnouncementAsRead(id: string) {
  if (!id) return;

  const announcement = await (prisma as any).announcement.findUnique({
    where: { id },
    select: { familyId: true },
  });
  if (!announcement) return;

  const ctx = await authorizeAction({
    familyId: announcement.familyId,
    actionName: "MARK_ANNOUNCEMENT_READ",
  });

  await (prisma as any).announcementRead.upsert({
    where: {
      announcementId_userId: {
        announcementId: id,
        userId: ctx.user.id,
      },
    },
    update: { readAt: new Date() },
    create: {
      announcementId: id,
      userId: ctx.user.id,
    },
  });

  revalidatePath("/dashboard/announcements");
  return { success: true };
}

export async function addAnnouncementComment(announcementId: string, content: string) {
  const validated = AnnouncementCommentSchema.safeParse({ announcementId, content });
  if (!validated.success) {
    throw new SecurityError("INVALID_INPUT", validated.error.errors[0].message, 400);
  }

  const announcement = await (prisma as any).announcement.findUnique({
    where: { id: announcementId },
    select: { familyId: true, title: true },
  });
  if (!announcement) throw new SecurityError("NOT_FOUND", "Announcement not found", 404);

  const ctx = await authorizeAction({
    familyId: announcement.familyId,
    actionName: "ADD_ANNOUNCEMENT_COMMENT",
  });

  const comment = await (prisma as any).announcementComment.create({
    data: {
      announcementId,
      userId: ctx.user.id,
      content: validated.data.content,
    },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
  });

  revalidatePath("/dashboard/announcements");
  return { success: true, comment };
}

export async function deleteAnnouncementComment(commentId: string) {
  if (!commentId) throw new SecurityError("INVALID_ID", "Comment ID is required", 400);

  const comment = await (prisma as any).announcementComment.findUnique({
    where: { id: commentId },
    include: {
      announcement: { select: { familyId: true, createdById: true } },
    },
  });

  if (!comment) throw new SecurityError("NOT_FOUND", "Comment not found", 404);

  const ctx = await authorizeAction({
    familyId: comment.announcement.familyId,
    actionName: "DELETE_ANNOUNCEMENT_COMMENT",
  });

  const canDelete =
    ctx.membership!.role === "OWNER" ||
    ctx.membership!.role === "ADMIN" ||
    comment.userId === ctx.user.id ||
    comment.announcement.createdById === ctx.user.id;

  if (!canDelete) throw new SecurityError("FORBIDDEN", "Unauthorized to delete this comment", 403);

  await (prisma as any).announcementComment.delete({
    where: { id: commentId },
  });

  revalidatePath("/dashboard/announcements");
  return { success: true };
}
