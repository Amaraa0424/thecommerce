"use client"

import { ProductCard } from "./product-card"
import { Button } from "@/components/ui/button"
import { useProducts } from "@/contexts/products-context"

export function ProductsGrid() {
  const { 
    products, 
    pagination, 
    loading, 
    currentPage, 
    setCurrentPage, 
    clearFilters 
  } = useProducts()

  if (loading && products.length === 0) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 h-64 rounded-lg mb-4"></div>
              <div className="bg-gray-200 h-4 rounded mb-2"></div>
              <div className="bg-gray-200 h-4 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Results Info */}
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">
          {pagination ? (
            <>
              Showing {((pagination.currentPage - 1) * 8) + 1}-{Math.min(pagination.currentPage * 8, pagination.total)} of{" "}
              {pagination.total} products
            </>
          ) : (
            "Loading..."
          )}
        </p>
        {loading && <div className="text-sm text-muted-foreground">Loading...</div>}
      </div>

      {/* Products Grid */}
      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : !loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">No products found matching your criteria.</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={clearFilters}
          >
            Clear Filters
          </Button>
        </div>
      ) : null}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center items-center space-x-2 pt-8">
          <Button 
            variant="outline" 
            onClick={() => setCurrentPage(currentPage - 1)} 
            disabled={!pagination.hasPrev || loading}
          >
            Previous
          </Button>

          {[...Array(pagination.pages)].map((_, index) => {
            const page = index + 1
            return (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                onClick={() => setCurrentPage(page)}
                className="w-10"
                disabled={loading}
              >
                {page}
              </Button>
            )
          })}

          <Button
            variant="outline"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={!pagination.hasNext || loading}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
