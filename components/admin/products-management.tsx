"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Edit, Trash2, Package, DollarSign, Star, Eye, Upload, Link } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Product {
  id: string
  title: string
  subtitle: string
  description: string
  price: number
  category: string
  images: string[]
  stock?: number
  rating: number
  availability: string
  reviewCount: number
  createdAt: string
  updatedAt: string
}

interface Category {
  id: string
  name: string
}

interface FormErrors {
  title?: string
  subtitle?: string
  description?: string
  price?: string
  category?: string
  stock?: string
  imageUrl?: string
}

export function ProductsManagement() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [imageTab, setImageTab] = useState("url")
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    description: "",
    price: "",
    category: "",
    imageUrl: "",
    stock: "",
    availability: "in-stock"
  })
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products?limit=100')
      const data = await response.json()
      if (data.success) {
        setProducts(data.data.products)
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      const data = await response.json()
      if (data.success) {
        setCategories(data.data.filter((cat: Category) => cat.id !== 'all'))
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const validateForm = (): boolean => {
    const errors: FormErrors = {}

    // Title validation
    if (!formData.title.trim()) {
      errors.title = "Title is required"
    } else if (formData.title.length < 3) {
      errors.title = "Title must be at least 3 characters"
    } else if (formData.title.length > 100) {
      errors.title = "Title must be less than 100 characters"
    }

    // Subtitle validation
    if (formData.subtitle && formData.subtitle.length > 150) {
      errors.subtitle = "Subtitle must be less than 150 characters"
    }

    // Description validation
    if (!formData.description.trim()) {
      errors.description = "Description is required"
    } else if (formData.description.length < 10) {
      errors.description = "Description must be at least 10 characters"
    } else if (formData.description.length > 1000) {
      errors.description = "Description must be less than 1000 characters"
    }

    // Price validation
    if (!formData.price) {
      errors.price = "Price is required"
    } else {
      const price = parseFloat(formData.price)
      if (isNaN(price) || price <= 0) {
        errors.price = "Price must be a positive number"
      } else if (price > 999999) {
        errors.price = "Price must be less than $999,999"
      }
    }

    // Category validation
    if (!formData.category) {
      errors.category = "Category is required"
    }

    // Stock validation
    if (!formData.stock) {
      errors.stock = "Stock is required"
    } else {
      const stock = parseInt(formData.stock)
      if (isNaN(stock) || stock < 0) {
        errors.stock = "Stock must be a non-negative number"
      } else if (stock > 999999) {
        errors.stock = "Stock must be less than 999,999"
      }
    }

    // Image URL validation
    if (formData.imageUrl && !isValidUrl(formData.imageUrl) && !formData.imageUrl.startsWith('data:image/')) {
      errors.imageUrl = "Please enter a valid URL or upload an image"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const isValidUrl = (string: string): boolean => {
    try {
      new URL(string)
      return true
    } catch (_) {
      return false
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Please select a valid image file",
          variant: "destructive",
        })
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "Image size must be less than 5MB",
          variant: "destructive",
        })
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const base64String = e.target?.result as string
        setFormData({ ...formData, imageUrl: base64String })
        setFormErrors({ ...formErrors, imageUrl: undefined })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    const productData = {
      ...formData,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock),
      subtitle: formData.subtitle.trim() || ""
    }

    try {
      const url = editingProduct ? `/api/admin/products/${editingProduct.id}` : '/api/admin/products'
      const method = editingProduct ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: `Product ${editingProduct ? 'updated' : 'created'} successfully`,
        })
        fetchProducts()
        resetForm()
        setIsDialogOpen(false)
      } else {
        throw new Error(data.message)
      }
    } catch (error) {
      console.error('Failed to save product:', error)
      toast({
        title: "Error",
        description: `Failed to ${editingProduct ? 'update' : 'create'} product`,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      title: product.title,
      subtitle: product.subtitle || "",
      description: product.description,
      price: product.price.toString(),
      category: product.category,
      imageUrl: product.images?.[0] || "", // Use first image from array
      stock: product.stock?.toString() || "0",
      availability: product.availability
    })
    setFormErrors({})
    setIsDialogOpen(true)
  }

  const handleDelete = async (productId: string) => {
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Product deleted successfully",
        })
        fetchProducts()
      } else {
        throw new Error(data.message)
      }
    } catch (error) {
      console.error('Failed to delete product:', error)
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      title: "",
      subtitle: "",
      description: "",
      price: "",
      category: "",
      imageUrl: "",
      stock: "",
      availability: "in-stock"
    })
    setFormErrors({})
    setEditingProduct(null)
    setImageTab("url")
  }

  const getAvailabilityBadge = (availability: string) => {
    const variants = {
      'in-stock': 'default',
      'limited': 'secondary',
      'out-of-stock': 'destructive'
    } as const

    const labels = {
      'in-stock': 'In Stock',
      'limited': 'Limited',
      'out-of-stock': 'Out of Stock'
    }

    return (
      <Badge variant={variants[availability as keyof typeof variants] || 'default'}>
        {labels[availability as keyof typeof labels] || availability}
      </Badge>
    )
  }

  if (loading) {
    return <div className="flex justify-center p-8">Loading products...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Products Management</h2>
          <p className="text-muted-foreground">Manage your product catalog</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
              <DialogDescription>
                {editingProduct ? 'Update product information' : 'Create a new product for your store'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Basic Information</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Product Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className={formErrors.title ? "border-red-500" : ""}
                      placeholder="Enter product title"
                    />
                    {formErrors.title && <p className="text-sm text-red-500">{formErrors.title}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="subtitle">Subtitle</Label>
                    <Input
                      id="subtitle"
                      value={formData.subtitle}
                      onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                      className={formErrors.subtitle ? "border-red-500" : ""}
                      placeholder="Enter product subtitle (optional)"
                    />
                    {formErrors.subtitle && <p className="text-sm text-red-500">{formErrors.subtitle}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className={formErrors.description ? "border-red-500" : ""}
                      rows={4}
                      placeholder="Enter detailed product description"
                    />
                    {formErrors.description && <p className="text-sm text-red-500">{formErrors.description}</p>}
                  </div>
                </div>
              </div>

              {/* Product Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Product Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                      <SelectTrigger className={formErrors.category ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.name}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.category && <p className="text-sm text-red-500">{formErrors.category}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="availability">Availability</Label>
                    <Select value={formData.availability} onValueChange={(value) => setFormData({ ...formData, availability: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in-stock">In Stock</SelectItem>
                        <SelectItem value="limited">Limited Stock</SelectItem>
                        <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price ($) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className={formErrors.price ? "border-red-500" : ""}
                      placeholder="0.00"
                    />
                    {formErrors.price && <p className="text-sm text-red-500">{formErrors.price}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stock">Stock Quantity *</Label>
                    <Input
                      id="stock"
                      type="number"
                      min="0"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      className={formErrors.stock ? "border-red-500" : ""}
                      placeholder="0"
                    />
                    {formErrors.stock && <p className="text-sm text-red-500">{formErrors.stock}</p>}
                  </div>
                </div>
              </div>

              {/* Image Upload */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Product Image</h3>
                <Tabs value={imageTab} onValueChange={setImageTab}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="url" className="flex items-center gap-2">
                      <Link className="h-4 w-4" />
                      Image URL
                    </TabsTrigger>
                    <TabsTrigger value="upload" className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Upload File
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="url" className="space-y-2">
                    <Label htmlFor="imageUrl">Image URL</Label>
                    <Input
                      id="imageUrl"
                      type="url"
                      value={formData.imageUrl.startsWith('data:') ? '' : formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      className={formErrors.imageUrl ? "border-red-500" : ""}
                      placeholder="https://example.com/image.jpg"
                    />
                    {formErrors.imageUrl && <p className="text-sm text-red-500">{formErrors.imageUrl}</p>}
                  </TabsContent>
                  
                  <TabsContent value="upload" className="space-y-2">
                    <Label htmlFor="imageFile">Upload Image</Label>
                    <Input
                      id="imageFile"
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className={formErrors.imageUrl ? "border-red-500" : ""}
                    />
                    <p className="text-sm text-muted-foreground">
                      Supported formats: JPG, PNG, GIF. Max size: 5MB
                    </p>
                    {formErrors.imageUrl && <p className="text-sm text-red-500">{formErrors.imageUrl}</p>}
                  </TabsContent>
                </Tabs>

                {/* Image Preview */}
                {formData.imageUrl && (
                  <div className="space-y-2">
                    <Label>Preview</Label>
                    <div className="border rounded-lg p-4 bg-muted/50">
                      <img
                        src={formData.imageUrl}
                        alt="Product preview"
                        className="h-32 w-32 object-cover rounded-lg mx-auto"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.jpg"
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : editingProduct ? 'Update Product' : 'Create Product'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Stock</CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {products.filter(p => p.availability === 'in-stock').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <Package className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {products.filter(p => p.availability === 'out-of-stock').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Price</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${products.length > 0 ? (products.reduce((sum, p) => sum + p.price, 0) / products.length).toFixed(2) : '0.00'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
          <CardDescription>
            A list of all products in your store
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      {product.images?.[0] && (
                        <img
                          src={product.images[0]}
                          alt={product.title}
                          className="h-12 w-12 rounded object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.jpg"
                          }}
                        />
                      )}
                      <div>
                        <div className="font-medium">{product.title}</div>
                        {product.subtitle && (
                          <div className="text-sm text-muted-foreground">{product.subtitle}</div>
                        )}
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {product.description}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>${product.price.toFixed(2)}</TableCell>
                  <TableCell>{product.stock || 0}</TableCell>
                  <TableCell>{getAvailabilityBadge(product.availability)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>{product.rating.toFixed(1)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(product)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Product</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{product.title}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(product.id)}>
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
        </CardContent>
      </Card>
    </div>
  )
}