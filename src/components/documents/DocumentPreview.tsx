"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  FileText,
  FileImage,
  FileSpreadsheet,
  File,
  Download,
  ExternalLink,
  RefreshCw,
  Eye,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { getDocumentPreviewUrl, getDocumentDownloadUrl } from "@/actions/documents";

interface DocumentPreviewProps {
  documentId: string;
  mimeType: string;
  fileName: string;
  canDownload: boolean;
}

export function DocumentPreview({
  documentId,
  mimeType,
  fileName,
  canDownload,
}: DocumentPreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPreviewUrl = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getDocumentPreviewUrl(documentId);
      setPreviewUrl(res.url);
    } catch (err: any) {
      setError(err.message || "Unable to generate preview");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreviewUrl();
  }, [documentId]);

  const handleDownload = async () => {
    try {
      toast.loading("Preparing download...", { id: "downloading" });
      const { url } = await getDocumentDownloadUrl(documentId);
      toast.dismiss("downloading");

      const a = window.document.createElement("a");
      a.href = url;
      a.download = fileName;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
    } catch (err: any) {
      toast.dismiss("downloading");
      toast.error(err.message || "Failed to download document");
    }
  };

  const isPdf = mimeType.toLowerCase().includes("pdf");
  const isImage = mimeType.toLowerCase().includes("image");

  return (
    <div className="rounded-2xl border bg-card overflow-hidden shadow-sm">
      {/* Preview Header Bar */}
      <div className="flex items-center justify-between p-3.5 border-b bg-muted/30">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Eye className="h-4 w-4 text-primary" />
          <span>Secure Document Preview</span>
        </div>
        <div className="flex items-center gap-2">
          {previewUrl && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={() => window.open(previewUrl, "_blank")}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open in New Window
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={fetchPreviewUrl}
            title="Reload Preview"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Preview Content Area */}
      <div className="p-4 bg-muted/10 min-h-[500px] flex items-center justify-center">
        {loading && (
          <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium">Generating encrypted preview link...</p>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center gap-3 py-16 text-center max-w-sm">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <p className="text-sm font-medium text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchPreviewUrl}>
              Try Again
            </Button>
          </div>
        )}

        {!loading && !error && previewUrl && (
          <>
            {isPdf ? (
              <iframe
                src={`${previewUrl}#toolbar=0&navpanes=0`}
                className="w-full h-[680px] rounded-lg border bg-background"
                title={fileName}
              />
            ) : isImage ? (
              <div className="max-h-[680px] overflow-auto flex items-center justify-center p-2">
                <img
                  src={previewUrl}
                  alt={fileName}
                  className="max-h-[640px] max-w-full rounded-lg object-contain shadow-sm border"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center text-center py-16 px-4 max-w-md">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                  {mimeType.includes("sheet") || mimeType.includes("csv") ? (
                    <FileSpreadsheet className="h-8 w-8 text-emerald-500" />
                  ) : mimeType.includes("word") || mimeType.includes("document") ? (
                    <FileText className="h-8 w-8 text-blue-500" />
                  ) : (
                    <File className="h-8 w-8 text-amber-500" />
                  )}
                </div>
                <h4 className="font-semibold text-base mb-1">{fileName}</h4>
                <p className="text-sm text-muted-foreground mb-6">
                  In-browser preview is available for PDFs and images. For this file format ({mimeType}), please download to view with your local application.
                </p>
                {canDownload && (
                  <Button onClick={handleDownload} className="gap-2">
                    <Download className="h-4 w-4" />
                    Download File
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
