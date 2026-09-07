import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDocument, getDocumentFamilyMembers } from "@/actions/documents";
import { DocumentDetailClient } from "@/components/documents/DocumentDetailClient";

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { documentId } = await params;

  let doc;
  try {
    doc = await getDocument(documentId);
  } catch {
    redirect("/dashboard/documents");
  }

  // Fetch family members and check if current user can manage permissions
  const members = await getDocumentFamilyMembers();
  
  const currentMember = members.find((m) => m.id === session.user.id);
  const canManagePermissions =
    currentMember?.role === "OWNER" ||
    currentMember?.role === "ADMIN" ||
    doc.createdById === session.user.id;

  return (
    <DocumentDetailClient
      document={doc}
      members={members}
      canManagePermissions={canManagePermissions}
    />
  );
}
