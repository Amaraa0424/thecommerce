"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, X } from "lucide-react"
import { useProducts } from "@/contexts/products-context"

export function ProductsSearch() {
  const { filters, setFilters } = useProducts()
  const [searchInput, setSearchInput] = useState(filters.search || "")

  const handleSearch = () => {
    setFilters({
      ...filters,
      search: searchInput.trim() || undefined
    })
  }

  const handleClearSearch = () => {
    setSearchInput("")
    setFilters({
      ...filters,
      search: undefined
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  return (
    <div className="flex items-center space-x-2 w-full max-w-md">
      <div className="relative flex-1">
        <Input
          placeholder="Search products..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyPress={handleKeyPress}
          className="pr-10"
        />
        {searchInput && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            onClick={handleClearSearch}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
      <Button onClick={handleSearch} size="sm">
        <Search className="h-4 w-4" />
      </Button>
    </div>
  )
}