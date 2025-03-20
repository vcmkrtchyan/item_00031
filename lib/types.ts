export interface Document {
  id: string
  title: string
  category: string
  uploadDate: string
  expiryDate?: string
  fileUrl?: string
  fileName?: string
  fileType?: string
  notes?: string
}

export interface Category {
  category: string
  name: string
  color: string
}

