import type { Document, Category } from "@/lib/types"
import { initialCategories } from "@/lib/data"

// Storage keys
const DOCUMENTS_KEY = "documents"
const LAST_DELETED_DOCUMENT_KEY = "lastDeletedDocument"
const LAST_DELETED_DOCUMENT_INDEX_KEY = "lastDeletedDocumentIndex"
const CATEGORIES_KEY = "categories"

// Approximate localStorage size limit (varies by browser, but 5MB is a safe estimate)
const LOCALSTORAGE_LIMIT = 5 * 1024 * 1024 // 5MB in bytes

// Check available localStorage space
export const getLocalStorageUsage = (): { used: number; available: number; percentUsed: number } => {
  let totalSize = 0

  // Calculate size of all items in localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key) {
      const value = localStorage.getItem(key) || ""
      totalSize += key.length + value.length
    }
  }

  // Convert to bytes (2 bytes per character in UTF-16)
  const usedBytes = totalSize * 2
  const availableBytes = Math.max(0, LOCALSTORAGE_LIMIT - usedBytes)
  const percentUsed = (usedBytes / LOCALSTORAGE_LIMIT) * 100

  return {
    used: usedBytes,
    available: availableBytes,
    percentUsed: percentUsed,
  }
}

// Check if there's enough space to store data of a certain size
export const hasEnoughStorageSpace = (dataSize: number): boolean => {
  const { available } = getLocalStorageUsage()
  return dataSize <= available
}

// Format bytes to human-readable format
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

// Estimate size of a document in bytes
export const estimateDocumentSize = (document: Document): number => {
  // Convert document to JSON string and calculate its length
  const jsonString = JSON.stringify(document)
  // UTF-16 uses 2 bytes per character
  return jsonString.length * 2
}

// Documents functions
export const saveDocuments = (documents: Document[]): { success: boolean; error?: string } => {
  try {
    const jsonString = JSON.stringify(documents)
    const dataSize = jsonString.length * 2 // UTF-16 uses 2 bytes per character

    if (!hasEnoughStorageSpace(dataSize)) {
      return {
        success: false,
        error: `Not enough storage space. Need ${formatBytes(dataSize)}, but only ${formatBytes(getLocalStorageUsage().available)} available.`,
      }
    }

    localStorage.setItem(DOCUMENTS_KEY, jsonString)
    return { success: true }
  } catch (error) {
    if (
      error instanceof DOMException &&
      (error.name === "QuotaExceededError" || error.name === "NS_ERROR_DOM_QUOTA_REACHED")
    ) {
      // localStorage quota exceeded
      return {
        success: false,
        error: "Storage full. Please delete some documents to free up space.",
      }
    }
    console.error("Error saving documents:", error)
    return { success: false, error: "Failed to save documents." }
  }
}

export const loadDocuments = (): Document[] => {
  const storedDocuments = localStorage.getItem(DOCUMENTS_KEY)
  return storedDocuments ? JSON.parse(storedDocuments) : []
}

// Last deleted document functions
export const saveLastDeletedDocument = (document: Document, index: number): void => {
  localStorage.setItem(LAST_DELETED_DOCUMENT_KEY, JSON.stringify(document))
  localStorage.setItem(LAST_DELETED_DOCUMENT_INDEX_KEY, index.toString())
}

export const loadLastDeletedDocument = (): Document | null => {
  const storedDocument = localStorage.getItem(LAST_DELETED_DOCUMENT_KEY)
  return storedDocument ? JSON.parse(storedDocument) : null
}

export const loadLastDeletedDocumentIndex = (): number => {
  const storedIndex = localStorage.getItem(LAST_DELETED_DOCUMENT_INDEX_KEY)
  return storedIndex ? Number.parseInt(storedIndex, 10) : -1
}

export const clearLastDeletedDocument = (): void => {
  localStorage.removeItem(LAST_DELETED_DOCUMENT_KEY)
  localStorage.removeItem(LAST_DELETED_DOCUMENT_INDEX_KEY)
}

export const hasLastDeletedDocument = (): boolean => {
  return localStorage.getItem(LAST_DELETED_DOCUMENT_KEY) !== null
}

// Categories functions
export const saveCategories = (categories: Category[]): { success: boolean; error?: string } => {
  try {
    const jsonString = JSON.stringify(categories)
    localStorage.setItem(CATEGORIES_KEY, jsonString)
    return { success: true }
  } catch (error) {
    if (
      error instanceof DOMException &&
      (error.name === "QuotaExceededError" || error.name === "NS_ERROR_DOM_QUOTA_REACHED")
    ) {
      return {
        success: false,
        error: "Storage full. Please delete some documents to free up space.",
      }
    }
    console.error("Error saving categories:", error)
    return { success: false, error: "Failed to save categories." }
  }
}

export const loadCategories = (): Category[] => {
  const storedCategories = localStorage.getItem(CATEGORIES_KEY)
  return storedCategories ? JSON.parse(storedCategories) : initialCategories
}

// Check if localStorage is available
export const isStorageAvailable = (): boolean => {
  try {
    const testKey = "__storage_test__"
    localStorage.setItem(testKey, testKey)
    localStorage.removeItem(testKey)
    return true
  } catch (e) {
    return false
  }
}

export const clearDocuments = (): void => {
  localStorage.removeItem(DOCUMENTS_KEY)
}

