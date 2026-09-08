"use server";

import prisma from "@/lib/db";
import { getActiveFamilyId } from "@/actions/family";
import {
  AuditLogFilters,
  AuditLogResponse,
  AuditLogItem,
  AuditLogActionType,
  AuditLogDetails,
} from "@/types/audit";
import { authorizeAction } from "@/lib/security";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function getFamilyAuditLogs(filters?: AuditLogFilters): Promise<AuditLogResponse> {
  const familyId = await getActiveFamilyId();
  if (!familyId) {
    return { items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 };
  }

  // Security Gate: Only family OWNER or ADMIN can view security audit logs
  await authorizeAction({
    familyId,
    requiredRoles: ["OWNER", "ADMIN"],
    actionName: "VIEW_AUDIT_LOGS",
  });

  const page = Math.max(1, filters?.page || 1);
  const pageSize = Math.min(100, Math.max(1, filters?.limit || 20));
  const skip = (page - 1) * pageSize;

  const where: Prisma.AuditLogWhereInput = {
    familyId,
  };

  if (filters?.userId) {
    where.userId = filters.userId;
  }

  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }

  if (filters?.actionCategory && filters.actionCategory !== "ALL") {
    switch (filters.actionCategory) {
      case "AUTH":
        where.action = {
          in: [
            "AUTH_LOGIN_SUCCESS",
            "AUTH_LOGIN_FAILED",
            "AUTH_LOGOUT",
            "AUTH_PASSWORD_RESET_REQUESTED",
            "AUTH_PASSWORD_RESET_COMPLETED",
          ],
        };
        break;
      case "FAMILY":
        where.action = {
          in: [
            "FAMILY_CREATED",
            "FAMILY_UPDATED",
            "FAMILY_INVITATION_SENT",
            "FAMILY_INVITATION_ACCEPTED",
            "MEMBER_REMOVED",
            "ROLE_CHANGED",
          ],
        };
        break;
      case "DOCUMENT":
        where.action = {
          in: [
            "DOCUMENT_UPLOADED",
            "DOCUMENT_VIEWED",
            "DOCUMENT_DOWNLOADED",
            "DOCUMENT_UPDATED",
            "DOCUMENT_DELETED",
            "PERMISSION_CHANGED",
          ],
        };
        break;
      case "TASK":
        where.action = {
          in: [
            "TASK_CREATED",
            "TASK_UPDATED",
            "TASK_STATUS_CHANGED",
            "TASK_COMPLETED",
            "TASK_DELETED",
            "TASK_ESCALATION_CREATED",
            "TASK_ESCALATION_DELETED",
            "TASK_ESCALATED",
          ],
        };
        break;
      case "SECURITY":
        where.action = {
          in: [
            "AUTH_LOGIN_FAILED",
            "MEMBER_REMOVED",
            "ROLE_CHANGED",
            "PERMISSION_CHANGED",
            "DOCUMENT_DELETED",
            "TASK_DELETED",
            "TASK_ESCALATED",
          ],
        };
        break;
      case "EMERGENCY":
        where.action = {
          in: [
            "EMERGENCY_CONTACT_CREATED",
            "EMERGENCY_CONTACT_UPDATED",
            "EMERGENCY_CONTACT_DELETED",
            "EMERGENCY_INSTRUCTION_CREATED",
            "EMERGENCY_INSTRUCTION_UPDATED",
            "EMERGENCY_INSTRUCTION_DELETED",
          ],
        };
        break;
    }
  }

  const [total, rawItems] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        family: { select: { id: true, name: true } },
      },
    }),
  ]);

  const items: AuditLogItem[] = rawItems.map((item) => ({
    id: item.id,
    familyId: item.familyId,
    userId: item.userId,
    action: item.action as AuditLogActionType,
    entityType: item.entityType,
    entityId: item.entityId,
    details: (item.details as unknown as AuditLogDetails) || null,
    ipAddress: item.ipAddress,
    userAgent: item.userAgent,
    createdAt: item.createdAt,
    user: item.user,
    family: item.family,
  }));

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getAuditStats() {
  const familyId = await getActiveFamilyId();
  if (!familyId) return { total: 0, security: 0, documents: 0, tasks: 0 };

  await authorizeAction({
    familyId,
    requiredRoles: ["OWNER", "ADMIN"],
    actionName: "VIEW_AUDIT_STATS",
  });

  const [total, security, documents, tasks] = await Promise.all([
    prisma.auditLog.count({ where: { familyId } }),
    prisma.auditLog.count({
      where: {
        familyId,
        action: {
          in: [
            "AUTH_LOGIN_FAILED",
            "MEMBER_REMOVED",
            "ROLE_CHANGED",
            "PERMISSION_CHANGED",
            "DOCUMENT_DELETED",
            "TASK_DELETED",
            "TASK_ESCALATED",
          ],
        },
      },
    }),
    prisma.auditLog.count({
      where: {
        familyId,
        action: {
          in: [
            "DOCUMENT_UPLOADED",
            "DOCUMENT_VIEWED",
            "DOCUMENT_DOWNLOADED",
            "DOCUMENT_UPDATED",
            "DOCUMENT_DELETED",
            "PERMISSION_CHANGED",
          ],
        },
      },
    }),
    prisma.auditLog.count({
      where: {
        familyId,
        action: {
          in: [
            "TASK_CREATED",
            "TASK_UPDATED",
            "TASK_STATUS_CHANGED",
            "TASK_COMPLETED",
            "TASK_DELETED",
          ],
        },
      },
    }),
  ]);

  return { total, security, documents, tasks };
}

export async function clearFamilyAuditLogs(familyId?: string) {
  const targetFamilyId = familyId || (await getActiveFamilyId());
  if (!targetFamilyId) {
    throw new Error("No active family circle found");
  }

  await authorizeAction({
    familyId: targetFamilyId,
    requiredRoles: ["OWNER", "ADMIN"],
    actionName: "CLEAR_AUDIT_LOGS",
  });

  await prisma.auditLog.deleteMany({
    where: { familyId: targetFamilyId },
  });

  revalidatePath("/dashboard/settings");
  return { success: "Audit logs cleared successfully." };
}

