"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import type { Product } from "@/lib/types"
import { useErrorHandler } from "@/lib/error-handler"

interface FavoritesContextType {
  favorites: Product[]
  loading: boolean
  addToFavorites: (product: Product) => Promise<void>
  removeFromFavorites: (productId: string) => Promise<void>
  isFavorite: (productId: string) => boolean
  toggleFavorite: (product: Product) => Promise<void>
  clearFavorites: () => Promise<void>
  favoriteCount: number
  refreshFavorites: () => Promise<void>
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined)

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const { data: session } = useSession()
  const { handleError, showSuccess, handleAuthError } = useErrorHandler()

  // Load favorites from API when user is authenticated
  const refreshFavorites = async () => {
    if (!session?.user?.id) return

    setLoading(true)
    try {
      const response = await fetch('/api/favorites')
      const data = await response.json()

      if (data.success) {
        // Transform API response to match Product interface
        const favoriteProducts: Product[] = data.data.map((item: any) => item.product)
        setFavorites(favoriteProducts)
      }
    } catch (error) {
      handleError(error, {
        title: "Failed to load favorites",
        description: "Unable to load your favorite items"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session?.user?.id) {
      refreshFavorites()
    } else {
      // Clear favorites when user logs out
      setFavorites([])
    }
  }, [session?.user?.id])

  const addToFavorites = async (product: Product) => {
    if (!session?.user?.id) {
      handleAuthError(null, {
        title: "Please log in",
        description: "You need to be logged in to add items to favorites."
      })
      return
    }

    if (isFavorite(product.id)) return

    try {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, action: 'add' })
      })

      const data = await response.json()

      if (data.success) {
        setFavorites((prev) => [...prev, product])
        showSuccess("Added to favorites", `${product.title} has been added to your favorites.`)
      } else {
        throw new Error(data.message || 'Failed to add to favorites')
      }
    } catch (error) {
      handleError(error, {
        title: "Failed to add to favorites",
        description: "Unable to add item to favorites. Please try again."
      })
    }
  }

  const removeFromFavorites = async (productId: string) => {
    if (!session?.user?.id) return

    const product = favorites.find((p) => p.id === productId)
    
    try {
      const response = await fetch(`/api/favorites?productId=${productId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        setFavorites((prev) => prev.filter((p) => p.id !== productId))
        if (product) {
          showSuccess("Removed from favorites", `${product.title} has been removed from your favorites.`)
        }
      } else {
        throw new Error(data.message || 'Failed to remove from favorites')
      }
    } catch (error) {
      handleError(error, {
        title: "Failed to remove from favorites",
        description: "Unable to remove item from favorites. Please try again."
      })
    }
  }

  const isFavorite = (productId: string) => {
    return favorites.some((product) => product.id === productId)
  }

  const toggleFavorite = async (product: Product) => {
    if (!session?.user?.id) {
      handleAuthError(null, {
        title: "Please log in",
        description: "You need to be logged in to manage favorites."
      })
      return
    }

    try {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, action: 'toggle' })
      })

      const data = await response.json()

      if (data.success) {
        if (data.data.action === 'added') {
          setFavorites((prev) => [...prev, product])
          showSuccess("Added to favorites", `${product.title} has been added to your favorites.`)
        } else {
          setFavorites((prev) => prev.filter((p) => p.id !== product.id))
          showSuccess("Removed from favorites", `${product.title} has been removed from your favorites.`)
        }
      } else {
        throw new Error(data.message || 'Failed to toggle favorite')
      }
    } catch (error) {
      handleError(error, {
        title: "Failed to update favorites",
        description: "Unable to update favorites. Please try again."
      })
    }
  }

  const clearFavorites = async () => {
    if (!session?.user?.id) return

    try {
      const response = await fetch('/api/favorites', {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        setFavorites([])
        showSuccess("Favorites cleared", "All items have been removed from your favorites.")
      } else {
        throw new Error(data.message || 'Failed to clear favorites')
      }
    } catch (error) {
      handleError(error, {
        title: "Failed to clear favorites",
        description: "Unable to clear favorites. Please try again."
      })
    }
  }

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        loading,
        addToFavorites,
        removeFromFavorites,
        isFavorite,
        toggleFavorite,
        clearFavorites,
        favoriteCount: favorites.length,
        refreshFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (context === undefined) {
    throw new Error("useFavorites must be used within a FavoritesProvider")
  }
  return context
}