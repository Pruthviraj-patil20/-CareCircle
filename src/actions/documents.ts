"use server";

import prisma from "@/lib/db";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getActiveFamilyId } from "@/actions/family";
import {
  DocumentCategoryType,
  DocumentPermissionType,
  DocumentFilterOptions,
  DocumentWithDetails,
} from "@/types/document";
import {
  uploadFile,
  getPreviewSignedUrl,
  getDownloadSignedUrl,
  deleteFile,
} from "@/lib/storage";
import {
  authorizeAction,
  logAuditEvent,
  SecurityError,
} from "@/lib/security";
import {
  UploadDocumentMetadataSchema,
  UpdateDocumentSchema,
  UpdateDocumentPermissionsSchema,
} from "@/lib/validations";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

export async function getUserDocumentPermissions(
  doc: { createdById: string; permissions?: Array<{ userId: string; permission: string }> },
  userId: string,
  userFamilyRole: string
): Promise<{ canView: boolean; canDownload: boolean; canEdit: boolean; canDelete: boolean }> {
  // Family OWNER or ADMIN, or document creator has full permissions
  if (userFamilyRole === "OWNER" || userFamilyRole === "ADMIN" || doc.createdById === userId) {
    return { canView: true, canDownload: true, canEdit: true, canDelete: true };
  }

  // Check explicit permissions in DocumentPermission table
  const userPerms = (doc.permissions || [])
    .filter((p) => p.userId === userId)
    .map((p) => p.permission);

  // If there are explicit permissions recorded for this document, enforce them strictly
  const hasAnyExplicitRules = (doc.permissions || []).length > 0;
  if (hasAnyExplicitRules) {
    return {
      canView: userPerms.includes("VIEW"),
      canDownload: userPerms.includes("DOWNLOAD"),
      canEdit: userPerms.includes("EDIT"),
      canDelete: userPerms.includes("DELETE"),
    };
  }

  // Default behavior if no custom permissions configured: family members can VIEW & DOWNLOAD
  return {
    canView: true,
    canDownload: true,
    canEdit: false,
    canDelete: false,
  };
}

export async function getDocuments(filters?: DocumentFilterOptions): Promise<DocumentWithDetails[]> {
  const familyId = await getActiveFamilyId();
  if (!familyId) return [];

  const ctx = await authorizeAction({
    familyId,
    actionName: "GET_DOCUMENTS",
  });

  const where: Prisma.DocumentWhereInput = { familyId };

  if (filters?.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
      { fileName: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  if (filters?.category && filters.category !== "ALL") {
    where.category = filters.category;
  }

  const now = new Date();
  if (filters?.expiryStatus === "EXPIRING_SOON") {
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    where.expiryDate = { gte: now, lte: in30Days };
  } else if (filters?.expiryStatus === "EXPIRED") {
    where.expiryDate = { lt: now };
  } else if (filters?.expiryStatus === "ACTIVE") {
    where.OR = [
      { expiryDate: null },
      { expiryDate: { gte: now } },
    ];
  }

  const orderBy: Prisma.DocumentOrderByWithRelationInput = {};
  const sortBy = filters?.sortBy || "createdAt";
  const sortOrder = filters?.sortOrder || "desc";

  if (sortBy === "title") orderBy.title = sortOrder;
  else if (sortBy === "fileSize") orderBy.fileSize = sortOrder;
  else if (sortBy === "expiryDate") orderBy.expiryDate = sortOrder;
  else orderBy.createdAt = sortOrder;

  const docs = await prisma.document.findMany({
    where,
    orderBy,
    include: {
      createdBy: { select: { id: true, name: true, email: true, image: true } },
      permissions: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      },
    },
  });

  const result: DocumentWithDetails[] = [];
  for (const doc of docs) {
    const perms = await getUserDocumentPermissions(doc, ctx.user.id, ctx.membership!.role);
    if (perms.canView) {
      result.push({
        ...doc,
        userPermissions: perms,
      });
    }
  }

  return result;
}

export async function getDocument(documentId: string): Promise<DocumentWithDetails> {
  if (!documentId) throw new SecurityError("INVALID_ID", "Document ID is required", 400);

  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      createdBy: { select: { id: true, name: true, email: true, image: true } },
      permissions: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      },
    },
  });

  if (!doc) throw new SecurityError("NOT_FOUND", "Document not found", 404);

  const ctx = await authorizeAction({
    familyId: doc.familyId,
    actionName: "GET_DOCUMENT",
  });

  const perms = await getUserDocumentPermissions(doc, ctx.user.id, ctx.membership!.role);
  if (!perms.canView) {
    throw new SecurityError("FORBIDDEN_DOCUMENT_ACCESS", "You do not have permission to view this document", 403);
  }

  return {
    ...doc,
    userPermissions: perms,
  };
}

