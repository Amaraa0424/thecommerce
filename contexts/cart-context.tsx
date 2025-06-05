"use client"

import React, { createContext, useContext, useReducer, useEffect } from "react"
import { useSession } from "next-auth/react"
import type { Product, CartItem } from "@/lib/types"
import { useErrorHandler } from "@/lib/error-handler"

interface CartState {
  items: CartItem[]
  total: number
  itemCount: number
  loading: boolean
}

type CartAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "LOAD_CART"; payload: { items: CartItem[]; total: number; itemCount: number } }
  | { type: "ADD_ITEM"; payload: CartItem }
  | { type: "UPDATE_ITEM"; payload: CartItem }
  | { type: "REMOVE_ITEM"; payload: { productId: string } }
  | { type: "CLEAR_CART" }

interface CartContextType extends CartState {
  addItem: (product: Product, quantity?: number) => Promise<void>
  removeItem: (productId: string) => Promise<void>
  updateQuantity: (productId: string, quantity: number) => Promise<void>
  clearCart: () => Promise<void>
  isInCart: (productId: string) => boolean
  getItemQuantity: (productId: string) => number
  refreshCart: () => Promise<void>
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload }

    case "LOAD_CART":
      return {
        ...state,
        items: action.payload.items,
        total: action.payload.total,
        itemCount: action.payload.itemCount,
        loading: false
      }

    case "ADD_ITEM": {
      const existingItemIndex = state.items.findIndex(
        (item) => item.product.id === action.payload.product.id
      )

      let newItems: CartItem[]
      if (existingItemIndex >= 0) {
        newItems = [...state.items]
        newItems[existingItemIndex] = action.payload
      } else {
        newItems = [...state.items, action.payload]
      }

      const total = newItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
      const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0)

      return { ...state, items: newItems, total, itemCount }
    }

    case "UPDATE_ITEM": {
      const newItems = state.items.map((item) =>
        item.product.id === action.payload.product.id ? action.payload : item
      )
      const total = newItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
      const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0)

      return { ...state, items: newItems, total, itemCount }
    }

    case "REMOVE_ITEM": {
      const newItems = state.items.filter((item) => item.product.id !== action.payload.productId)
      const total = newItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
      const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0)

      return { ...state, items: newItems, total, itemCount }
    }

    case "CLEAR_CART":
      return { ...state, items: [], total: 0, itemCount: 0 }

    default:
      return state
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    total: 0,
    itemCount: 0,
    loading: false,
  })
  const { data: session } = useSession()
  const { handleError, showSuccess, handleAuthError } = useErrorHandler()

  // Load cart from API when user is authenticated
  const refreshCart = async () => {
    if (!session?.user?.id) return

    dispatch({ type: "SET_LOADING", payload: true })
    try {
      const response = await fetch('/api/cart')
      const data = await response.json()

      if (data.success) {
        // Transform API response to match CartItem interface
        const items: CartItem[] = data.data.items.map((item: any) => ({
          product: item.product,
          quantity: item.quantity
        }))

        dispatch({
          type: "LOAD_CART",
          payload: {
            items,
            total: data.data.total,
            itemCount: data.data.itemCount
          }
        })
      }
    } catch (error) {
      handleError(error, {
        title: "Failed to load cart",
        description: "Unable to load your cart items"
      })
      dispatch({ type: "SET_LOADING", payload: false })
    }
  }

  useEffect(() => {
    if (session?.user?.id) {
      refreshCart()
    } else {
      // Clear cart when user logs out
      dispatch({ type: "CLEAR_CART" })
    }
  }, [session?.user?.id])

  const addItem = async (product: Product, quantity = 1) => {
    if (!session?.user?.id) {
      handleAuthError(null, {
        title: "Please log in",
        description: "You need to be logged in to add items to cart."
      })
      return
    }

    if (product.availability === "out-of-stock") {
      handleError(null, {
        title: "Product unavailable",
        description: "This product is currently out of stock."
      })
      return
    }

    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, quantity })
      })

      const data = await response.json()

      if (data.success) {
        const cartItem: CartItem = {
          product: data.data.product,
          quantity: data.data.quantity
        }
        dispatch({ type: "ADD_ITEM", payload: cartItem })
        showSuccess("Added to cart", `${product.title} has been added to your cart.`)
      } else {
        throw new Error(data.message || 'Failed to add item to cart')
      }
    } catch (error) {
      handleError(error, {
        title: "Failed to add to cart",
        description: "Unable to add item to cart. Please try again."
      })
    }
  }

  const removeItem = async (productId: string) => {
    if (!session?.user?.id) return

    const item = state.items.find((item) => item.product.id === productId)
    
    try {
      const response = await fetch(`/api/cart?productId=${productId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        dispatch({ type: "REMOVE_ITEM", payload: { productId } })
        if (item) {
          showSuccess("Removed from cart", `${item.product.title} has been removed from your cart.`)
        }
      } else {
        throw new Error(data.message || 'Failed to remove item from cart')
      }
    } catch (error) {
      handleError(error, {
        title: "Failed to remove from cart",
        description: "Unable to remove item from cart. Please try again."
      })
    }
  }

  const updateQuantity = async (productId: string, quantity: number) => {
    if (!session?.user?.id) return

    if (quantity <= 0) {
      await removeItem(productId)
      return
    }

    try {
      const response = await fetch('/api/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity })
      })

      const data = await response.json()

      if (data.success) {
        const cartItem: CartItem = {
          product: data.data.product,
          quantity: data.data.quantity
        }
        dispatch({ type: "UPDATE_ITEM", payload: cartItem })
      } else {
        throw new Error(data.message || 'Failed to update cart item')
      }
    } catch (error) {
      handleError(error, {
        title: "Failed to update cart",
        description: "Unable to update cart item. Please try again."
      })
    }
  }

  const clearCart = async () => {
    if (!session?.user?.id) return

    try {
      const response = await fetch('/api/cart', {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        dispatch({ type: "CLEAR_CART" })
        showSuccess("Cart cleared", "All items have been removed from your cart.")
      } else {
        throw new Error(data.message || 'Failed to clear cart')
      }
    } catch (error) {
      handleError(error, {
        title: "Failed to clear cart",
        description: "Unable to clear cart. Please try again."
      })
    }
  }

  const isInCart = (productId: string) => {
    return state.items.some((item) => item.product.id === productId)
  }

  const getItemQuantity = (productId: string) => {
    const item = state.items.find((item) => item.product.id === productId)
    return item ? item.quantity : 0
  }

  return (
    <CartContext.Provider
      value={{
        ...state,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isInCart,
        getItemQuantity,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}