"use client"

import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { DocumentList } from "@/components/document-list"
import { DocumentSearch } from "@/components/document-search"
import { CategoryFilter } from "@/components/category-filter"
import { DocumentUploadButton } from "@/components/document-upload-button"
import { ExpiryNotifications } from "@/components/expiry-notifications"
import type { Document, Category } from "@/lib/types"
import { initialCategories } from "@/lib/data"
import {
  loadDocuments,
  saveDocuments,
  loadCategories,
  saveCategories,
  isStorageAvailable,
  saveLastDeletedDocument,
  loadLastDeletedDocumentIndex,
  clearLastDeletedDocument,
  hasLastDeletedDocument,
  estimateDocumentSize,
  hasEnoughStorageSpace,
  formatBytes,
  getLocalStorageUsage,
  loadLastDeletedDocument,
} from "@/lib/storage-utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2, AlertTriangle, Undo2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export function Dashboard() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [droppedFile, setDroppedFile] = useState<File | null>(null)
  const [storageAvailable, setStorageAvailable] = useState(true)
  const [storageWarning, setStorageWarning] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null)
  const [hasDeletedDoc, setHasDeletedDoc] = useState(false)
  const { toast } = useToast()

  // Load data from localStorage on initial render
  useEffect(() => {
    const loadData = () => {
      try {
        const storage = isStorageAvailable()
        setStorageAvailable(storage)

        if (storage) {
          setDocuments(loadDocuments())
          setCategories(loadCategories())
          setHasDeletedDoc(hasLastDeletedDocument())

          // Check storage usage and show warning if over 80%
          const { percentUsed, used, available } = getLocalStorageUsage()
          if (percentUsed > 80) {
            setStorageWarning(
              `Storage is ${percentUsed.toFixed(1)}% full (${formatBytes(used)} used, ${formatBytes(available)} available). Consider deleting unused documents.`,
            )
          }
        }
      } catch (error) {
        console.error("Error loading data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // Filter documents based on search query and selected category
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.notes?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = selectedCategory ? doc.category === selectedCategory : true

    return matchesSearch && matchesCategory
  })

  // Add a new document
  const handleAddDocument = (document: Document) => {
    // Estimate the size of the document
    const documentSize = estimateDocumentSize(document)

    // Check if we have enough space
    if (!hasEnoughStorageSpace(documentSize)) {
      const { available } = getLocalStorageUsage()
      toast({
        title: "Storage Full",
        description: `Not enough storage space. This document requires approximately ${formatBytes(documentSize)}, but only ${formatBytes(available)} is available. Please delete some documents to free up space.`,
        variant: "destructive",
      })
      return
    }

    const updatedDocuments = [...documents, document]
    setDocuments(updatedDocuments)

    if (storageAvailable) {
      const result = saveDocuments(updatedDocuments)
      if (!result.success) {
        toast({
          title: "Storage Error",
          description:
            result.error ||
            "Failed to save document due to storage limitations. Please delete some documents to free up space.",
          variant: "destructive",
        })
        // Revert the state change since we couldn't save
        setDocuments(documents)
        return
      }
    }

    toast({
      title: "Document added",
      description: `${document.title} has been added successfully.`,
    })
    setUploadDialogOpen(false)
    setDroppedFile(null)
  }

  // Update an existing document
  const handleUpdateDocument = (updatedDoc: Document) => {
    // Create a new array with the updated document
    const updatedDocuments = documents.map((doc) => (doc.id === updatedDoc.id ? updatedDoc : doc))

    // Check if we have enough space (only if the document size increased)
    const oldDocIndex = documents.findIndex((doc) => doc.id === updatedDoc.id)
    const oldDoc = oldDocIndex !== -1 ? documents[oldDocIndex] : null

    if (oldDoc) {
      const oldSize = estimateDocumentSize(oldDoc)
      const newSize = estimateDocumentSize(updatedDoc)

      if (newSize > oldSize && !hasEnoughStorageSpace(newSize - oldSize)) {
        const { available } = getLocalStorageUsage()
        toast({
          title: "Storage Full",
          description: `Not enough storage space. This update requires approximately ${formatBytes(newSize - oldSize)} additional space, but only ${formatBytes(available)} is available. Please delete some documents to free up space.`,
          variant: "destructive",
        })
        return
      }
    }

    setDocuments(updatedDocuments)

    if (storageAvailable) {
      const result = saveDocuments(updatedDocuments)
      if (!result.success) {
        toast({
          title: "Storage Error",
          description:
            result.error ||
            "Failed to save document due to storage limitations. Please delete some documents to free up space.",
          variant: "destructive",
        })
        // Revert the state change since we couldn't save
        setDocuments(documents)
        return
      }
    }

    toast({
      title: "Document updated",
      description: `${updatedDoc.title} has been updated successfully.`,
    })
  }

  // Initiate document deletion with confirmation
  const initiateDeleteDocument = useCallback((document: Document) => {
    console.log("Initiating delete for document:", document.id, document.title)
    setDocumentToDelete(document)
    setDeleteDialogOpen(true)
  }, [])

  // Handle document deletion after confirmation
  const handleDeleteDocument = useCallback(() => {
    if (!documentToDelete) {
      console.log("No document to delete")
      return
    }

    console.log("Deleting document:", documentToDelete.id, documentToDelete.title)

    // Close the dialog
    setDeleteDialogOpen(false)

    // 1. Find the index of the document in the array
    const index = documents.findIndex((doc) => doc.id === documentToDelete.id)
    console.log("Document index in array:", index)
    console.log(
      "All document IDs:",
      documents.map((doc) => doc.id),
    )

    // 2. Store the document and its index in localStorage
    if (storageAvailable && index !== -1) {
      saveLastDeletedDocument(documentToDelete, index)
      setHasDeletedDoc(true)
    }

    // 3. Remove the document from the array
    const updatedDocuments = documents.filter((doc) => doc.id !== documentToDelete.id)
    console.log("Documents after filter:", updatedDocuments.length)
    setDocuments(updatedDocuments)

    // 4. Save the updated array to localStorage
    if (storageAvailable) {
      const result = saveDocuments(updatedDocuments)
      if (!result.success) {
        // This is unlikely to happen since we're removing data, not adding
        console.error("Error saving documents after deletion:", result.error)
      }

      // Update storage warning after deletion
      const { percentUsed, used, available } = getLocalStorageUsage()
      if (percentUsed > 80) {
        setStorageWarning(
          `Storage is ${percentUsed.toFixed(1)}% full (${formatBytes(used)} used, ${formatBytes(available)} available). Consider deleting unused documents.`,
        )
      } else {
        setStorageWarning(null)
      }
    }

    // 5. Clear the document to delete
    setDocumentToDelete(null)

    // 6. Show toast with undo option
    toast({
      title: "Document deleted",
      description: (
        <div className="flex items-center justify-between gap-4">
          <span>{`"${documentToDelete.title}" has been deleted.`}</span>
          <button
            onClick={handleUndoDelete}
            className="flex items-center text-primary hover:underline font-medium shrink-0"
          >
            <Undo2 className="h-4 w-4 mr-1" />
            Undo
          </button>
        </div>
      ),
      duration: 5000, // 5 seconds for the toast to disappear
    })
  }, [documentToDelete, documents, storageAvailable, toast])

  // Cancel deletion
  const handleCancelDelete = useCallback(() => {
    setDeleteDialogOpen(false)
    setDocumentToDelete(null)
  }, [])

  // Handle undo delete - Fixed to avoid dependency issues
  const handleUndoDelete = useCallback(() => {
    if (!storageAvailable) return

    // 1. Get the last deleted document and its index
    const lastDeletedDocument = loadLastDeletedDocument()
    const lastDeletedIndex = loadLastDeletedDocumentIndex()

    if (!lastDeletedDocument) {
      toast({
        title: "Undo failed",
        description: "Could not find the deleted document to restore.",
        variant: "destructive",
      })
      return
    }

    // Check if we have enough space to restore the document
    const documentSize = estimateDocumentSize(lastDeletedDocument)
    if (!hasEnoughStorageSpace(documentSize)) {
      const { available } = getLocalStorageUsage()
      toast({
        title: "Storage Full",
        description: `Not enough storage space to restore the document. It requires approximately ${formatBytes(documentSize)}, but only ${formatBytes(available)} is available. Please delete some documents to free up space.`,
        variant: "destructive",
      })
      return
    }

    // 2. IMPORTANT: Clear the last deleted document from localStorage FIRST
    // This prevents any possibility of double restoration
    clearLastDeletedDocument()

    // 3. Update the UI state to reflect that there's no deleted document
    setHasDeletedDoc(false)

    // 4. Create a new array with the document inserted at the correct position
    setDocuments((prevDocuments) => {
      const newDocuments = [...prevDocuments]

      // Insert at the original index if valid, otherwise add to the end
      if (lastDeletedIndex >= 0 && lastDeletedIndex <= newDocuments.length) {
        newDocuments.splice(lastDeletedIndex, 0, lastDeletedDocument)
      } else {
        newDocuments.push(lastDeletedDocument)
      }

      // Save to localStorage
      if (storageAvailable) {
        const result = saveDocuments(newDocuments)
        if (!result.success) {
          toast({
            title: "Storage Error",
            description: result.error || "Failed to restore document due to storage limitations.",
            variant: "destructive",
          })
          // Don't update the state if we couldn't save
          return prevDocuments
        }
      }

      return newDocuments
    })

    // 5. Show confirmation toast
    toast({
      title: "Deletion undone",
      description: `"${lastDeletedDocument.title}" has been restored.`,
      duration: 5000, // 5 seconds for the toast to disappear
    })
  }, [storageAvailable, toast]) // Removed documents from dependencies

  // Add a new category
  const handleAddCategory = (category: Category) => {
    const updatedCategories = [...categories, category]
    setCategories(updatedCategories)

    if (storageAvailable) {
      const result = saveCategories(updatedCategories)
      if (!result.success) {
        toast({
          title: "Storage Error",
          description: result.error || "Failed to save category due to storage limitations.",
          variant: "destructive",
        })
        // Revert the state change since we couldn't save
        setCategories(categories)
        return
      }
    }

    toast({
      title: "Category added",
      description: `${category.name} category has been added.`,
    })
  }

  const openUploadDialog = () => {
    setUploadDialogOpen(true)
  }

  // Handle file drop
  const handleFileDrop = (file: File) => {
    setDroppedFile(file)
    setUploadDialogOpen(true)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your documents...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Document Manager</h1>
          <p className="text-muted-foreground">Manage your personal documents with ease</p>
        </div>
        <div className="flex items-center gap-2">
          {hasDeletedDoc && (
            <Button variant="outline" onClick={handleUndoDelete} className="mr-2">
              <Undo2 className="h-4 w-4 mr-2" />
              Restore Deleted Document
            </Button>
          )}
          <DocumentUploadButton
            onAddDocument={handleAddDocument}
            categories={categories}
            onAddCategory={handleAddCategory}
            open={uploadDialogOpen}
            onOpenChange={setUploadDialogOpen}
            initialFile={droppedFile}
          />
        </div>
      </header>

      {!storageAvailable && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Storage Unavailable</AlertTitle>
          <AlertDescription>
            Local storage is not available. Your documents will not be saved between sessions. This may be due to
            private browsing mode or browser settings.
          </AlertDescription>
        </Alert>
      )}

      {storageWarning && (
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Storage Limitation</AlertTitle>
          <AlertDescription>{storageWarning}</AlertDescription>
        </Alert>
      )}

      {documents.length > 0 && <ExpiryNotifications documents={documents} />}

      {documents.length > 0 && (
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-3/4">
            <DocumentSearch searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
          </div>
          <div className="w-full md:w-1/4">
            <CategoryFilter
              categories={categories}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
            />
          </div>
        </div>
      )}

      <DocumentList
        documents={filteredDocuments}
        categories={categories}
        onUpdateDocument={handleUpdateDocument}
        onDeleteDocument={initiateDeleteDocument}
        onAddCategory={handleAddCategory}
        onAddClick={openUploadDialog}
        onFileDrop={handleFileDrop}
        isFiltered={searchQuery !== "" || selectedCategory !== null}
        allDocumentsCount={documents.length}
      />

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCancelDelete()
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
            <DialogDescription>
              {documentToDelete
                ? `Are you sure you want to delete "${documentToDelete.title}"? This action can be undone.`
                : "Are you sure you want to delete this document?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelDelete}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteDocument}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