export async function uploadDocument(formData: FormData) {
  const familyId = await getActiveFamilyId();
  if (!familyId) throw new SecurityError("NO_ACTIVE_FAMILY", "No active family selected", 400);

  const ctx = await authorizeAction({
    familyId,
    actionName: "UPLOAD_DOCUMENT",
  });

  const file = formData.get("file") as File | null;
  if (!file || typeof file.size !== "number" || file.size === 0) {
    throw new SecurityError("INVALID_FILE", "A valid non-empty file is required", 400);
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new SecurityError(
      "FILE_TOO_LARGE",
      `File exceeds maximum allowed size of 25 MB (${(file.size / (1024 * 1024)).toFixed(1)} MB provided)`,
      400
    );
  }

  // Validate MIME type & file extension
  const ext = file.name.split(".").pop()?.toLowerCase();
  const allowedExts = ["pdf", "jpg", "jpeg", "png", "webp", "gif", "txt", "csv", "doc", "docx", "xls", "xlsx"];
  if (!ALLOWED_MIME_TYPES.includes(file.type) && (!ext || !allowedExts.includes(ext))) {
    throw new SecurityError("UNSUPPORTED_FILE_TYPE", `File type "${file.type || ext}" is not permitted`, 400);
  }

  // Validate metadata with Zod
  const rawMetadata = {
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || undefined,
    category: (formData.get("category") as DocumentCategoryType) || "PERSONAL",
    expiryDate: (formData.get("expiryDate") as string) || undefined,
  };

  const validated = UploadDocumentMetadataSchema.safeParse(rawMetadata);
  if (!validated.success) {
    throw new SecurityError("INVALID_INPUT", validated.error.errors[0].message, 400);
  }

  const { title, description, category, expiryDate } = validated.data;

  // Generate safe storage key
  const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const uniqueKey = `vault/${familyId}/${Date.now()}-${safeFileName}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Upload to Cloudflare R2 / S3
  await uploadFile(uniqueKey, buffer, file.type || "application/octet-stream");

  // Save metadata to database
  const doc = await prisma.document.create({
    data: {
      familyId,
      title,
      description,
      category,
      fileKey: uniqueKey,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || "application/octet-stream",
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      createdById: ctx.user.id,
    },
  });

  await logAuditEvent({
    action: "DOCUMENT_UPLOADED",
    entityType: "DOCUMENT",
    familyId,
    userId: ctx.user.id,
    entityId: doc.id,
    details: {
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      category,
      title,
    },
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
  });

  revalidatePath("/dashboard/documents");
  return { success: true, documentId: doc.id };
}

export async function updateDocument(
  documentId: string,
  data: {
    title: string;
    description?: string | null;
    category: DocumentCategoryType;
    expiryDate?: string | null;
  }
) {
  const validated = UpdateDocumentSchema.safeParse(data);
  if (!validated.success) {
    throw new SecurityError("INVALID_INPUT", validated.error.errors[0].message, 400);
  }

  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    include: { permissions: true },
  });

  if (!doc) throw new SecurityError("NOT_FOUND", "Document not found", 404);

  const ctx = await authorizeAction({
    familyId: doc.familyId,
    actionName: "UPDATE_DOCUMENT",
  });

  const perms = await getUserDocumentPermissions(doc, ctx.user.id, ctx.membership!.role);
  if (!perms.canEdit) {
    throw new SecurityError("FORBIDDEN_DOCUMENT_EDIT", "You do not have permission to edit this document", 403);
  }

  await prisma.document.update({
    where: { id: documentId },
    data: {
      title: validated.data.title,
      description: validated.data.description,
      category: validated.data.category,
      expiryDate: validated.data.expiryDate ? new Date(validated.data.expiryDate) : null,
    },
  });

  await logAuditEvent({
    action: "DOCUMENT_UPDATED",
    entityType: "DOCUMENT",
    familyId: doc.familyId,
    userId: ctx.user.id,
    entityId: documentId,
    details: { title: validated.data.title, category: validated.data.category },
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
  });

  revalidatePath("/dashboard/documents");
  revalidatePath(`/dashboard/documents/${documentId}`);
  return { success: true };
}

export async function deleteDocument(documentId: string) {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    include: { permissions: true },
  });

  if (!doc) throw new SecurityError("NOT_FOUND", "Document not found", 404);

  const ctx = await authorizeAction({
    familyId: doc.familyId,
    actionName: "DELETE_DOCUMENT",
  });

  const perms = await getUserDocumentPermissions(doc, ctx.user.id, ctx.membership!.role);
  if (!perms.canDelete) {
    throw new SecurityError("FORBIDDEN_DOCUMENT_DELETE", "You do not have permission to delete this document", 403);
  }

  // Delete from object storage
  await deleteFile(doc.fileKey);

  // Delete from database
  await prisma.document.delete({
    where: { id: documentId },
  });

  await logAuditEvent({
    action: "DOCUMENT_DELETED",
    entityType: "DOCUMENT",
    familyId: doc.familyId,
    userId: ctx.user.id,
    entityId: documentId,
    details: { title: doc.title, fileName: doc.fileName },
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
  });

  revalidatePath("/dashboard/documents");
  return { success: true };
}

export async function getDocumentPreviewUrl(documentId: string): Promise<{ url: string; mimeType: string }> {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    include: { permissions: true },
  });

  if (!doc) throw new SecurityError("NOT_FOUND", "Document not found", 404);

  const ctx = await authorizeAction({
    familyId: doc.familyId,
    actionName: "PREVIEW_DOCUMENT",
  });

  const perms = await getUserDocumentPermissions(doc, ctx.user.id, ctx.membership!.role);
  if (!perms.canView) {
    throw new SecurityError("FORBIDDEN_DOCUMENT_ACCESS", "You do not have permission to view this document", 403);
  }

  const url = await getPreviewSignedUrl(doc.fileKey, doc.mimeType);

  await logAuditEvent({
    action: "DOCUMENT_VIEWED",
    entityType: "DOCUMENT",
    familyId: doc.familyId,
    userId: ctx.user.id,
    entityId: documentId,
    details: { fileName: doc.fileName },
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
  });

  return { url, mimeType: doc.mimeType };
}

export async function getDocumentDownloadUrl(documentId: string): Promise<{ url: string; fileName: string }> {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    include: { permissions: true },
  });

  if (!doc) throw new SecurityError("NOT_FOUND", "Document not found", 404);

  const ctx = await authorizeAction({
    familyId: doc.familyId,
    actionName: "DOWNLOAD_DOCUMENT",
  });

  const perms = await getUserDocumentPermissions(doc, ctx.user.id, ctx.membership!.role);
  if (!perms.canDownload) {
    throw new SecurityError("FORBIDDEN_DOCUMENT_DOWNLOAD", "You do not have permission to download this document", 403);
  }

  const url = await getDownloadSignedUrl(doc.fileKey, doc.fileName);

  await logAuditEvent({
    action: "DOCUMENT_DOWNLOADED",
    entityType: "DOCUMENT",
    familyId: doc.familyId,
    userId: ctx.user.id,
    entityId: documentId,
    details: { fileName: doc.fileName },
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
  });

  return { url, fileName: doc.fileName };
}

export async function updateDocumentPermissions(
  documentId: string,
  userPermissions: { userId: string; permissions: DocumentPermissionType[] }[]
) {
  const validated = UpdateDocumentPermissionsSchema.safeParse({ documentId, userPermissions });
  if (!validated.success) {
    throw new SecurityError("INVALID_INPUT", validated.error.errors[0].message, 400);
  }

  const doc = await prisma.document.findUnique({
    where: { id: documentId },
  });

  if (!doc) throw new SecurityError("NOT_FOUND", "Document not found", 404);

  const ctx = await authorizeAction({
    familyId: doc.familyId,
    actionName: "UPDATE_DOCUMENT_PERMISSIONS",
  });

  // Only family OWNER/ADMIN or original creator can manage permissions
  const canManage =
    ctx.membership!.role === "OWNER" ||
    ctx.membership!.role === "ADMIN" ||
    doc.createdById === ctx.user.id;

  if (!canManage) {
    throw new SecurityError(
      "PRIVILEGE_VIOLATION",
      "Only family managers or the document uploader can configure permissions",
      403
    );
  }

  // Ensure target users are members of the same family
  const targetUserIds = validated.data.userPermissions.map((u) => u.userId);
  const familyMembers = await prisma.familyMember.findMany({
    where: {
      familyId: doc.familyId,
      userId: { in: targetUserIds },
    },
    select: { userId: true },
  });
  const validMemberIds = new Set(familyMembers.map((m) => m.userId));

  // Remove existing permissions for the targeted users and insert updated ones
  await prisma.documentPermission.deleteMany({
    where: {
      documentId,
      userId: { in: targetUserIds },
    },
  });

  const recordsToCreate: Prisma.DocumentPermissionCreateManyInput[] = [];
  for (const item of validated.data.userPermissions) {
    if (!validMemberIds.has(item.userId)) continue; // ignore non-family members
    for (const perm of item.permissions) {
      recordsToCreate.push({
        documentId,
        userId: item.userId,
        permission: perm,
      });
    }
  }

  if (recordsToCreate.length > 0) {
    await prisma.documentPermission.createMany({
      data: recordsToCreate,
      skipDuplicates: true,
    });
  }

  await logAuditEvent({
    action: "PERMISSION_CHANGED",
    entityType: "DOCUMENT",
    familyId: doc.familyId,
    userId: ctx.user.id,
    entityId: documentId,
    details: {
      modifiedUsersCount: targetUserIds.length,
      ruleCount: recordsToCreate.length,
    },
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
  });

  revalidatePath(`/dashboard/documents/${documentId}`);
  return { success: true };
}

export async function getDocumentVaultStats() {
  const familyId = await getActiveFamilyId();
  if (!familyId) return { totalDocs: 0, expiringSoon: 0, expired: 0, totalBytes: 0 };

  await authorizeAction({
    familyId,
    actionName: "GET_VAULT_STATS",
  });

  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [totalDocs, expiringSoon, expired, allDocs] = await Promise.all([
    prisma.document.count({ where: { familyId } }),
    prisma.document.count({
      where: {
        familyId,
        expiryDate: { gte: now, lte: in30Days },
      },
    }),
    prisma.document.count({
      where: {
        familyId,
        expiryDate: { lt: now },
      },
    }),
    prisma.document.findMany({
      where: { familyId },
      select: { fileSize: true },
    }),
  ]);

  const totalBytes = allDocs.reduce((acc: number, d) => acc + (d.fileSize || 0), 0);

  return {
    totalDocs,
    expiringSoon,
    expired,
    totalBytes,
  };
}

export async function getDocumentFamilyMembers(): Promise<
  { id: string; name: string | null; email: string | null; image: string | null; role: string }[]
> {
  const familyId = await getActiveFamilyId();
  if (!familyId) return [];

  await authorizeAction({
    familyId,
    actionName: "GET_DOCUMENT_FAMILY_MEMBERS",
  });

  const members = await prisma.familyMember.findMany({
    where: { familyId },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
  });

  return members.map((m) => ({
    id: m.user.id,
    name: m.user.name,
    email: m.user.email,
    image: m.user.image,
    role: m.role,
  }));
}

