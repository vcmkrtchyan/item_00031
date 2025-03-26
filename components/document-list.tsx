"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { DocumentCard } from "@/components/document-card"
import { DocumentEditDialog } from "@/components/document-edit-dialog"
import type { Document, Category } from "@/lib/types"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileIcon, GridIcon, ListIcon, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DocumentListProps {
  documents: Document[]
  categories: Category[]
  onUpdateDocument: (document: Document) => void
  onDeleteDocument: (document: Document) => void
  onAddCategory: (category: Category) => void
  onAddClick?: () => void
  onFileDrop?: (file: File) => void
  isFiltered?: boolean
  allDocumentsCount?: number
}

export function DocumentList({
  documents,
  categories,
  onUpdateDocument,
  onDeleteDocument,
  onAddCategory,
  onAddClick,
  onFileDrop,
  isFiltered = false,
  allDocumentsCount = 0,
}: DocumentListProps) {
  const [editingDocument, setEditingDocument] = useState<Document | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [isDragging, setIsDragging] = useState(false)

  // Add debugging for documents
  useEffect(() => {
    console.log(
      "DocumentList received documents:",
      documents.map((doc) => ({ id: doc.id, title: doc.title })),
    )
  }, [documents])

  const handleEdit = (document: Document) => {
    setEditingDocument(document)
  }

  const handleCloseEdit = () => {
    setEditingDocument(null)
  }

  const handleSaveEdit = (document: Document) => {
    onUpdateDocument(document)
    setEditingDocument(null)
  }

  const handleDelete = (document: Document) => {
    console.log("DocumentList handleDelete called for:", document.id, document.title)
    onDeleteDocument(document)
  }

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0]
        if (onFileDrop) {
          onFileDrop(file)
        }
      }
    },
    [onFileDrop],
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h2 className="text-xl font-semibold">Your Documents</h2>
        {documents.length > 0 && (
          <Tabs defaultValue={viewMode} onValueChange={(value) => setViewMode(value as "grid" | "list")}>
            <TabsList>
              <TabsTrigger value="grid">
                <GridIcon className="h-4 w-4 mr-2" />
                Grid
              </TabsTrigger>
              <TabsTrigger value="list">
                <ListIcon className="h-4 w-4 mr-2" />
                List
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </div>

      {documents.length === 0 && !isFiltered && allDocumentsCount === 0 ? (
        // No documents at all - with drag and drop
        <div
          className={`flex flex-col items-center justify-center p-6 sm:p-12 border-2 border-dashed rounded-lg transition-colors ${
            isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/20 bg-muted/50"
          }`}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <FileIcon
            className={`h-12 w-12 sm:h-16 sm:w-16 mb-3 sm:mb-4 transition-colors ${isDragging ? "text-primary" : "text-muted-foreground"}`}
          />
          <h3 className="text-lg sm:text-xl font-medium text-center">No documents yet</h3>
          <p className="text-sm sm:text-base text-muted-foreground text-center mt-2 mb-4 sm:mb-6 max-w-md px-2">
            {isDragging
              ? "Drop your file to upload"
              : "Upload your first document to start managing your personal files. Drag and drop a file here or use the upload button."}
          </p>
          <Button onClick={onAddClick} className="w-full sm:w-auto justify-center" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            <span className="sm:hidden">Upload Document</span>
            <span className="hidden sm:inline">Upload Your First Document</span>
          </Button>
        </div>
      ) : documents.length === 0 && isFiltered ? (
        // Documents exist but none match the current filter
        <div className="flex flex-col items-center justify-center p-6 sm:p-12 border border-dashed rounded-lg bg-muted/50">
          <FileIcon className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mb-3 sm:mb-4" />
          <h3 className="text-lg sm:text-xl font-medium text-center">No documents in this category</h3>
          <p className="text-sm sm:text-base text-muted-foreground text-center mt-2 mb-4 sm:mb-6 max-w-md px-2">
            There are no documents matching your current filter. Try selecting a different category or clear the filter.
          </p>
        </div>
      ) : (
        // Documents to display
        <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-4"}>
          {documents.map((document) => (
            <DocumentCard
              key={document.id}
              document={document}
              categories={categories}
              viewMode={viewMode}
              onEdit={() => handleEdit(document)}
              onDelete={() => handleDelete(document)}
            />
          ))}
        </div>
      )}

      {editingDocument && (
        <DocumentEditDialog
          document={editingDocument}
          categories={categories}
          onSave={handleSaveEdit}
          onCancel={handleCloseEdit}
          onAddCategory={onAddCategory}
          open={!!editingDocument}
        />
      )}
    </div>
  )
}

