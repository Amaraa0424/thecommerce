export interface Product {
  id: string
  title: string
  subtitle?: string
  description: string
  price: number
  originalPrice?: number | null
  category: string
  images: string[]
  availability: string
  rating: number
  reviewCount: number
  tags: string[]
  createdAt: string | Date
  updatedAt: string | Date
}

export interface User {
  id: string
  name: string
  email: string
  role: "admin" | "customer"
  status: "active" | "inactive" | "suspended"
  createdAt: string
  avatar?: string
  emailVerified?: string
}

export interface AuthUser {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
  role?: string
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
