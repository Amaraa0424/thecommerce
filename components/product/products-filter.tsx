"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Star, X } from "lucide-react"
import { useProducts } from "@/contexts/products-context"

export function ProductsFilter() {
  const { filters, setFilters, clearFilters } = useProducts()
  const [categories, setCategories] = useState<string[]>([])

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories')
        const data = await response.json()
        if (data.success) {
          const categoryNames = data.data
            .filter((cat: any) => cat.id !== 'all')
            .map((cat: any) => cat.name)
          setCategories(categoryNames)
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error)
        // Fallback to hardcoded categories
        setCategories(["Electronics", "Clothing", "Home & Garden", "Sports", "Books", "Beauty"])
      }
    }
    fetchCategories()
  }, [])

  const availabilityOptions = [
    { value: "in-stock", label: "In Stock" },
    { value: "limited", label: "Limited Stock" },
    { value: "out-of-stock", label: "Out of Stock" },
  ]

  const handleCategoryChange = (category: string, checked: boolean) => {
    const newCategory = checked ? category : "All"
    setFilters({
      ...filters,
      category: newCategory
    })
  }

  const handleAvailabilityChange = (availability: string, checked: boolean) => {
    const newAvailability = checked
      ? [...filters.availability, availability]
      : filters.availability.filter((a) => a !== availability)
    
    setFilters({
      ...filters,
      availability: newAvailability
    })
  }

  const handlePriceRangeChange = (newRange: number[]) => {
    setFilters({
      ...filters,
      priceRange: [newRange[0], newRange[1]]
    })
  }

  const handleRatingChange = (rating: number, checked: boolean) => {
    setFilters({
      ...filters,
      rating: checked ? rating : 0
    })
  }

  const hasActiveFilters =
    filters.category !== "All" ||
    filters.priceRange[0] > 0 ||
    filters.priceRange[1] < 1000 ||
    filters.availability.length > 0 ||
    filters.rating > 0 ||
    filters.search

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Filters</CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Categories */}
        <div>
          <h3 className="font-medium mb-3">Categories</h3>
          <div className="space-y-2">
            {categories.map((category) => (
              <div key={category} className="flex items-center space-x-2">
                <Checkbox
                  id={category}
                  checked={filters.category === category}
                  onCheckedChange={(checked) => handleCategoryChange(category, checked as boolean)}
                />
                <label
                  htmlFor={category}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {category}
                </label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Price Range */}
        <div>
          <h3 className="font-medium mb-3">Price Range</h3>
          <div className="space-y-4">
            <Slider 
              value={filters.priceRange} 
              onValueChange={handlePriceRangeChange} 
              max={1000} 
              min={0} 
              step={10} 
              className="w-full" 
            />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>${filters.priceRange[0]}</span>
              <span>${filters.priceRange[1]}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Availability */}
        <div>
          <h3 className="font-medium mb-3">Availability</h3>
          <div className="space-y-2">
            {availabilityOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={option.value}
                  checked={filters.availability.includes(option.value)}
                  onCheckedChange={(checked) => handleAvailabilityChange(option.value, checked as boolean)}
                />
                <label
                  htmlFor={option.value}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Rating */}
        <div>
          <h3 className="font-medium mb-3">Minimum Rating</h3>
          <div className="space-y-2">
            {[4, 3, 2, 1].map((rating) => (
              <div key={rating} className="flex items-center space-x-2">
                <Checkbox
                  id={`rating-${rating}`}
                  checked={filters.rating === rating}
                  onCheckedChange={(checked) => handleRatingChange(rating, checked as boolean)}
                />
                <label
                  htmlFor={`rating-${rating}`}
                  className="flex items-center space-x-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${
                          i < rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                        }`}
                      />
                    ))}
                  </div>
                  <span>& up</span>
                </label>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}