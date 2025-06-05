"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Search, Filter, Star } from "lucide-react"
import { useRouter } from "next/navigation"
import { useProducts } from "@/contexts/products-context"

interface FilterCriteriaProps {
  searchQuery?: string
}

export function FilterCriteria({ searchQuery }: FilterCriteriaProps) {
  const router = useRouter()
  const { products, pagination, filters, setFilters, clearFilters } = useProducts()

  const clearSearch = () => {
    router.push('/products')
  }

  const handleCategoryChange = (category: string) => {
    setFilters({
      ...filters,
      category: "All"
    })
  }

  const handleAvailabilityChange = (availability: string) => {
    const newAvailability = filters.availability.filter((a) => a !== availability)
    setFilters({
      ...filters,
      availability: newAvailability
    })
  }

  const handlePriceRangeChange = () => {
    setFilters({
      ...filters,
      priceRange: [0, 1000]
    })
  }

  const handleRatingChange = () => {
    setFilters({
      ...filters,
      rating: 0
    })
  }

  const availabilityOptions = [
    { value: "in-stock", label: "In Stock" },
    { value: "limited", label: "Limited Stock" },
    { value: "out-of-stock", label: "Out of Stock" },
  ]

  const hasActiveFilters =
    searchQuery ||
    filters.category !== "All" ||
    filters.priceRange[0] > 0 ||
    filters.priceRange[1] < 1000 ||
    filters.availability.length > 0 ||
    filters.rating > 0

  if (!hasActiveFilters) {
    return null
  }

  const totalResults = pagination?.total || products.length

  return (
    <div className="mb-6 p-4 bg-muted/50 rounded-lg border space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Active Filters</span>
          {totalResults !== undefined && (
            <span className="text-sm text-muted-foreground">
              ({totalResults} {totalResults === 1 ? 'result' : 'results'} found)
            </span>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={searchQuery ? clearSearch : clearFilters}
          className="text-xs"
        >
          Clear All
        </Button>
      </div>

      {/* Active Filters */}
      <div className="flex flex-wrap gap-2">
        {/* Search Filter */}
        {searchQuery && (
          <Badge variant="secondary" className="flex items-center gap-2">
            <Search className="h-3 w-3" />
            <span>"{searchQuery}"</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
              onClick={clearSearch}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        )}

        {/* Category Filter */}
        {filters.category !== "All" && (
          <Badge variant="secondary" className="flex items-center gap-2">
            <span>{filters.category}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => handleCategoryChange(filters.category)}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        )}

        {/* Price Range Filter */}
        {(filters.priceRange[0] > 0 || filters.priceRange[1] < 1000) && (
          <Badge variant="secondary" className="flex items-center gap-2">
            <span>${filters.priceRange[0]} - ${filters.priceRange[1]}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
              onClick={handlePriceRangeChange}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        )}

        {/* Availability Filters */}
        {filters.availability.map((availability) => (
          <Badge key={availability} variant="secondary" className="flex items-center gap-2">
            <span>{availabilityOptions.find((opt) => opt.value === availability)?.label}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => handleAvailabilityChange(availability)}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))}

        {/* Rating Filter */}
        {filters.rating > 0 && (
          <Badge variant="secondary" className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span>{filters.rating}+ stars</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
              onClick={handleRatingChange}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        )}
      </div>
    </div>
  )
}