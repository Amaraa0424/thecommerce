"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useFavorites } from "@/contexts/favorites-context"
import { ProductCard } from "@/components/product/product-card"
import { Heart, ArrowLeft } from "lucide-react"

export default function FavoritesPage() {
  const { favorites, clearFavorites } = useFavorites()

  if (favorites.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Your favorites is empty</h1>
          <p className="text-muted-foreground mb-6">
            Save items you love by clicking the heart icon on any product.
          </p>
          <Button asChild>
            <Link href="/products">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Browse Products
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/products">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">My Favorites</h1>
            <p className="text-muted-foreground">
              {favorites.length} {favorites.length === 1 ? "item" : "items"} saved
            </p>
          </div>
        </div>

        {favorites.length > 0 && (
          <Button variant="outline" onClick={clearFavorites}>
            Clear All
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {favorites.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}