export interface Product {
  id: string
  title: string
  subtitle?: string
  description: string
  price: number
  originalPrice?: number
  category: string
  images: string[]
  availability: "in-stock" | "out-of-stock" | "limited"
  rating: number
  reviewCount: number
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface User {
  id: string
  name: string
  email: string
  role: "admin" | "customer"
  status: "active" | "inactive" | "suspended"
  createdAt: string
  avatar?: string
}

export interface Order {
  id: string
  customerId: string
  customerName: string
  customerEmail: string
  items: OrderItem[]
  total: number
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled"
  createdAt: string
  shippingAddress: Address
}

export interface OrderItem {
  productId: string
  productTitle: string
  quantity: number
  price: number
  image: string
}

export interface Address {
  street: string
  city: string
  state: string
  zipCode: string
  country: string
}

export interface Review {
  id: string
  productId: string
  userId: string
  userName: string
  rating: number
  comment: string
  createdAt: string
}

export interface CartItem {
  product: Product
  quantity: number
}

export interface FilterOptions {
  categories: string[]
  priceRange: [number, number]
  availability: string[]
  rating: number
}
