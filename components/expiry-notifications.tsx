"use client"

import { useState } from "react"
import { AlertCircle, X } from "lucide-react"
import type { Document } from "@/lib/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

interface ExpiryNotificationsProps {
  documents: Document[]
}

export function ExpiryNotifications({ documents }: ExpiryNotificationsProps) {
  const [dismissed, setDismissed] = useState<string[]>([])

  if (!documents.length) {
    return null
  }

  const isToday = (date: Date): boolean => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  // Get expired documents (excluding today)
  const expiredDocuments = documents.filter(
    (doc) =>
      doc.expiryDate &&
      !dismissed.includes(doc.id) &&
      new Date(doc.expiryDate) < new Date() &&
      !isToday(new Date(doc.expiryDate)),
  )

  // Update the expiringDocuments to include today
  const expiringDocuments = documents.filter(
    (doc) =>
      doc.expiryDate &&
      !dismissed.includes(doc.id) &&
      (isToday(new Date(doc.expiryDate)) || // Include today as expiring soon
        (new Date(doc.expiryDate) > new Date() &&
          new Date(doc.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))),
  )

  const handleDismiss = (id: string) => {
    setDismissed((prev) => [...prev, id])
  }

  if (expiringDocuments.length === 0 && expiredDocuments.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      {expiredDocuments.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Expired Documents</AlertTitle>
          <AlertDescription className="flex justify-between items-start">
            <div>
              You have {expiredDocuments.length} expired document{expiredDocuments.length > 1 ? "s" : ""}:
              <span className="font-medium ml-1">{expiredDocuments.map((doc) => doc.title).join(", ")}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 -mt-1"
              onClick={() => expiredDocuments.forEach((doc) => handleDismiss(doc.id))}
            >
              <X className="h-3 w-3" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {expiringDocuments.length > 0 && (
        <Alert variant="warning">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Documents Expiring Soon</AlertTitle>
          <AlertDescription className="flex justify-between items-start">
            <div>
              You have {expiringDocuments.length} document{expiringDocuments.length > 1 ? "s" : ""} expiring in the next
              30 days:
              <span className="font-medium ml-1">{expiringDocuments.map((doc) => doc.title).join(", ")}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 -mt-1"
              onClick={() => expiringDocuments.forEach((doc) => handleDismiss(doc.id))}
            >
              <X className="h-3 w-3" />
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

