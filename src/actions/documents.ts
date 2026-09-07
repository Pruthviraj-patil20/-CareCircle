"use server";

import prisma from "@/lib/db";
import { auth } from "@/lib/auth";
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

async function verifyFamilyMembership(familyId: string, userId: string) {
  const membership = await prisma.familyMember.findUnique({
    where: { familyId_userId: { familyId, userId } },
  });
  if (!membership) throw new Error("You are not a member of this family");
  return membership;
}

export async function getUserDocumentPermissions(
  doc: any,
  userId: string,
  userFamilyRole: string
): Promise<{ canView: boolean; canDownload: boolean; canEdit: boolean; canDelete: boolean }> {
  // Family OWNER or ADMIN, or document creator has full permissions
  if (userFamilyRole === "OWNER" || userFamilyRole === "ADMIN" || doc.createdById === userId) {
    return { canView: true, canDownload: true, canEdit: true, canDelete: true };
  }

  // Check explicit permissions in DocumentPermission table
  const userPerms = (doc.permissions || [])
    .filter((p: any) => p.userId === userId)
    .map((p: any) => p.permission);

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
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const familyId = await getActiveFamilyId();
  if (!familyId) return [];

  const membership = await verifyFamilyMembership(familyId, session.user.id);

  const where: any = { familyId };

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

  const orderBy: any = {};
  const sortBy = filters?.sortBy || "createdAt";
  const sortOrder = filters?.sortOrder || "desc";

  if (sortBy === "title") orderBy.title = sortOrder;
  else if (sortBy === "fileSize") orderBy.fileSize = sortOrder;
  else if (sortBy === "expiryDate") orderBy.expiryDate = sortOrder;
  else orderBy.createdAt = sortOrder;

  const docs = await (prisma as any).document.findMany({
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

  // Attach user specific permissions and filter docs the user is allowed to view
  const result: DocumentWithDetails[] = [];
  for (const doc of docs) {
    const perms = await getUserDocumentPermissions(doc, session.user.id, membership.role);
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
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const doc = await (prisma as any).document.findUnique({
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

  if (!doc) throw new Error("Document not found");

  const membership = await verifyFamilyMembership(doc.familyId, session.user.id);
  const perms = await getUserDocumentPermissions(doc, session.user.id, membership.role);

  if (!perms.canView) {
    throw new Error("You do not have permission to view this document");
  }

  return {
    ...doc,
    userPermissions: perms,
  };
}

export async function uploadDocument(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const familyId = await getActiveFamilyId();
  if (!familyId) throw new Error("No active family selected");

  await verifyFamilyMembership(familyId, session.user.id);

  const file = formData.get("file") as File | null;
  if (!file || typeof file.size !== "number" || file.size === 0) {
    throw new Error("A valid file is required");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File exceeds the maximum allowed size of 25 MB (${(file.size / (1024 * 1024)).toFixed(1)} MB provided)`);
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    // If mime type is generic octet-stream, check extension
    const ext = file.name.split(".").pop()?.toLowerCase();
    const allowedExts = ["pdf", "jpg", "jpeg", "png", "webp", "gif", "txt", "doc", "docx", "xls", "xlsx", "csv"];
    if (!ext || !allowedExts.includes(ext)) {
      throw new Error(`File type "${file.type || ext}" is not supported. Supported types: PDF, Images, Word, Excel, Text.`);
    }
  }

  const title = (formData.get("title") as string)?.trim();
  if (!title) throw new Error("Document title is required");

  const description = (formData.get("description") as string)?.trim() || null;
  const category = (formData.get("category") as DocumentCategoryType) || "PERSONAL";
  const expiryDateStr = formData.get("expiryDate") as string | null;
  const expiryDate = expiryDateStr ? new Date(expiryDateStr) : null;

  // Generate safe storage key
  const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const uniqueKey = `vault/${familyId}/${Date.now()}-${safeFileName}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Upload to Cloudflare R2 / S3
  await uploadFile(uniqueKey, buffer, file.type || "application/octet-stream");

  // Save metadata to PostgreSQL
  const doc = await (prisma as any).document.create({
    data: {
      familyId,
      title,
      description,
      category,
      fileKey: uniqueKey,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || "application/octet-stream",
      expiryDate,
      createdById: session.user.id,
    },
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
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const doc = await (prisma as any).document.findUnique({
    where: { id: documentId },
    include: { permissions: true },
  });

  if (!doc) throw new Error("Document not found");

  const membership = await verifyFamilyMembership(doc.familyId, session.user.id);
  const perms = await getUserDocumentPermissions(doc, session.user.id, membership.role);

  if (!perms.canEdit) {
    throw new Error("You do not have permission to edit this document");
  }

  await (prisma as any).document.update({
    where: { id: documentId },
    data: {
      title: data.title.trim(),
      description: data.description ? data.description.trim() : null,
      category: data.category,
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
    },
  });

  revalidatePath("/dashboard/documents");
  revalidatePath(`/dashboard/documents/${documentId}`);
  return { success: true };
}

export async function deleteDocument(documentId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const doc = await (prisma as any).document.findUnique({
    where: { id: documentId },
    include: { permissions: true },
  });

  if (!doc) throw new Error("Document not found");

  const membership = await verifyFamilyMembership(doc.familyId, session.user.id);
  const perms = await getUserDocumentPermissions(doc, session.user.id, membership.role);

  if (!perms.canDelete) {
    throw new Error("You do not have permission to delete this document");
  }

  // Delete from object storage
  await deleteFile(doc.fileKey);

  // Delete from PostgreSQL (Prisma cascades permissions)
  await (prisma as any).document.delete({
    where: { id: documentId },
  });

  revalidatePath("/dashboard/documents");
  return { success: true };
}

export async function getDocumentPreviewUrl(documentId: string): Promise<{ url: string; mimeType: string }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const doc = await (prisma as any).document.findUnique({
    where: { id: documentId },
    include: { permissions: true },
  });

  if (!doc) throw new Error("Document not found");

  const membership = await verifyFamilyMembership(doc.familyId, session.user.id);
  const perms = await getUserDocumentPermissions(doc, session.user.id, membership.role);

  if (!perms.canView) {
    throw new Error("You do not have permission to view this document");
  }

  const url = await getPreviewSignedUrl(doc.fileKey, doc.mimeType);
  return { url, mimeType: doc.mimeType };
}

export async function getDocumentDownloadUrl(documentId: string): Promise<{ url: string; fileName: string }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const doc = await (prisma as any).document.findUnique({
    where: { id: documentId },
    include: { permissions: true },
  });

  if (!doc) throw new Error("Document not found");

  const membership = await verifyFamilyMembership(doc.familyId, session.user.id);
  const perms = await getUserDocumentPermissions(doc, session.user.id, membership.role);

  if (!perms.canDownload) {
    throw new Error("You do not have permission to download this document");
  }

  const url = await getDownloadSignedUrl(doc.fileKey, doc.fileName);
  return { url, fileName: doc.fileName };
}

export async function updateDocumentPermissions(
  documentId: string,
  userPermissions: { userId: string; permissions: DocumentPermissionType[] }[]
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const doc = await (prisma as any).document.findUnique({
    where: { id: documentId },
  });

  if (!doc) throw new Error("Document not found");

  const membership = await verifyFamilyMembership(doc.familyId, session.user.id);
  
  // Only family OWNER/ADMIN or the document uploader can manage permissions
  const canManage = membership.role === "OWNER" || membership.role === "ADMIN" || doc.createdById === session.user.id;
  if (!canManage) {
    throw new Error("Only family managers or document uploaders can configure permissions");
  }

  // Remove existing permissions for the targeted users and insert updated ones
  const userIds = userPermissions.map((u) => u.userId);
  await (prisma as any).documentPermission.deleteMany({
    where: {
      documentId,
      userId: { in: userIds },
    },
  });

  const recordsToCreate: any[] = [];
  for (const item of userPermissions) {
    for (const perm of item.permissions) {
      recordsToCreate.push({
        documentId,
        userId: item.userId,
        permission: perm,
      });
    }
  }

  if (recordsToCreate.length > 0) {
    await (prisma as any).documentPermission.createMany({
      data: recordsToCreate,
      skipDuplicates: true,
    });
  }

  revalidatePath(`/dashboard/documents/${documentId}`);
  return { success: true };
}

export async function getDocumentVaultStats() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const familyId = await getActiveFamilyId();
  if (!familyId) return { totalDocs: 0, expiringSoon: 0, expired: 0, totalBytes: 0 };

  await verifyFamilyMembership(familyId, session.user.id);

  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [totalDocs, expiringSoon, expired, allDocs] = await Promise.all([
    (prisma as any).document.count({ where: { familyId } }),
    (prisma as any).document.count({
      where: {
        familyId,
        expiryDate: { gte: now, lte: in30Days },
      },
    }),
    (prisma as any).document.count({
      where: {
        familyId,
        expiryDate: { lt: now },
      },
    }),
    (prisma as any).document.findMany({
      where: { familyId },
      select: { fileSize: true },
    }),
  ]);

  const totalBytes = allDocs.reduce((acc: number, d: any) => acc + (d.fileSize || 0), 0);

  return {
    totalDocs,
    expiringSoon,
    expired,
    totalBytes,
  };
}

export async function getDocumentFamilyMembers() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const familyId = await getActiveFamilyId();
  if (!familyId) return [];

  await verifyFamilyMembership(familyId, session.user.id);

  const members = await prisma.familyMember.findMany({
    where: { familyId },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return members.map((m) => ({
    id: m.user.id,
    name: m.user.name,
    email: m.user.email,
    image: m.user.image,
    role: m.role,
  }));
}

