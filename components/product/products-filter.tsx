"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Star, X } from "lucide-react"
import { categories } from "@/lib/data"

export function ProductsFilter() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState([0, 1000])
  const [selectedAvailability, setSelectedAvailability] = useState<string[]>([])
  const [minRating, setMinRating] = useState(0)

  const availabilityOptions = [
    { value: "in-stock", label: "In Stock" },
    { value: "limited", label: "Limited Stock" },
    { value: "out-of-stock", label: "Out of Stock" },
  ]

  const handleCategoryChange = (category: string, checked: boolean) => {
    if (checked) {
      setSelectedCategories([...selectedCategories, category])
    } else {
      setSelectedCategories(selectedCategories.filter((c) => c !== category))
    }
  }

  const handleAvailabilityChange = (availability: string, checked: boolean) => {
    if (checked) {
      setSelectedAvailability([...selectedAvailability, availability])
    } else {
      setSelectedAvailability(selectedAvailability.filter((a) => a !== availability))
    }
  }

  const clearAllFilters = () => {
    setSelectedCategories([])
    setPriceRange([0, 1000])
    setSelectedAvailability([])
    setMinRating(0)
  }

  const hasActiveFilters =
    selectedCategories.length > 0 ||
    priceRange[0] > 0 ||
    priceRange[1] < 1000 ||
    selectedAvailability.length > 0 ||
    minRating > 0

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Filters</CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
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
            {categories
              .filter((cat) => cat !== "All")
              .map((category) => (
                <div key={category} className="flex items-center space-x-2">
                  <Checkbox
                    id={category}
                    checked={selectedCategories.includes(category)}
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
            <Slider value={priceRange} onValueChange={setPriceRange} max={1000} min={0} step={10} className="w-full" />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>${priceRange[0]}</span>
              <span>${priceRange[1]}</span>
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
                  checked={selectedAvailability.includes(option.value)}
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
                  checked={minRating === rating}
                  onCheckedChange={(checked) => setMinRating(checked ? rating : 0)}
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

        {/* Active Filters */}
        {hasActiveFilters && (
          <>
            <Separator />
            <div>
              <h3 className="font-medium mb-3">Active Filters</h3>
              <div className="flex flex-wrap gap-2">
                {selectedCategories.map((category) => (
                  <Badge key={category} variant="secondary" className="text-xs">
                    {category}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 ml-1"
                      onClick={() => handleCategoryChange(category, false)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
                {(priceRange[0] > 0 || priceRange[1] < 1000) && (
                  <Badge variant="secondary" className="text-xs">
                    ${priceRange[0]} - ${priceRange[1]}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 ml-1"
                      onClick={() => setPriceRange([0, 1000])}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                {selectedAvailability.map((availability) => (
                  <Badge key={availability} variant="secondary" className="text-xs">
                    {availabilityOptions.find((opt) => opt.value === availability)?.label}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 ml-1"
                      onClick={() => handleAvailabilityChange(availability, false)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
                {minRating > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {minRating}+ stars
                    <Button variant="ghost" size="sm" className="h-auto p-0 ml-1" onClick={() => setMinRating(0)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
