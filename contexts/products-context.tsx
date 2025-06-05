"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

export interface ProductFilters {
  category: string
  priceRange: [number, number]
  availability: string[]
  rating: number
  search?: string
}

export interface ProductsContextType {
  products: any[]
  pagination: any
  loading: boolean
  filters: ProductFilters
  sortBy: string
  currentPage: number
  setFilters: (filters: ProductFilters) => void
  setSortBy: (sortBy: string) => void
  setCurrentPage: (page: number) => void
  clearFilters: () => void
  refreshProducts: () => void
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined)

const defaultFilters: ProductFilters = {
  category: "All",
  priceRange: [0, 1000],
  availability: [],
  rating: 0,
}

export function ProductsProvider({ 
  children, 
  initialProducts = [], 
  initialPagination = null,
  initialSearch = undefined
}: { 
  children: React.ReactNode
  initialProducts?: any[]
  initialPagination?: any
  initialSearch?: string
}) {
  const [products, setProducts] = useState(initialProducts)
  const [pagination, setPagination] = useState(initialPagination)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<ProductFilters>({
    ...defaultFilters,
    search: initialSearch
  })
  const [sortBy, setSortBy] = useState("newest")
  const [currentPage, setCurrentPage] = useState(1)

  // Update filters when initialSearch changes (for URL parameter changes)
  useEffect(() => {
    setFilters(prevFilters => ({
      ...prevFilters,
      search: initialSearch
    }))
    setCurrentPage(1) // Reset to first page when search changes
  }, [initialSearch])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const sortMapping: Record<string, any> = {
        "price-low": { sortBy: "price", sortOrder: "asc" },
        "price-high": { sortBy: "price", sortOrder: "desc" },
        "rating": { sortBy: "rating", sortOrder: "desc" },
        "name": { sortBy: "title", sortOrder: "asc" },
        "newest": { sortBy: "createdAt", sortOrder: "desc" },
      }

      const sortConfig = sortMapping[sortBy] || sortMapping["newest"]

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "8",
        ...sortConfig,
        ...(filters.category !== "All" && { category: filters.category }),
        ...(filters.availability.length > 0 && { availability: filters.availability.join(",") }),
        ...(filters.priceRange[0] > 0 && { minPrice: filters.priceRange[0].toString() }),
        ...(filters.priceRange[1] < 1000 && { maxPrice: filters.priceRange[1].toString() }),
        ...(filters.rating > 0 && { minRating: filters.rating.toString() }),
        ...(filters.search && { search: filters.search }),
      })

      const response = await fetch(`/api/products?${params}`)
      const data = await response.json()

      if (data.success) {
        setProducts(data.data.products)
        setPagination(data.data.pagination)
      } else {
        console.error("API Error:", data.message)
      }
    } catch (error) {
      console.error("Failed to fetch products:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [currentPage, filters, sortBy])

  const handleSetFilters = (newFilters: ProductFilters) => {
    setFilters(newFilters)
    setCurrentPage(1) // Reset to first page when filters change
  }

  const handleSetSortBy = (newSortBy: string) => {
    setSortBy(newSortBy)
    setCurrentPage(1) // Reset to first page when sort changes
  }

  const handleSetCurrentPage = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const clearFilters = () => {
    setFilters(defaultFilters)
    setCurrentPage(1)
  }

  const refreshProducts = () => {
    fetchProducts()
  }

  return (
    <ProductsContext.Provider
      value={{
        products,
        pagination,
        loading,
        filters,
        sortBy,
        currentPage,
        setFilters: handleSetFilters,
        setSortBy: handleSetSortBy,
        setCurrentPage: handleSetCurrentPage,
        clearFilters,
        refreshProducts,
      }}
    >
      {children}
    </ProductsContext.Provider>
  )
}

export function useProducts() {
  const context = useContext(ProductsContext)
  if (context === undefined) {
    throw new Error("useProducts must be used within a ProductsProvider")
  }
  return context
}