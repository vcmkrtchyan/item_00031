"use client"

import { useState, useEffect } from "react"
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
  initialFile?: File | null
}

export function DocumentUploadButton({
  onAddDocument,
  categories,
  onAddCategory,
  open,
  onOpenChange,
  initialFile = null,
}: DocumentUploadButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  const isControlled = open !== undefined && onOpenChange !== undefined

  // Update local state when controlled props change
  useEffect(() => {
    if (isControlled) {
      setIsOpen(open)
    }
  }, [isControlled, open])

  // Update file when initialFile changes
  useEffect(() => {
    if (initialFile) {
      setFile(initialFile)
    }
  }, [initialFile])

  const handleOpenChange = (newOpen: boolean) => {
    if (isControlled) {
      onOpenChange(newOpen)
    } else {
      setIsOpen(newOpen)
    }

    // Reset file when dialog is closed
    if (!newOpen) {
      setFile(null)
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

      <Dialog open={isControlled ? open : isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Upload New Document</DialogTitle>
          </DialogHeader>
          <DocumentForm onSave={handleSave} categories={categories} onAddCategory={onAddCategory} initialFile={file} />
        </DialogContent>
      </Dialog>
    </>
  )
}

