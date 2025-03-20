"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { DocumentList } from "@/components/document-list"
import { DocumentSearch } from "@/components/document-search"
import { CategoryFilter } from "@/components/category-filter"
import { DocumentUploadButton } from "@/components/document-upload-button"
import { ExpiryNotifications } from "@/components/expiry-notifications"
import type { Document, Category } from "@/lib/types"
import { initialCategories } from "@/lib/data"
import { loadDocuments, saveDocuments, loadCategories, saveCategories, isStorageAvailable } from "@/lib/storage-utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"

export function Dashboard() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [storageAvailable, setStorageAvailable] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  // Load data from localStorage on initial render
  useEffect(() => {
    // Use requestAnimationFrame to ensure this runs after styles are applied
    const loadData = () => {
      try {
        const storage = isStorageAvailable()
        setStorageAvailable(storage)

        if (storage) {
          setDocuments(loadDocuments())
          setCategories(loadCategories())
        }
      } catch (error) {
        console.error("Error loading data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    // Delay execution to next frame to avoid layout calculations during initial render
    requestAnimationFrame(loadData)

    return () => {
      // Cleanup if needed
    }
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
    const updatedDocuments = [...documents, document]
    setDocuments(updatedDocuments)

    if (storageAvailable) {
      // Use setTimeout to defer storage operations
      setTimeout(() => {
        saveDocuments(updatedDocuments)
      }, 0)
    }

    toast({
      title: "Document added",
      description: `${document.title} has been added successfully.`,
    })
    setUploadDialogOpen(false)
  }

  // Update an existing document
  const handleUpdateDocument = (updatedDoc: Document) => {
    const updatedDocuments = documents.map((doc) => (doc.id === updatedDoc.id ? updatedDoc : doc))

    setDocuments(updatedDocuments)

    if (storageAvailable) {
      // Use setTimeout to defer storage operations
      setTimeout(() => {
        saveDocuments(updatedDocuments)
      }, 0)
    }

    toast({
      title: "Document updated",
      description: `${updatedDoc.title} has been updated successfully.`,
    })
  }

  // Delete a document
  const handleDeleteDocument = (id: string) => {
    const updatedDocuments = documents.filter((doc) => doc.id !== id)
    setDocuments(updatedDocuments)

    if (storageAvailable) {
      // Use setTimeout to defer storage operations
      setTimeout(() => {
        saveDocuments(updatedDocuments)
      }, 0)
    }

    toast({
      title: "Document deleted",
      description: "The document has been deleted successfully.",
    })
  }

  // Add a new category
  const handleAddCategory = (category: Category) => {
    const updatedCategories = [...categories, category]
    setCategories(updatedCategories)

    if (storageAvailable) {
      // Use setTimeout to defer storage operations
      setTimeout(() => {
        saveCategories(updatedCategories)
      }, 0)
    }

    toast({
      title: "Category added",
      description: `${category.name} category has been added.`,
    })
  }

  const openUploadDialog = () => {
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
          <DocumentUploadButton
            onAddDocument={handleAddDocument}
            categories={categories}
            onAddCategory={handleAddCategory}
            open={uploadDialogOpen}
            onOpenChange={setUploadDialogOpen}
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
        onDeleteDocument={handleDeleteDocument}
        onAddClick={openUploadDialog}
      />
    </div>
  )
}

