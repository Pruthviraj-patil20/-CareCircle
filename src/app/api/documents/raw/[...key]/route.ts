import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { getLocalFile } from "@/lib/storage";
import { getUserDocumentPermissions } from "@/actions/documents";
import { logAuditEvent } from "@/lib/security";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  // 1. Authentication
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized: Authentication required", { status: 401 });
  }

  // 2. Session validation (active DB user check)
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true },
  });
  if (!dbUser) {
    return new NextResponse("Unauthorized: Session invalid", { status: 401 });
  }

  const resolvedParams = await params;
  const fileKey = resolvedParams.key.join("/");
  const searchParams = request.nextUrl.searchParams;
  const disposition = searchParams.get("disposition") || "inline";
  const customFileName = searchParams.get("filename");

  // 3. Resource existence & document lookup
  const doc = await prisma.document.findFirst({
    where: { fileKey },
    include: {
      permissions: true,
    },
  });

  if (!doc) {
    return new NextResponse("File not found", { status: 404 });
  }

  // 4. Family membership verification
  const membership = await prisma.familyMember.findUnique({
    where: {
      familyId_userId: {
        familyId: doc.familyId,
        userId: dbUser.id,
      },
    },
  });

  if (!membership) {
    return new NextResponse("Forbidden: Access restricted to family members", { status: 403 });
  }

  // 5. RBAC, Resource ownership & Granular permission check
  const perms = await getUserDocumentPermissions(doc, dbUser.id, membership.role);

  if (disposition === "attachment" && !perms.canDownload) {
    return new NextResponse("Forbidden: You do not have permission to download this document", { status: 403 });
  }

  if (disposition === "inline" && !perms.canView) {
    return new NextResponse("Forbidden: You do not have permission to view this document", { status: 403 });
  }

  // Retrieve file payload
  const { buffer, exists } = await getLocalFile(fileKey);
  if (!exists) {
    return new NextResponse("File data missing from storage vault", { status: 404 });
  }

  // Audit logging for access
  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || request.headers.get("x-real-ip");
  const userAgent = request.headers.get("user-agent");

  await logAuditEvent({
    action: disposition === "attachment" ? "DOCUMENT_DOWNLOADED" : "DOCUMENT_VIEWED",
    entityType: "DOCUMENT",
    familyId: doc.familyId,
    userId: dbUser.id,
    entityId: doc.id,
    details: {
      fileName: doc.fileName,
      disposition,
      fileSize: buffer.length,
    },
    ipAddress: clientIp,
    userAgent,
  });

  const fileName = customFileName || doc.fileName;
  const contentDisposition =
    disposition === "attachment"
      ? `attachment; filename="${encodeURIComponent(fileName)}"`
      : "inline";

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": doc.mimeType || "application/octet-stream",
      "Content-Disposition": contentDisposition,
      "Content-Length": buffer.length.toString(),
      "Cache-Control": "private, no-transform, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
