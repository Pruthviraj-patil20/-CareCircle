import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { getLocalFile } from "@/lib/storage";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const resolvedParams = await params;
  const fileKey = resolvedParams.key.join("/");
  const searchParams = request.nextUrl.searchParams;
  const disposition = searchParams.get("disposition") || "inline";
  const customFileName = searchParams.get("filename");

  // Verify file belongs to a document the user has access to
  const doc = await (prisma as any).document.findFirst({
    where: { fileKey },
    include: {
      family: {
        include: {
          members: {
            where: { userId: session.user.id },
          },
        },
      },
      permissions: {
        where: { userId: session.user.id },
      },
    },
  });

  if (!doc) {
    return new NextResponse("File not found", { status: 404 });
  }

  const membership = doc.family.members[0];
  if (!membership) {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  // Check permissions: Owner/Admin/Uploader have full access
  const isPrivileged = 
    membership.role === "OWNER" || 
    membership.role === "ADMIN" || 
    doc.createdById === session.user.id;

  if (!isPrivileged) {
    const permTypes = doc.permissions.map((p: any) => p.permission);
    if (disposition === "attachment" && !permTypes.includes("DOWNLOAD") && doc.permissions.length > 0) {
      return new NextResponse("Download forbidden", { status: 403 });
    }
    if (disposition === "inline" && !permTypes.includes("VIEW") && doc.permissions.length > 0) {
      return new NextResponse("View forbidden", { status: 403 });
    }
  }

  const { buffer, exists } = await getLocalFile(fileKey);
  if (!exists) {
    return new NextResponse("File data missing", { status: 404 });
  }

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
      "Cache-Control": "private, max-age=3600",
    },
  });
}
