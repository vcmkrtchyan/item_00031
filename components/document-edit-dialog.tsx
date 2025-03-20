"use client"

import type { Document, Category } from "@/lib/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DocumentForm } from "@/components/document-form"

interface DocumentEditDialogProps {
  document: Document
  categories: Category[]
  onSave: (document: Document) => void
  onCancel: () => void
  open: boolean
}

export function DocumentEditDialog({ document, categories, onSave, onCancel, open }: DocumentEditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Document</DialogTitle>
        </DialogHeader>
        <DocumentForm document={document} categories={categories} onSave={onSave} onAddCategory={() => {}} />
      </DialogContent>
    </Dialog>
  )
}

