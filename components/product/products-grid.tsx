"use client"

import { useState, useMemo } from "react"
import { ProductCard } from "./product-card"
import { Button } from "@/components/ui/button"
import { products } from "@/lib/data"

export function ProductsGrid() {
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState({
    category: "All",
    priceRange: [0, 1000] as [number, number],
    availability: "all",
    rating: 0,
  })
  const [sortBy, setSortBy] = useState("newest")

  const itemsPerPage = 8

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    const filtered = products.filter((product) => {
      // Category filter
      if (filters.category !== "All" && product.category !== filters.category) {
        return false
      }

      // Price range filter
      if (product.price < filters.priceRange[0] || product.price > filters.priceRange[1]) {
        return false
      }

      // Availability filter
      if (filters.availability !== "all" && product.availability !== filters.availability) {
        return false
      }

      // Rating filter
      if (product.rating < filters.rating) {
        return false
      }

      return true
    })

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price
        case "price-high":
          return b.price - a.price
        case "rating":
          return b.rating - a.rating
        case "name":
          return a.title.localeCompare(b.title)
        case "newest":
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })

    return filtered
  }, [filters, sortBy])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedProducts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentProducts = filteredAndSortedProducts.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div className="space-y-6">
      {/* Results Info */}
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">
          Showing {startIndex + 1}-{Math.min(endIndex, filteredAndSortedProducts.length)} of{" "}
          {filteredAndSortedProducts.length} products
        </p>
      </div>

      {/* Products Grid */}
      {currentProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {currentProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">No products found matching your criteria.</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              setFilters({
                category: "All",
                priceRange: [0, 1000],
                availability: "all",
                rating: 0,
              })
              setCurrentPage(1)
            }}
          >
            Clear Filters
          </Button>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 pt-8">
          <Button variant="outline" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
            Previous
          </Button>

          {[...Array(totalPages)].map((_, index) => {
            const page = index + 1
            return (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                onClick={() => handlePageChange(page)}
                className="w-10"
              >
                {page}
              </Button>
            )
          })}

          <Button
            variant="outline"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
