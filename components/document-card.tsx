"use client"

import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import {
  Calendar,
  Clock,
  Download,
  Edit,
  FileText,
  MoreVertical,
  Trash2,
  Eye,
  Image,
  AlertTriangle,
} from "lucide-react"
import type { Document, Category } from "@/lib/types"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { DocumentPreviewDialog } from "@/components/document-preview-dialog"
import { cn } from "@/lib/utils"
import { downloadFile } from "@/lib/file-utils"
import { useToast } from "@/hooks/use-toast"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface DocumentCardProps {
  document: Document
  categories: Category[]
  viewMode: "grid" | "list"
  onEdit: () => void
  onDelete: () => void
}

export function DocumentCard({ document, categories, viewMode, onEdit, onDelete }: DocumentCardProps) {
  const [showPreview, setShowPreview] = useState(false)
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false)
  const { toast } = useToast()

  const category = categories.find((c) => c.category === document.category)

  const isExpiringSoon =
    document.expiryDate &&
    new Date(document.expiryDate) > new Date() &&
    new Date(document.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

  const isExpired = document.expiryDate && new Date(document.expiryDate) < new Date()

  const getExpiryStatus = () => {
    if (isExpired) return { label: "Expired", color: "destructive" }
    if (isExpiringSoon) return { label: "Expiring Soon", color: "warning" }
    if (document.expiryDate) return { label: "Valid", color: "success" }
    return null
  }

  const expiryStatus = getExpiryStatus()

  // Check if the document has a previewable image
  const hasImagePreview = () => {
    if (!document.fileContent) {
      return false
    }

    const fileType = document.fileType || "application/octet-stream"
    return fileType.startsWith("image/")
  }

  // Check if the file data was too large to store
  const hasLargeFileTruncated = () => {
    return (document as any)._hasLargeFile === true
  }

  // Update the handleDownload function to use fileContent
  const handleDownload = () => {
    if (!document.fileContent) {
      toast({
        title: "No file to download",
        description: hasLargeFileTruncated()
          ? "This file was too large to store in the browser and is not available for download."
          : "This document doesn't have a file attached.",
        variant: "destructive",
      })
      return
    }

    try {
      const fileName = document.fileName || "document"

      // Log for debugging
      console.log("Downloading file:", {
        fileName,
        type: document.fileType,
      })

      downloadFile(document.fileContent, fileName)

      toast({
        title: "Download started",
        description: `Downloading ${fileName}`,
      })
    } catch (error) {
      console.error("Download error:", error)
      toast({
        title: "Download failed",
        description: "There was an error downloading the file.",
        variant: "destructive",
      })
    }
  }

  // Inside the DocumentCard component, let's add debugging to the delete handler
  const handleDeleteClick = () => {
    console.log("Delete button clicked for document:", document.id, document.title)
    onDelete()
  }

  // Get placeholder or actual image source
  const getImageSrc = () => {
    if (document.fileContent) {
      return document.fileContent
    }
    return "/placeholder.svg"
  }

  if (viewMode === "list") {
    return (
      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-primary/10 rounded">
            {hasImagePreview() ? (
              <Image className="h-6 w-6 text-primary" />
            ) : (
              <FileText className="h-6 w-6 text-primary" />
            )}
          </div>
          <div>
            <h3 className="font-medium">{document.title}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{document.category}</span>
              {document.uploadDate && (
                <span>• Uploaded {formatDistanceToNow(new Date(document.uploadDate), { addSuffix: true })}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {expiryStatus && (
            <Badge
              variant={
                expiryStatus.color as "default" | "destructive" | "outline" | "secondary" | "warning" | "success"
              }
            >
              {expiryStatus.label}
            </Badge>
          )}

          {hasLargeFileTruncated() && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-warning">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>File was too large to store and is not available for preview/download</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          <Button variant="outline" size="icon" onClick={() => setShowPreview(true)}>
            <Eye className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowPreview(true)}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownload} disabled={hasLargeFileTruncated() || !document.fileContent}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDeleteClick} className="text-destructive focus:text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {showPreview && (
          <DocumentPreviewDialog
            document={document}
            open={showPreview}
            onClose={() => setShowPreview(false)}
            onDownload={handleDownload}
          />
        )}
      </div>
    )
  }

  return (
    <Card
      className={cn(
        "transition-all hover:shadow-md",
        isExpired && "border-destructive/50",
        isExpiringSoon && "border-warning/50",
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <div>
              <h3 className="font-medium truncate">{document.title}</h3>
              <p className="text-sm text-muted-foreground">{document.category}</p>
            </div>
            {hasLargeFileTruncated() && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-warning">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>File was too large to store and is not available for preview/download</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowPreview(true)}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownload} disabled={hasLargeFileTruncated() || !document.fileContent}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDeleteClick} className="text-destructive focus:text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        {hasImagePreview() && !hasLargeFileTruncated() && (
          <div className="mb-3 h-32 flex items-center justify-center bg-muted/50 rounded-md overflow-hidden">
            <div className={`relative w-full h-full ${thumbnailLoaded ? "block" : "hidden"}`}>
              <img
                src={getImageSrc() || "/placeholder.svg"}
                alt={document.title}
                className="w-full h-full object-contain"
                onLoad={() => setThumbnailLoaded(true)}
                draggable="false"
              />
            </div>
            {!thumbnailLoaded && (
              <div className="flex items-center justify-center h-full w-full">
                <Image className="h-8 w-8 text-muted-foreground animate-pulse" />
              </div>
            )}
          </div>
        )}

        {document.notes && <p className="text-sm text-muted-foreground line-clamp-2">{document.notes}</p>}

        <div className="flex flex-wrap gap-2 mt-2">
          {document.uploadDate && (
            <div className="flex items-center text-xs text-muted-foreground">
              <Clock className="h-3 w-3 mr-1" />
              <span>{formatDistanceToNow(new Date(document.uploadDate), { addSuffix: true })}</span>
            </div>
          )}

          {document.expiryDate && (
            <div className="flex items-center text-xs text-muted-foreground">
              <Calendar className="h-3 w-3 mr-1" />
              <span>Expires: {new Date(document.expiryDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <div className="flex justify-between items-center w-full">
          {expiryStatus && (
            <Badge
              variant={
                expiryStatus.color as "default" | "destructive" | "outline" | "secondary" | "warning" | "success"
              }
            >
              {expiryStatus.label}
            </Badge>
          )}

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowPreview(true)}>
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={hasLargeFileTruncated() || !document.fileContent}
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
          </div>
        </div>
      </CardFooter>

      {showPreview && (
        <DocumentPreviewDialog
          document={document}
          open={showPreview}
          onClose={() => setShowPreview(false)}
          onDownload={handleDownload}
        />
      )}
    </Card>
  )
}

