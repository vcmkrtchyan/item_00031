"use client"

import type { Document } from "@/lib/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, FileText } from "lucide-react"
import { getFileType } from "@/lib/file-utils"

interface DocumentPreviewDialogProps {
  document: Document
  open: boolean
  onClose: () => void
  onDownload: () => void
}

export function DocumentPreviewDialog({ document, open, onClose, onDownload }: DocumentPreviewDialogProps) {
  // Determine if the file is previewable
  const isPreviewable = () => {
    if (!document.fileUrl || document.fileUrl.includes("placeholder.svg")) {
      return false
    }

    // For base64 data URLs
    if (document.fileUrl.startsWith("data:")) {
      return document.fileUrl.startsWith("data:image/") || document.fileUrl.startsWith("data:application/pdf")
    }

    // For regular URLs
    const fileType = document.fileType || getFileType(document.fileUrl)
    return fileType.startsWith("image/") || fileType === "application/pdf"
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{document.title}</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {isPreviewable() ? (
            <div className="aspect-[3/4] bg-muted rounded-md overflow-hidden flex items-center justify-center">
              {document.fileType === "application/pdf" ||
              document.fileUrl?.endsWith(".pdf") ||
              document.fileUrl?.startsWith("data:application/pdf") ? (
                <object data={document.fileUrl} type="application/pdf" className="w-full h-full" title={document.title}>
                  <div className="p-4 text-center">
                    <p>PDF preview not available in this browser.</p>
                    <Button onClick={onDownload} className="mt-2">
                      <Download className="h-4 w-4 mr-2" />
                      Download to View
                    </Button>
                  </div>
                </object>
              ) : (
                <img
                  src={document.fileUrl || "/placeholder.svg"}
                  alt={document.title}
                  className="max-w-full max-h-full object-contain"
                />
              )}
            </div>
          ) : (
            <div className="aspect-[3/4] bg-muted rounded-md flex flex-col items-center justify-center p-8 text-center">
              <FileText className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">
                {document.fileUrl && !document.fileUrl.includes("placeholder.svg")
                  ? "Preview not available"
                  : "No file attached"}
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                {document.fileUrl && !document.fileUrl.includes("placeholder.svg")
                  ? "This file type cannot be previewed. You can download it to view."
                  : "This document doesn't have a file attached."}
              </p>
              {document.fileName && <p className="text-sm font-medium mt-4">{document.fileName}</p>}
            </div>
          )}

          {document.notes && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Notes:</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{document.notes}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={onDownload} disabled={!document.fileUrl || document.fileUrl.includes("placeholder.svg")}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

