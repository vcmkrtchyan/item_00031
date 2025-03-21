"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { clearDocuments } from "@/lib/storage-utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Bug } from "lucide-react"

interface DebugPanelProps {
  documents: any[]
  onClearDocuments: () => void
}

export function DebugPanel({ documents, onClearDocuments }: DebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleClearDocuments = () => {
    clearDocuments()
    onClearDocuments()
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="fixed bottom-4 right-4 z-50 opacity-50 hover:opacity-100">
          <Bug className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Debug Panel</DialogTitle>
          <DialogDescription>Document Manager Debug Tools</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-4">
          <div>
            <h3 className="font-medium mb-2">Documents ({documents.length})</h3>
            <div className="max-h-40 overflow-y-auto border rounded p-2 text-xs">
              {documents.length === 0 ? (
                <p className="text-muted-foreground">No documents</p>
              ) : (
                documents.map((doc, i) => (
                  <div key={i} className="mb-1">
                    <strong>{i}:</strong> {doc.id} - {doc.title}
                    {doc._hasLargeFile && <span className="text-warning ml-1">(large file)</span>}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="destructive" onClick={handleClearDocuments}>
              Clear All Documents
            </Button>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

