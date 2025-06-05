"use client"

import { useState, useEffect } from "react"
import { ProductCard } from "./product-card"

interface RelatedProductsProps {
  currentProduct: any
}

export function RelatedProducts({ currentProduct }: RelatedProductsProps) {
  const [relatedProducts, setRelatedProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      try {
        const response = await fetch(`/api/products/${currentProduct.id}/related`)
        const data = await response.json()
        
        if (data.success) {
          setRelatedProducts(data.data)
        }
      } catch (error) {
        console.error('Failed to fetch related products:', error)
      } finally {
        setLoading(false)
      }
    }

    if (currentProduct?.id) {
      fetchRelatedProducts()
    }
  }, [currentProduct?.id])

  if (loading) {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-6">Related Products</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
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

  if (relatedProducts.length === 0) {
    return null
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Related Products</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {relatedProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}
