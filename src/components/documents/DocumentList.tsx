"use client";

import { DocumentWithDetails } from "@/types/document";
import { DocumentCard } from "./DocumentCard";
import { FileQuestion } from "lucide-react";
import { UploadDocumentDialog } from "./UploadDocumentDialog";

export function DocumentList({ documents }: { documents: DocumentWithDetails[] }) {
  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border-2 border-dashed border-border/80 bg-muted/15">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
          <FileQuestion className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-bold tracking-tight">No documents found</h3>
        <p className="text-muted-foreground text-sm max-w-md mt-1 mb-6">
          No family records matched your search or filters. Upload insurance policies, deeds, certificates, or vehicle records to your secure vault.
        </p>
        <UploadDocumentDialog />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {documents.map((doc) => (
        <DocumentCard key={doc.id} document={doc} />
      ))}
    </div>
  );
}
