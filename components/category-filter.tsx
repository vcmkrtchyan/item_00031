"use client"

import type { Category } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CategoryFilterProps {
  categories: Category[]
  selectedCategory: string | null
  setSelectedCategory: (category: string | null) => void
}

export function CategoryFilter({ categories, selectedCategory, setSelectedCategory }: CategoryFilterProps) {
  // Handle value change with special case for "all"
  const handleValueChange = (value: string) => {
    if (value === "all") {
      setSelectedCategory(null)
    } else {
      setSelectedCategory(value)
    }
  }

  return (
    <div className="space-y-2">
      <Select value={selectedCategory || "all"} onValueChange={handleValueChange}>
        <SelectTrigger>
          <SelectValue placeholder="Filter by category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category.category} value={category.category}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedCategory && (
        <Button variant="ghost" size="sm" className="text-xs" onClick={() => setSelectedCategory(null)}>
          Clear filter
        </Button>
      )}
    </div>
  )
}

