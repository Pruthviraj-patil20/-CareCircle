"use server";

import prisma from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getNotifications() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  return (prisma as any).notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
}

export async function getUnreadNotificationCount() {
  const session = await auth();
  if (!session?.user?.id) return 0;

  return (prisma as any).notification.count({
    where: { userId: session.user.id, isRead: false },
  });
}

export async function markAsRead(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await (prisma as any).notification.update({
    where: { id, userId: session.user.id },
    data: { isRead: true },
  });

  revalidatePath("/dashboard/notifications");
  return { success: true };
}

export async function markAllAsRead() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await (prisma as any).notification.updateMany({
    where: { userId: session.user.id, isRead: false },
    data: { isRead: true },
  });

  revalidatePath("/dashboard/notifications");
  return { success: true };
}

export async function getNotificationPreferences() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  let pref = await (prisma as any).notificationPreference.findUnique({
    where: { userId: session.user.id },
  });

  if (!pref) {
    // Create defaults
    pref = await (prisma as any).notificationPreference.create({
      data: { userId: session.user.id },
    });
  }

  return pref;
}

export async function updateNotificationPreferences(data: any) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await (prisma as any).notificationPreference.update({
    where: { userId: session.user.id },
    data,
  });

  revalidatePath("/dashboard/notifications");
  return { success: "Preferences updated!" };
}
