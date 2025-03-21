"use client"

import { useState, useEffect } from "react"
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
  onAddClick?: () => void
  isFiltered?: boolean
  allDocumentsCount?: number
}

export function DocumentList({
  documents,
  categories,
  onUpdateDocument,
  onDeleteDocument,
  onAddClick,
  isFiltered = false,
  allDocumentsCount = 0,
}: DocumentListProps) {
  const [editingDocument, setEditingDocument] = useState<Document | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
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
        // No documents at all
        <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-lg bg-muted/50">
          <FileIcon className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium">No documents yet</h3>
          <p className="text-muted-foreground text-center mt-2 mb-6 max-w-md">
            Upload your first document to start managing your personal files in one place.
          </p>
          <Button onClick={onAddClick} size="lg">
            <Upload className="h-4 w-4 mr-2" />
            Upload Your First Document
          </Button>
        </div>
      ) : documents.length === 0 && isFiltered ? (
        // Documents exist but none match the current filter
        <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-lg bg-muted/50">
          <FileIcon className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium">No documents in this category</h3>
          <p className="text-muted-foreground text-center mt-2 mb-6 max-w-md">
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
          open={!!editingDocument}
        />
      )}
    </div>
  )
}

