"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Package, Truck, CheckCircle, Clock, X, Loader2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { toast } from "sonner"

interface OrderItem {
  id: string
  productId: string
  productTitle: string
  quantity: number
  price: number
  image: string
}

interface Order {
  id: string
  total: number
  status: "PENDING" | "SHIPPED" | "DELIVERED" | "CANCELLED"
  createdAt: string
  customerName: string
  customerEmail: string
  items: OrderItem[]
  shippingAddress: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
}

interface OrdersData {
  orders: Order[]
  pagination: {
    total: number
    pages: number
    currentPage: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export default function OrdersPage() {
  const { isAuthenticated, user } = useAuth()
  const [ordersData, setOrdersData] = useState<OrdersData | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10"
      })

      if (statusFilter !== "all") {
        params.append("status", statusFilter)
      }

      const response = await fetch(`/api/orders?${params}`)
      
      if (!response.ok) {
        throw new Error("Failed to fetch orders")
      }

      const data = await response.json()
      setOrdersData(data)
    } catch (error) {
      console.error("Error fetching orders:", error)
      toast.error("Failed to load orders")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders()
    }
  }, [isAuthenticated, statusFilter, currentPage])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Clock className="h-4 w-4" />
      case "SHIPPED":
        return <Truck className="h-4 w-4" />
      case "DELIVERED":
        return <CheckCircle className="h-4 w-4" />
      case "CANCELLED":
        return <X className="h-4 w-4" />
      default:
        return <Package className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800"
      case "SHIPPED":
        return "bg-blue-100 text-blue-800"
      case "DELIVERED":
        return "bg-green-100 text-green-800"
      case "CANCELLED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold mb-2">Sign in required</h1>
          <p className="text-muted-foreground mb-6">
            Please sign in to view your orders.
          </p>
          <Button asChild>
            <Link href="/auth/login">
              Sign In
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Orders</h1>
        <p className="text-muted-foreground">Track and manage your orders</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="SHIPPED">Shipped</SelectItem>
            <SelectItem value="DELIVERED">Delivered</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : !ordersData || ordersData.orders.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No orders found</h3>
            <p className="text-muted-foreground mb-6">
              {statusFilter === "all" 
                ? "You haven't placed any orders yet." 
                : `No ${statusFilter.toLowerCase()} orders found.`}
            </p>
            <Button asChild>
              <Link href="/products">
                Start Shopping
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Orders List */}
          <div className="space-y-6">
            {ordersData.orders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg">
                        Order #{order.id.slice(-8).toUpperCase()}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Placed on {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge className={getStatusColor(order.status)}>
                        {getStatusIcon(order.status)}
                        <span className="ml-1">{order.status}</span>
                      </Badge>
                      <div className="text-right">
                        <p className="font-semibold">${order.total.toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Order Items */}
                  <div className="space-y-3 mb-4">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex gap-3">
                        <Image
                          src={item.image || "/placeholder.svg"}
                          alt={item.productTitle}
                          width={60}
                          height={60}
                          className="w-15 h-15 object-cover rounded-lg"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm line-clamp-2">{item.productTitle}</p>
                          <p className="text-sm text-muted-foreground">
                            Quantity: {item.quantity} × ${item.price.toFixed(2)}
                          </p>
                        </div>
                        <div className="text-sm font-medium">
                          ${(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator className="my-4" />

                  {/* Shipping Address */}
                  <div className="text-sm">
                    <p className="font-medium mb-1">Shipping Address:</p>
                    <p className="text-muted-foreground">
                      {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}, {order.shippingAddress.country}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {ordersData.pagination.pages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={!ordersData.pagination.hasPrev}
              >
                Previous
              </Button>
              <span className="flex items-center px-4 text-sm text-muted-foreground">
                Page {currentPage} of {ordersData.pagination.pages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={!ordersData.pagination.hasNext}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}