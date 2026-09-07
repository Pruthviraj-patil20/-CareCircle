"use server";

import prisma from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { getActiveFamilyId } from "@/actions/family";
import {
  AnnouncementFilterOptions,
  AnnouncementWithDetails,
  AnnouncementPriorityType,
  AttachmentItem,
} from "@/types/announcement";
import { inngest } from "@/inngest/client";

async function verifyFamilyMembership(familyId: string, userId: string) {
  const membership = await prisma.familyMember.findUnique({
    where: { familyId_userId: { familyId, userId } },
  });
  if (!membership) throw new Error("You are not a member of this family");
  return membership;
}

export async function getAnnouncements(
  filters?: AnnouncementFilterOptions
): Promise<AnnouncementWithDetails[]> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const familyId = await getActiveFamilyId();
  if (!familyId) return [];

  const membership = await verifyFamilyMembership(familyId, session.user.id);

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
    membership.role === "OWNER" || membership.role === "ADMIN";

  return announcements.map((a: any) => {
    const isReadByCurrentUser = a.reads.some(
      (r: any) => r.userId === session.user.id
    );
    const canManage = isPrivileged || a.createdById === session.user.id;

    return {
      ...a,
      isReadByCurrentUser,
      canEdit: canManage,
      canDelete: canManage,
    };
  });
}

export async function createAnnouncement(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const familyId = await getActiveFamilyId();
  if (!familyId) throw new Error("No active family selected");

  await verifyFamilyMembership(familyId, session.user.id);

  const title = (formData.get("title") as string)?.trim();
  const content = (formData.get("content") as string)?.trim();
  const priority = (formData.get("priority") as AnnouncementPriorityType) || "NORMAL";
  const isPinned = formData.get("isPinned") === "true";
  const expiresAtStr = formData.get("expiresAt") as string | null;
  const expiresAt = expiresAtStr ? new Date(expiresAtStr) : null;
  const attachmentsJson = formData.get("attachments") as string | null;

  let attachments: AttachmentItem[] | null = null;
  if (attachmentsJson) {
    try {
      attachments = JSON.parse(attachmentsJson);
    } catch {
      attachments = null;
    }
  }

  if (!title) throw new Error("Announcement title is required");
  if (!content) throw new Error("Announcement content is required");

  const announcement = await (prisma as any).announcement.create({
    data: {
      familyId,
      title,
      content,
      priority,
      isPinned,
      expiresAt,
      attachments: attachments || undefined,
      createdById: session.user.id,
      reads: {
        create: {
          userId: session.user.id, // Author has automatically read it
        },
      },
    },
  });

  // Notify other family members if IMPORTANT or URGENT
  if (priority === "IMPORTANT" || priority === "URGENT") {
    const members = await prisma.familyMember.findMany({
      where: { familyId, userId: { not: session.user.id } },
      select: { userId: true },
    });

    const events = members.map((m) => ({
      name: "notification/dispatch" as const,
      data: {
        userId: m.userId,
        title: `${priority === "URGENT" ? "🚨 Urgent" : "📢 Important"} Announcement`,
        message: `${title}: ${content.slice(0, 100)}${content.length > 100 ? "..." : ""}`,
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
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const announcement = await (prisma as any).announcement.findUnique({
    where: { id },
  });
  if (!announcement) throw new Error("Announcement not found");

  const membership = await verifyFamilyMembership(
    announcement.familyId,
    session.user.id
  );
  const canManage =
    membership.role === "OWNER" ||
    membership.role === "ADMIN" ||
    announcement.createdById === session.user.id;

  if (!canManage) throw new Error("Unauthorized to edit this announcement");

  await (prisma as any).announcement.update({
    where: { id },
    data: {
      title: data.title.trim(),
      content: data.content.trim(),
      priority: data.priority,
      isPinned: data.isPinned,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    },
  });

  revalidatePath("/dashboard/announcements");
  return { success: true };
}

export async function deleteAnnouncement(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const announcement = await (prisma as any).announcement.findUnique({
    where: { id },
  });
  if (!announcement) throw new Error("Announcement not found");

  const membership = await verifyFamilyMembership(
    announcement.familyId,
    session.user.id
  );
  const canManage =
    membership.role === "OWNER" ||
    membership.role === "ADMIN" ||
    announcement.createdById === session.user.id;

  if (!canManage) throw new Error("Unauthorized to delete this announcement");

  await (prisma as any).announcement.delete({
    where: { id },
  });

  revalidatePath("/dashboard/announcements");
  return { success: true };
}

export async function togglePinAnnouncement(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const announcement = await (prisma as any).announcement.findUnique({
    where: { id },
  });
  if (!announcement) throw new Error("Announcement not found");

  const membership = await verifyFamilyMembership(
    announcement.familyId,
    session.user.id
  );
  const canManage =
    membership.role === "OWNER" ||
    membership.role === "ADMIN" ||
    announcement.createdById === session.user.id;

  if (!canManage) throw new Error("Only admins or author can pin/unpin announcements");

  await (prisma as any).announcement.update({
    where: { id },
    data: { isPinned: !announcement.isPinned },
  });

  revalidatePath("/dashboard/announcements");
  return { success: true, isPinned: !announcement.isPinned };
}

export async function markAnnouncementAsRead(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false };

  try {
    await (prisma as any).announcementRead.upsert({
      where: {
        announcementId_userId: {
          announcementId: id,
          userId: session.user.id,
        },
      },
      update: {},
      create: {
        announcementId: id,
        userId: session.user.id,
      },
    });

    revalidatePath("/dashboard/announcements");
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function addAnnouncementComment(
  announcementId: string,
  content: string
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const announcement = await (prisma as any).announcement.findUnique({
    where: { id: announcementId },
  });
  if (!announcement) throw new Error("Announcement not found");

  await verifyFamilyMembership(announcement.familyId, session.user.id);

  if (!content.trim()) throw new Error("Comment cannot be empty");

  const comment = await (prisma as any).announcementComment.create({
    data: {
      announcementId,
      userId: session.user.id,
      content: content.trim(),
    },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
  });

  revalidatePath("/dashboard/announcements");
  return { success: true, comment };
}

export async function deleteAnnouncementComment(commentId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const comment = await (prisma as any).announcementComment.findUnique({
    where: { id: commentId },
    include: { announcement: true },
  });
  if (!comment) throw new Error("Comment not found");

  const membership = await verifyFamilyMembership(
    comment.announcement.familyId,
    session.user.id
  );
  const canManage =
    membership.role === "OWNER" ||
    membership.role === "ADMIN" ||
    comment.userId === session.user.id;

  if (!canManage) throw new Error("Unauthorized to delete this comment");

  await (prisma as any).announcementComment.delete({
    where: { id: commentId },
  });

  revalidatePath("/dashboard/announcements");
  return { success: true };
}
