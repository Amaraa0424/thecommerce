"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Package, Truck, Mail, Loader2 } from "lucide-react"

interface OrderInfo {
  id: string
  total: number
  status: string
  createdAt: string
}

function CheckoutSuccessContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get("orderId")
  const [orderInfo, setOrderInfo] = useState<OrderInfo | null>(null)
  const [loading, setLoading] = useState(true)
  
  const estimatedDelivery = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()

  useEffect(() => {
    // If we have an order ID, we could fetch order details here
    // For now, we'll just use the order ID as the order number
    if (orderId) {
      setOrderInfo({
        id: orderId,
        total: 0, // We could fetch this from the API
        status: "PENDING",
        createdAt: new Date().toISOString()
      })
    }
    setLoading(false)
  }, [orderId])

  const orderNumber = orderId ? `ORD-${orderId.slice(-8).toUpperCase()}` : `ORD-${Date.now().toString().slice(-8)}`

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto text-center">
        {/* Success Icon */}
        <div className="mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-green-600 mb-2">Order Confirmed!</h1>
          <p className="text-muted-foreground">
            Thank you for your purchase. Your order has been successfully placed.
          </p>
        </div>

        {/* Order Details */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div>
                <p className="font-medium">Order Number</p>
                <p className="text-muted-foreground">{orderNumber}</p>
              </div>
              <div>
                <p className="font-medium">Estimated Delivery</p>
                <p className="text-muted-foreground">{estimatedDelivery}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* What's Next */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>What's Next?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="space-y-2">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <Mail className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-medium">Confirmation Email</h3>
                <p className="text-sm text-muted-foreground">
                  You'll receive an order confirmation email shortly
                </p>
              </div>
              <div className="space-y-2">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                  <Package className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="font-medium">Order Processing</h3>
                <p className="text-sm text-muted-foreground">
                  We'll prepare your items for shipment
                </p>
              </div>
              <div className="space-y-2">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <Truck className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-medium">Shipping Updates</h3>
                <p className="text-sm text-muted-foreground">
                  Track your package with shipping notifications
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild>
            <Link href="/products">Continue Shopping</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Back to Home</Link>
          </Button>
        </div>

        {/* Support */}
        <div className="mt-12 p-6 bg-muted/50 rounded-lg">
          <h3 className="font-medium mb-2">Need Help?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            If you have any questions about your order, our customer support team is here to help.
          </p>
          <Button variant="outline" size="sm">
            Contact Support
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-12 h-12 text-gray-400 animate-spin" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Loading...</h1>
          <p className="text-muted-foreground">Please wait while we load your order details.</p>
        </div>
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  )
}