"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useCart } from "@/contexts/cart-context"
import { ShoppingCart, Plus, Minus, Trash2, ShoppingBag } from "lucide-react"

interface CartDrawerProps {
  children: React.ReactNode
}

export function CartDrawer({ children }: CartDrawerProps) {
  const { items, total, updateQuantity, removeItem, itemCount } = useCart()
  const [isOpen, setIsOpen] = useState(false)

  if (items.length === 0) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>{children}</SheetTrigger>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Shopping Cart
            </SheetTitle>
          </SheetHeader>
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Your cart is empty</h3>
            <p className="text-muted-foreground mb-6">
              Add some items to get started
            </p>
            <Button asChild onClick={() => setIsOpen(false)}>
              <Link href="/products">Browse Products</Link>
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Shopping Cart ({itemCount} items)
          </SheetTitle>
        </SheetHeader>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto py-4">
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.product.id} className="flex gap-3">
                <div className="flex-shrink-0">
                  <Image
                    src={item.product.images[0] || "/placeholder.svg"}
                    alt={item.product.title}
                    width={80}
                    height={80}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-sm line-clamp-2">
                        {item.product.title}
                      </h4>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {item.product.category}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.product.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    {/* Quantity Controls */}
                    <div className="flex items-center border rounded">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="h-7 w-7"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="px-2 text-sm min-w-[2rem] text-center">
                        {item.quantity}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="h-7 w-7"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Price */}
                    <div className="text-right">
                      <div className="font-semibold text-sm">
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ${item.product.price} each
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cart Footer */}
        <div className="border-t pt-4 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span className="text-green-600">Free</span>
            </div>
            <div className="flex justify-between">
              <span>Tax</span>
              <span>${(total * 0.08).toFixed(2)}</span>
            </div>
          </div>

          <Separator />

          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>${(total * 1.08).toFixed(2)}</span>
          </div>

          <div className="space-y-2">
            <Button className="w-full" asChild onClick={() => setIsOpen(false)}>
              <Link href="/checkout">Checkout</Link>
            </Button>
            <Button variant="outline" className="w-full" asChild onClick={() => setIsOpen(false)}>
              <Link href="/cart">View Cart</Link>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}