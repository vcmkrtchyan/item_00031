"use client"

import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { Calendar, Clock, Download, Edit, FileText, MoreVertical, Trash2, Eye } from "lucide-react"
import type { Document, Category } from "@/lib/types"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { DocumentPreviewDialog } from "@/components/document-preview-dialog"
import { cn } from "@/lib/utils"
import { downloadFile, getFileName } from "@/lib/file-utils"
import { useToast } from "@/hooks/use-toast"

interface DocumentCardProps {
  document: Document
  categories: Category[]
  viewMode: "grid" | "list"
  onEdit: () => void
  onDelete: () => void
}

export function DocumentCard({ document, categories, viewMode, onEdit, onDelete }: DocumentCardProps) {
  const [showPreview, setShowPreview] = useState(false)
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

  // Update the handleDownload function to be more robust
  const handleDownload = () => {
    if (!document.fileUrl || document.fileUrl.includes("placeholder.svg")) {
      toast({
        title: "No file to download",
        description: "This document doesn't have a file attached.",
        variant: "destructive",
      })
      return
    }

    try {
      const fileName = document.fileName || getFileName(document.fileUrl)

      // Log for debugging
      console.log("Downloading file:", {
        url: document.fileUrl.substring(0, 50) + "...", // Truncate for logging
        fileName,
        type: document.fileType,
      })

      downloadFile(document.fileUrl, fileName)

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

  if (viewMode === "list") {
    return (
      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-primary/10 rounded">
            <FileText className="h-6 w-6 text-primary" />
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
              <DropdownMenuItem onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete}>
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
          <div>
            <h3 className="font-medium truncate">{document.title}</h3>
            <p className="text-sm text-muted-foreground">{document.category}</p>
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
              <DropdownMenuItem onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
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
            <Button variant="outline" size="sm" onClick={handleDownload}>
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

