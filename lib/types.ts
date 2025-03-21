export interface Document {
  id: string
  title: string
  category: string
  uploadDate: string
  expiryDate?: string
  fileName?: string
  fileType?: string
  fileContent?: string
  notes?: string
}

export interface Category {
  category: string
  name: string
  color: string
}

