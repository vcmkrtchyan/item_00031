/**
 * Utility functions for file handling
 */

// Update the fileToBase64 function to be more robust
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("No file provided"))
      return
    }

    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result)
      } else {
        reject(new Error("Failed to convert file to base64"))
      }
    }

    reader.onerror = (error) => {
      console.error("FileReader error:", error)
      reject(error)
    }

    reader.readAsDataURL(file)
  })
}

// Download a file from a URL or base64 string
export const downloadFile = (fileUrl: string, fileName: string) => {
  // Create a link element
  const link = document.createElement("a")

  // If the fileUrl is a base64 string, use it directly
  if (fileUrl.startsWith("data:")) {
    link.href = fileUrl
  } else {
    // For regular URLs
    link.href = fileUrl
  }

  // Set download attribute with filename
  link.download = fileName

  // Append to body, click, and remove
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Get file type from a file or URL
export const getFileType = (file: File | string): string => {
  if (typeof file === "string") {
    // Handle base64 strings
    if (file.startsWith("data:")) {
      const match = file.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64/)
      return match ? match[1] : "unknown/unknown"
    }

    // Handle URLs
    const extension = file.split(".").pop()?.toLowerCase()
    switch (extension) {
      case "pdf":
        return "application/pdf"
      case "jpg":
      case "jpeg":
        return "image/jpeg"
      case "png":
        return "image/png"
      case "doc":
        return "application/msword"
      case "docx":
        return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      case "xls":
        return "application/vnd.ms-excel"
      case "xlsx":
        return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      default:
        return "application/octet-stream"
    }
  }

  // Handle File objects
  return file.type || "application/octet-stream"
}

// Get a friendly file name from a URL or path
export const getFileName = (fileUrl: string): string => {
  // Extract filename from URL or path
  const parts = fileUrl.split("/")
  let fileName = parts[parts.length - 1]

  // Remove query parameters if present
  fileName = fileName.split("?")[0]

  // If it's a data URL, generate a name based on timestamp
  if (fileUrl.startsWith("data:")) {
    const fileType = getFileType(fileUrl)
    const extension = fileType.split("/")[1] || "file"
    fileName = `document-${Date.now()}.${extension}`
  }

  return fileName || "document"
}

