"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Search, Edit, Trash2, Loader2, Eye, Package, User, MapPin } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface OrderItem {
  id: string
  productId: string
  productTitle: string
  quantity: number
  price: number
  image: string
  product?: {
    id: string
    title: string
    price: number
  }
}

interface ShippingAddress {
  id: string
  street: string
  city: string
  state: string
  zipCode: string
  country: string
}

interface Order {
  id: string
  total: number
  status: "PENDING" | "SHIPPED" | "DELIVERED" | "CANCELLED"
  createdAt: Date
  customerId: string
  customerName: string
  customerEmail: string
  customer?: {
    id: string
    name: string
    email: string
  }
  items: OrderItem[]
  shippingAddress: ShippingAddress
}

interface User {
  id: string
  name: string
  email: string
}

interface Product {
  id: string
  title: string
  price: number
  images: string[]
}

interface OrdersManagementProps {
  onOrderUpdate?: () => void
}

export function OrdersManagement({ onOrderUpdate }: OrdersManagementProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null)
  const [formData, setFormData] = useState({
    customerId: "",
    customerName: "",
    customerEmail: "",
    status: "PENDING" as "PENDING" | "SHIPPED" | "DELIVERED" | "CANCELLED",
    items: [{ productId: "", productTitle: "", quantity: 1, price: 0, image: "" }],
    shippingAddress: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: ""
    }
  })
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && statusFilter !== "all" && { status: statusFilter })
      })

      const response = await fetch(`/api/admin/orders?${params}`)
      const data = await response.json()

      if (data.success) {
        setOrders(data.data.orders)
        setTotalPages(data.data.pagination.pages)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch orders",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch orders",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users?limit=100")
      const data = await response.json()
      if (data.success) {
        setUsers(data.data.users)
      }
    } catch (error) {
      console.error("Failed to fetch users:", error)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products?limit=100")
      const data = await response.json()
      if (data.success) {
        setProducts(data.data.products)
      }
    } catch (error) {
      console.error("Failed to fetch products:", error)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [currentPage, searchTerm, statusFilter])

  useEffect(() => {
    fetchUsers()
    fetchProducts()
  }, [])

  const handleCreateOrder = async () => {
    setSubmitting(true)
    try {
      const response = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Order created successfully"
        })
        setIsCreateDialogOpen(false)
        resetForm()
        fetchOrders()
        onOrderUpdate?.()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to create order",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create order",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditOrder = async () => {
    if (!editingOrder) return
    
    setSubmitting(true)
    try {
      const response = await fetch(`/api/admin/orders/${editingOrder.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: formData.status })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Order updated successfully"
        })
        setIsEditDialogOpen(false)
        setEditingOrder(null)
        fetchOrders()
        onOrderUpdate?.()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update order",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update order",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteOrder = async (orderId: string) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "DELETE"
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Order deleted successfully"
        })
        fetchOrders()
        onOrderUpdate?.()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to delete order",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete order",
        variant: "destructive"
      })
    }
  }

  const openEditDialog = (order: Order) => {
    setEditingOrder(order)
    setFormData({
      ...formData,
      status: order.status
    })
    setIsEditDialogOpen(true)
  }

  const openViewDialog = (order: Order) => {
    setViewingOrder(order)
    setIsViewDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      customerId: "",
      customerName: "",
      customerEmail: "",
      status: "PENDING",
      items: [{ productId: "", productTitle: "", quantity: 1, price: 0, image: "" }],
      shippingAddress: {
        street: "",
        city: "",
        state: "",
        zipCode: "",
        country: ""
      }
    })
  }

  const addOrderItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productId: "", productTitle: "", quantity: 1, price: 0, image: "" }]
    })
  }

  const removeOrderItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index)
    setFormData({ ...formData, items: newItems })
  }

  const updateOrderItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.items]
    newItems[index] = { ...newItems[index], [field]: value }
    
    // Auto-fill product details when product is selected
    if (field === "productId" && value) {
      const product = products.find(p => p.id === value)
      if (product) {
        newItems[index].productTitle = product.title
        newItems[index].price = product.price
        newItems[index].image = product.images[0] || ""
      }
    }
    
    setFormData({ ...formData, items: newItems })
  }

  const updateCustomer = (userId: string) => {
    const user = users.find(u => u.id === userId)
    if (user) {
      setFormData({
        ...formData,
        customerId: user.id,
        customerName: user.name || "",
        customerEmail: user.email
      })
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "PENDING": return "secondary"
      case "SHIPPED": return "default"
      case "DELIVERED": return "default"
      case "CANCELLED": return "destructive"
      default: return "secondary"
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Order Management</CardTitle>
          <CardDescription>Loading orders...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Order Management</CardTitle>
            <CardDescription>Manage customer orders and fulfillment</CardDescription>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Order
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Order</DialogTitle>
                <DialogDescription>Add a new order to the system</DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                {/* Customer Selection */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Customer Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="customer">Select Customer</Label>
                      <Select onValueChange={updateCustomer}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a customer" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name || user.email} ({user.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="status">Order Status</Label>
                      <Select value={formData.status} onValueChange={(value: "PENDING" | "SHIPPED" | "DELIVERED" | "CANCELLED") => setFormData({ ...formData, status: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PENDING">Pending</SelectItem>
                          <SelectItem value="SHIPPED">Shipped</SelectItem>
                          <SelectItem value="DELIVERED">Delivered</SelectItem>
                          <SelectItem value="CANCELLED">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Order Items</h3>
                    <Button type="button" variant="outline" size="sm" onClick={addOrderItem}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  </div>
                  {formData.items.map((item, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Item {index + 1}</h4>
                        {formData.items.length > 1 && (
                          <Button type="button" variant="outline" size="sm" onClick={() => removeOrderItem(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>Product</Label>
                          <Select value={item.productId} onValueChange={(value) => updateOrderItem(index, "productId", value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a product" />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map((product) => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.title} (${product.price})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Quantity</Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateOrderItem(index, "quantity", parseInt(e.target.value) || 1)}
                          />
                        </div>
                        <div>
                          <Label>Price</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.price}
                            onChange={(e) => updateOrderItem(index, "price", parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Shipping Address */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Shipping Address</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="street">Street Address</Label>
                      <Input
                        id="street"
                        value={formData.shippingAddress.street}
                        onChange={(e) => setFormData({
                          ...formData,
                          shippingAddress: { ...formData.shippingAddress, street: e.target.value }
                        })}
                        placeholder="Enter street address"
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={formData.shippingAddress.city}
                        onChange={(e) => setFormData({
                          ...formData,
                          shippingAddress: { ...formData.shippingAddress, city: e.target.value }
                        })}
                        placeholder="Enter city"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={formData.shippingAddress.state}
                        onChange={(e) => setFormData({
                          ...formData,
                          shippingAddress: { ...formData.shippingAddress, state: e.target.value }
                        })}
                        placeholder="Enter state"
                      />
                    </div>
                    <div>
                      <Label htmlFor="zipCode">ZIP Code</Label>
                      <Input
                        id="zipCode"
                        value={formData.shippingAddress.zipCode}
                        onChange={(e) => setFormData({
                          ...formData,
                          shippingAddress: { ...formData.shippingAddress, zipCode: e.target.value }
                        })}
                        placeholder="Enter ZIP code"
                      />
                    </div>
                    <div>
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={formData.shippingAddress.country}
                        onChange={(e) => setFormData({
                          ...formData,
                          shippingAddress: { ...formData.shippingAddress, country: e.target.value }
                        })}
                        placeholder="Enter country"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateOrder} disabled={submitting}>
                    {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Create Order
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="SHIPPED">Shipped</SelectItem>
              <SelectItem value="DELIVERED">Delivered</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Orders Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-sm">{order.id.slice(-8)}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{order.customerName}</div>
                      <div className="text-sm text-muted-foreground">{order.customerEmail}</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">${order.total.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(order.status)}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{order.items.length} item(s)</TableCell>
                  <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openViewDialog(order)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(order)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Order</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this order? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteOrder(order.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Order Status</DialogTitle>
              <DialogDescription>Update the order status</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select value={formData.status} onValueChange={(value: "PENDING" | "SHIPPED" | "DELIVERED" | "CANCELLED") => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="SHIPPED">Shipped</SelectItem>
                    <SelectItem value="DELIVERED">Delivered</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleEditOrder} disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Update Order
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Order Details</DialogTitle>
              <DialogDescription>
                Order #{viewingOrder?.id.slice(-8)} - {viewingOrder?.status}
              </DialogDescription>
            </DialogHeader>
            {viewingOrder && (
              <div className="space-y-6">
                {/* Customer Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        Customer Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <span className="font-medium">Name:</span> {viewingOrder.customerName}
                      </div>
                      <div>
                        <span className="font-medium">Email:</span> {viewingOrder.customerEmail}
                      </div>
                      <div>
                        <span className="font-medium">Order Date:</span> {new Date(viewingOrder.createdAt).toLocaleDateString()}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        Shipping Address
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      <div>{viewingOrder.shippingAddress.street}</div>
                      <div>
                        {viewingOrder.shippingAddress.city}, {viewingOrder.shippingAddress.state} {viewingOrder.shippingAddress.zipCode}
                      </div>
                      <div>{viewingOrder.shippingAddress.country}</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Order Items */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center">
                      <Package className="h-4 w-4 mr-2" />
                      Order Items
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {viewingOrder.items.map((item) => (
                        <div key={item.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                          <img
                            src={item.image || "/placeholder.jpg"}
                            alt={item.productTitle}
                            className="w-16 h-16 object-cover rounded"
                          />
                          <div className="flex-1">
                            <h4 className="font-medium">{item.productTitle}</h4>
                            <p className="text-sm text-muted-foreground">
                              Quantity: {item.quantity} × ${item.price.toFixed(2)}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">${(item.quantity * item.price).toFixed(2)}</div>
                          </div>
                        </div>
                      ))}
                      <div className="border-t pt-4">
                        <div className="flex justify-between items-center text-lg font-semibold">
                          <span>Total:</span>
                          <span>${viewingOrder.total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}