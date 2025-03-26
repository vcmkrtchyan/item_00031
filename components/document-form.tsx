"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, Upload, FileText } from "lucide-react"
import { v4 as uuidv4 } from "uuid"
import type { Document, Category } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { fileToBase64 } from "@/lib/file-utils"
import { estimateDocumentSize, hasEnoughStorageSpace, getLocalStorageUsage, formatBytes } from "@/lib/storage-utils"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/jpg",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]

// Helper function to compare dates without time
const isBeforeToday = (dateString: string): boolean => {
  const inputDate = new Date(dateString)
  const today = new Date()

  // Reset time components to compare dates only
  inputDate.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)

  return inputDate < today
}

interface DocumentFormProps {
  document?: Document
  categories: Category[]
  onSave: (document: Document) => void
  onAddCategory: (category: Category) => void
  initialFile?: File | null
}

export function DocumentForm({ document, categories, onSave, onAddCategory, initialFile = null }: DocumentFormProps) {
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [newCategoryDialogOpen, setNewCategoryDialogOpen] = useState(false)
  const [newCategory, setNewCategory] = useState("")
  const [customFileLabel, setCustomFileLabel] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Create a dynamic schema based on whether we're editing an existing document
  const formSchema = z.object({
    title: z.string().min(2, {
      message: "Title must be at least 2 characters.",
    }),
    category: z.string().min(1, {
      message: "Please select a category.",
    }),
    expiryDate: z
      .string()
      .refine((date) => !date || !isBeforeToday(date), {
        message: "Expiry date cannot be before today",
      })
      .optional(),
    notes: z.string().optional(),
    file: document?.fileContent
      ? z
          .any()
          .optional() // File is optional when editing a document that already has a file
      : z.any().refine((file) => file instanceof File || file?.name, {
          message: "A file is required",
        }),
  })

  // Check if the document's expiry date is valid (not before today)
  const isExpiryDateValid = (date?: string) => {
    if (!date) return true
    return !isBeforeToday(date)
  }

  // Get today's date in YYYY-MM-DD format for the min attribute
  const today = new Date().toISOString().split("T")[0]

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: document?.title || "",
      category: document?.category || "",
      expiryDate:
        document?.expiryDate && isExpiryDateValid(document.expiryDate)
          ? new Date(document.expiryDate).toISOString().split("T")[0]
          : "",
      notes: document?.notes || "",
      file: undefined,
    },
  })

  // Handle initial file when it changes
  useEffect(() => {
    if (initialFile) {
      setFile(initialFile)
      validateFile(initialFile)
      form.setValue("file", initialFile)
      setCustomFileLabel(`${initialFile.name} (${(initialFile.size / 1024).toFixed(1)} KB)`)
    }
  }, [initialFile, form])

  const validateFile = (selectedFile: File): boolean => {
    setFileError(null)

    // Validate file size
    if (selectedFile.size > MAX_FILE_SIZE) {
      setFileError(`File size should be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`)
      return false
    }

    // Validate file type
    if (!ACCEPTED_FILE_TYPES.includes(selectedFile.type)) {
      setFileError("File type not supported. Please upload PDF, image, or document files.")
      return false
    }

    return true
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null)
    setCustomFileLabel(null)

    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]

      if (validateFile(selectedFile)) {
        setFile(selectedFile)
        form.setValue("file", selectedFile)
      } else {
        form.setValue("file", undefined)
      }
    }
  }

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      const categoryId = newCategory.toLowerCase().replace(/\s+/g, "-")
      onAddCategory({
        category: categoryId,
        name: newCategory,
        color: "black",
      })
      setNewCategory("")
      setNewCategoryDialogOpen(false)
      form.setValue("category", categoryId)
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (fileError) {
      return
    }

    // Double-check expiry date is not before today
    if (values.expiryDate && isBeforeToday(values.expiryDate)) {
      form.setError("expiryDate", {
        type: "manual",
        message: "Expiry date cannot be before today",
      })
      return
    }

    // Check if we have a file (either a new one or an existing one)
    if (!file && !document?.fileContent) {
      form.setError("file", {
        type: "manual",
        message: "A file is required",
      })
      return
    }

    setIsUploading(true)

    try {
      // Process file if present
      let fileContent = document?.fileContent
      let fileName = document?.fileName
      let fileType = document?.fileType

      if (file) {
        try {
          // Check file size before processing
          const estimatedFileSize = file.size * 1.37 // Base64 encoding increases size by ~37%

          if (!hasEnoughStorageSpace(estimatedFileSize)) {
            const { available } = getLocalStorageUsage()
            setFileError(
              `Not enough storage space. This file requires approximately ${formatBytes(estimatedFileSize)}, but only ${formatBytes(available)} is available. Please delete some documents or choose a smaller file.`,
            )
            setIsUploading(false)
            return
          }

          fileContent = await fileToBase64(file)
          fileName = file.name
          fileType = file.type
        } catch (error) {
          console.error("Error converting file to base64:", error)
          setFileError("Error processing file. Please try again.")
          setIsUploading(false)
          return
        }
      }

      const newDocument: Document = {
        id: document?.id || uuidv4(),
        title: values.title,
        category: values.category,
        uploadDate: document?.uploadDate || new Date().toISOString(),
        expiryDate: values.expiryDate || undefined,
        fileContent: fileContent,
        fileName: fileName || "No file",
        fileType: fileType || "image/svg+xml",
        notes: values.notes,
      }

      // Check if the entire document will fit in localStorage
      const documentSize = estimateDocumentSize(newDocument)
      if (!hasEnoughStorageSpace(documentSize)) {
        const { available } = getLocalStorageUsage()
        setFileError(
          `Not enough storage space. This document requires approximately ${formatBytes(documentSize)}, but only ${formatBytes(available)} is available. Please delete some documents or choose a smaller file.`,
        )
        setIsUploading(false)
        return
      }

      onSave(newDocument)
    } catch (error) {
      console.error("Error processing form:", error)
      setFileError("Error processing form. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Document Title</FormLabel>
                <FormControl>
                  <Input placeholder="Enter document title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.category} value={category.category}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>

                  <Dialog open={newCategoryDialogOpen} onOpenChange={setNewCategoryDialogOpen}>
                    <DialogTrigger asChild>
                      <Button type="button" variant="outline" size="icon">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Add New Category</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <FormLabel htmlFor="new-category">Category Name</FormLabel>
                          <Input
                            id="new-category"
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            placeholder="Enter category name"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button type="button" onClick={handleAddCategory}>
                          Add Category
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="expiryDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expiry Date (Optional)</FormLabel>
                <FormControl>
                  <Input type="date" min={today} {...field} />
                </FormControl>
                <FormDescription>Leave blank if the document doesn't expire</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="file"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Document File{document?.fileContent ? " (Optional)" : " *"}</FormLabel>
                <FormControl>
                  <div className="flex flex-col gap-2">
                    {/* Hidden original file input for browser compatibility */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={(e) => {
                        handleFileChange(e)
                      }}
                      className="hidden"
                      accept={ACCEPTED_FILE_TYPES.join(",")}
                      disabled={isUploading}
                    />

                    {/* Custom file input UI */}
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <div
                          className="flex-1 border rounded-md px-3 py-2 text-sm bg-background cursor-pointer hover:bg-accent/50 transition-colors"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          {customFileLabel ||
                            file?.name ||
                            (document?.fileContent && !file ? document.fileName : "Choose file...")}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </div>

                      {file && !customFileLabel && (
                        <p className="text-xs text-muted-foreground">
                          Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                        </p>
                      )}
                      {document?.fileContent && !file && !customFileLabel && (
                        <p className="text-xs text-muted-foreground">Current file: {document.fileName}</p>
                      )}
                      {fileError && <p className="text-xs text-destructive">{fileError}</p>}
                    </div>
                  </div>
                </FormControl>
                <FormDescription>
                  {document?.fileContent
                    ? "Upload a new file to replace the current one (max 5MB)"
                    : "Upload PDF, image, or document file (max 5MB)"}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add any additional notes about this document"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={isUploading}>
            {isUploading ? (
              <>
                <Upload className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : document ? (
              "Update Document"
            ) : (
              "Upload Document"
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}

