import type { Document, Category } from "@/lib/types"
import { initialCategories } from "@/lib/data"

// Generate a unique user ID for the current browser
const getUserId = (): string => {
  // Only run in browser environment
  if (typeof window === "undefined") return "server"

  const storageKey = "document_manager_user_id"
  let userId = localStorage.getItem(storageKey)

  if (!userId) {
    userId = `user_${Math.random().toString(36).substring(2, 15)}`
    try {
      localStorage.setItem(storageKey, userId)
    } catch (e) {
      console.error("Failed to set user ID:", e)
    }
  }

  return userId
}

// Get storage keys with user ID to separate data between users
const getDocumentsKey = (): string => `documents_${getUserId()}`
const getCategoriesKey = (): string => `categories_${getUserId()}`

// Save documents to localStorage
export const saveDocuments = (documents: Document[]): void => {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(getDocumentsKey(), JSON.stringify(documents))
  } catch (error) {
    console.error("Error saving documents to localStorage:", error)
  }
}

// Load documents from localStorage
export const loadDocuments = (): Document[] => {
  if (typeof window === "undefined") return []

  try {
    const storedDocuments = localStorage.getItem(getDocumentsKey())
    return storedDocuments ? JSON.parse(storedDocuments) : []
  } catch (error) {
    console.error("Error loading documents from localStorage:", error)
    return []
  }
}

// Save categories to localStorage
export const saveCategories = (categories: Category[]): void => {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(getCategoriesKey(), JSON.stringify(categories))
  } catch (error) {
    console.error("Error saving categories to localStorage:", error)
  }
}

// Load categories from localStorage
export const loadCategories = (): Category[] => {
  if (typeof window === "undefined") return initialCategories

  try {
    const storedCategories = localStorage.getItem(getCategoriesKey())
    return storedCategories ? JSON.parse(storedCategories) : initialCategories
  } catch (error) {
    console.error("Error loading categories from localStorage:", error)
    return initialCategories
  }
}

// Check if localStorage is available
export const isStorageAvailable = (): boolean => {
  if (typeof window === "undefined") return false

  try {
    const testKey = "__storage_test__"
    localStorage.setItem(testKey, testKey)
    localStorage.removeItem(testKey)
    return true
  } catch (e) {
    return false
  }
}

