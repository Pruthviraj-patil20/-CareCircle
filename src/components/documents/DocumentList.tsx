"use client";

import { DocumentWithDetails } from "@/types/document";
import { DocumentCard } from "./DocumentCard";
import { FileQuestion } from "lucide-react";
import { UploadDocumentDialog } from "./UploadDocumentDialog";
import { StaggerContainer, StaggerItem } from "@/components/ui/page-transition";

export function DocumentList({ documents }: { documents: DocumentWithDetails[] }) {
  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border border-dashed border-border/80 bg-muted/15">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4 shadow-xs">
          <FileQuestion className="h-7 w-7" />
        </div>
        <h3 className="text-lg font-bold tracking-tight text-foreground">No documents found</h3>
        <p className="text-muted-foreground text-xs sm:text-sm max-w-md mt-1 mb-6 leading-relaxed">
          No family records matched your search or filters. Upload insurance policies, deeds, certificates, or health records to your secure vault.
        </p>
        <UploadDocumentDialog />
      </div>
    );
  }

  return (
    <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {documents.map((doc) => (
        <StaggerItem key={doc.id}>
          <DocumentCard document={doc} />
        </StaggerItem>
      ))}
    </StaggerContainer>
  );
}
