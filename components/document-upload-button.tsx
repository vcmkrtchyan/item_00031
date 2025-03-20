"use client"

import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DocumentForm } from "@/components/document-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { Document, Category } from "@/lib/types"

interface DocumentUploadButtonProps {
  onAddDocument: (document: Document) => void
  categories: Category[]
  onAddCategory: (category: Category) => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function DocumentUploadButton({
  onAddDocument,
  categories,
  onAddCategory,
  open,
  onOpenChange,
}: DocumentUploadButtonProps) {
  const isControlled = open !== undefined && onOpenChange !== undefined

  const handleOpenChange = (newOpen: boolean) => {
    if (isControlled) {
      onOpenChange(newOpen)
    }
  }

  const handleSave = (document: Document) => {
    onAddDocument(document)
    handleOpenChange(false)
  }

  return (
    <>
      <Button onClick={() => handleOpenChange(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Upload Document
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Upload New Document</DialogTitle>
          </DialogHeader>
          <DocumentForm onSave={handleSave} categories={categories} onAddCategory={onAddCategory} />
        </DialogContent>
      </Dialog>
    </>
  )
}

