"use client"

import type { Document } from "@/lib/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, FileText, AlertTriangle } from "lucide-react"
import { useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface DocumentPreviewDialogProps {
  document: Document
  open: boolean
  onClose: () => void
  onDownload: () => void
}

export function DocumentPreviewDialog({ document, open, onClose, onDownload }: DocumentPreviewDialogProps) {
  const [imageLoaded, setImageLoaded] = useState(false)

  // Check if the file data was too large to store
  const hasLargeFileTruncated = () => {
    return (document as any)._hasLargeFile === true
  }

  // Determine if the file is previewable
  const isPreviewable = () => {
    if (hasLargeFileTruncated()) {
      return false
    }

    if (!document.fileContent) {
      return false
    }

    // For base64 data
    if (document.fileContent.startsWith("data:")) {
      return document.fileContent.startsWith("data:image/") || document.fileContent.startsWith("data:application/pdf")
    }

    // For other cases
    const fileType = document.fileType || "application/octet-stream"
    return fileType.startsWith("image/") || fileType === "application/pdf"
  }

  const isPdf = () => {
    return (
      document.fileType === "application/pdf" ||
      (document.fileName && document.fileName.endsWith(".pdf")) ||
      (document.fileContent && document.fileContent.startsWith("data:application/pdf"))
    )
  }

  const isImage = () => {
    return isPreviewable() && !isPdf()
  }

  // Get placeholder or actual image source
  const getImageSrc = () => {
    if (document.fileContent) {
      return document.fileContent
    }
    return "/placeholder.svg"
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{document.title}</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {hasLargeFileTruncated() && (
            <Alert variant="warning" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This file was too large to store in the browser's local storage and is not available for preview or
                download.
              </AlertDescription>
            </Alert>
          )}

          {isPreviewable() ? (
            <div className="flex justify-center items-center bg-muted rounded-md overflow-hidden">
              {isPdf() ? (
                <div className="w-full aspect-[3/4]">
                  <object
                    data={document.fileContent}
                    type="application/pdf"
                    className="w-full h-full"
                    title={document.title}
                  >
                    <div className="p-4 text-center">
                      <p>PDF preview not available in this browser.</p>
                      <Button onClick={onDownload} className="mt-2">
                        <Download className="h-4 w-4 mr-2" />
                        Download to View
                      </Button>
                    </div>
                  </object>
                </div>
              ) : (
                <div className="flex justify-center items-center p-4 max-h-[60vh]">
                  <img
                    src={getImageSrc() || "/placeholder.svg"}
                    alt={document.title}
                    className={`
                      max-w-full max-h-[60vh] object-contain
                      ${imageLoaded ? "block" : "hidden"}
                    `}
                    onLoad={() => setImageLoaded(true)}
                    draggable="false"
                  />
                  {!imageLoaded && (
                    <div className="flex items-center justify-center h-40 w-40">
                      <FileText className="h-10 w-10 text-muted-foreground animate-pulse" />
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="aspect-[3/4] bg-muted rounded-md flex flex-col items-center justify-center p-8 text-center">
              <FileText className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">
                {hasLargeFileTruncated()
                  ? "File too large for browser storage"
                  : document.fileContent
                    ? "Preview not available"
                    : "No file attached"}
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                {hasLargeFileTruncated()
                  ? "This file exceeded the browser's storage limits and couldn't be saved."
                  : document.fileContent
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
          <Button onClick={onDownload} disabled={hasLargeFileTruncated() || !document.fileContent}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

