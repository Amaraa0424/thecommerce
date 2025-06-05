# Database CRUD Operations

This directory contains comprehensive CRUD operations for your e-commerce database. All operations are organized by entity and include proper error handling, type safety, and relationship management.

## Quick Start

```typescript
import { 
  productOperations, 
  userOperations, 
  orderOperations, 
  reviewOperations,
  categoryOperations,
  analyticsOperations 
} from '@/lib/db'
```

## Products

### Create Product
```typescript
const product = await productOperations.create({
  title: "New Product",
  subtitle: "Amazing product",
  description: "Product description",
  price: 99.99,
  originalPrice: 129.99,
  category: "Electronics",
  images: ["/image1.jpg", "/image2.jpg"],
  availability: "in-stock",
  rating: 0,
  reviewCount: 0,
  tags: ["new", "electronics"]
})
```

### Get Products with Filters
```typescript
const { products, pagination } = await productOperations.getAll({
  category: "Electronics",
  search: "wireless",
  minPrice: 50,
  maxPrice: 500,
  availability: "in-stock",
  sortBy: "price",
  sortOrder: "asc",
  page: 1,
  limit: 12
})
```

### Get Single Product
```typescript
const product = await productOperations.getById("product-id")
```

### Update Product
```typescript
const updatedProduct = await productOperations.update("product-id", {
  price: 89.99,
  availability: "limited"
})
```

### Delete Product
```typescript
await productOperations.delete("product-id")
```

### Utility Functions
```typescript
// Get categories
const categories = await productOperations.getCategories()

// Get price range
const { min, max } = await productOperations.getPriceRange()

// Get featured products
const featured = await productOperations.getFeatured(6)

// Get related products
const related = await productOperations.getRelated("product-id", 4)

// Search suggestions
const suggestions = await productOperations.getSearchSuggestions("query")
```

## Users

### Create User
```typescript
const user = await userOperations.create({
  name: "John Doe",
  email: "john@example.com",
  role: "CUSTOMER",
  status: "ACTIVE",
  avatar: "/avatar.jpg"
})
```

### Get Users with Filters
```typescript
const { users, pagination } = await userOperations.getAll({
  role: "CUSTOMER",
  status: "ACTIVE",
  search: "john",
  sortBy: "createdAt",
  sortOrder: "desc",
  page: 1,
  limit: 10
})
```

### Get User Profile
```typescript
const profile = await userOperations.getProfile("user-id")
```

### Update User
```typescript
const updatedUser = await userOperations.update("user-id", {
  name: "John Smith",
  avatar: "/new-avatar.jpg"
})
```

### User Utilities
```typescript
// Check if email exists
const exists = await userOperations.emailExists("email@example.com")

// Get user statistics
const stats = await userOperations.getStats()

// Update user status
await userOperations.updateStatus("user-id", "INACTIVE")

// Update user role
await userOperations.updateRole("user-id", "ADMIN")
```

## Orders

### Create Order
```typescript
const order = await orderOperations.create({
  customerId: "user-id",
  customerName: "John Doe",
  customerEmail: "john@example.com",
  items: [
    {
      productId: "product-id",
      productTitle: "Product Name",
      quantity: 2,
      price: 99.99,
      image: "/product.jpg"
    }
  ],
  total: 199.98,
  shippingAddress: {
    street: "123 Main St",
    city: "New York",
    state: "NY",
    zipCode: "10001",
    country: "USA"
  }
})
```

### Get Orders with Filters
```typescript
const { orders, pagination } = await orderOperations.getAll({
  customerId: "user-id",
  status: "PENDING",
  dateFrom: new Date("2024-01-01"),
  dateTo: new Date("2024-12-31"),
  search: "ORD-001",
  sortBy: "createdAt",
  sortOrder: "desc",
  page: 1,
  limit: 10
})
```

### Update Order Status
```typescript
const updatedOrder = await orderOperations.updateStatus("order-id", "SHIPPED")
```

### Order Utilities
```typescript
// Get user orders
const { orders } = await orderOperations.getUserOrders("user-id", {
  status: "DELIVERED",
  page: 1,
  limit: 5
})

// Get order statistics
const stats = await orderOperations.getStats({
  dateFrom: new Date("2024-01-01"),
  dateTo: new Date("2024-12-31")
})

// Get recent orders
const recent = await orderOperations.getRecent(10)
```

## Reviews

### Create Review
```typescript
const review = await reviewOperations.create({
  productId: "product-id",
  userId: "user-id",
  userName: "John Doe",
  rating: 5,
  comment: "Great product!"
})
```

### Get Product Reviews
```typescript
const { reviews, ratingStats, pagination } = await reviewOperations.getProductReviews("product-id", {
  rating: 5,
  sortBy: "createdAt",
  sortOrder: "desc",
  page: 1,
  limit: 10
})
```

### Update Review
```typescript
const updatedReview = await reviewOperations.update("review-id", {
  rating: 4,
  comment: "Updated comment"
})
```

### Review Utilities
```typescript
// Get product rating statistics
const stats = await reviewOperations.getProductRatingStats("product-id")

// Check if user can review product
const { canReview, reason } = await reviewOperations.canUserReview("user-id", "product-id")
```

## Categories

### Get All Categories
```typescript
const categories = await categoryOperations.getAll()
// Returns: [{ name: "All", count: 100 }, { name: "Electronics", count: 25 }, ...]
```

### Get Category Statistics
```typescript
const stats = await categoryOperations.getStats()
// Returns detailed stats for each category
```

### Get Products by Category
```typescript
const { products, pagination } = await categoryOperations.getProducts("Electronics", {
  sortBy: "rating",
  sortOrder: "desc",
  page: 1,
  limit: 12
})
```

## Analytics

### Dashboard Statistics
```typescript
const dashboardData = await analyticsOperations.getDashboardStats()
// Returns overview stats, recent orders, top products
```

### Sales Analytics
```typescript
const salesData = await analyticsOperations.getSalesAnalytics({
  dateFrom: new Date("2024-01-01"),
  dateTo: new Date("2024-12-31"),
  groupBy: "month"
})
// Returns sales by period, category, and top selling products
```

### User Analytics
```typescript
const userData = await analyticsOperations.getUserAnalytics()
// Returns user growth, distribution by role/status, top customers
```

### Product Analytics
```typescript
const productData = await analyticsOperations.getProductAnalytics()
// Returns product distribution, performance, top rated products
```

### Order Analytics
```typescript
const orderData = await analyticsOperations.getOrderAnalytics({
  dateFrom: new Date("2024-01-01"),
  dateTo: new Date("2024-12-31")
})
// Returns order trends, status distribution, customer analysis
```

## Error Handling

All operations include proper error handling. Wrap calls in try-catch blocks:

```typescript
try {
  const product = await productOperations.getById("invalid-id")
} catch (error) {
  console.error("Error:", error.message)
  // Handle error appropriately
}
```

## Type Safety

All operations are fully typed with TypeScript. Import types as needed:

```typescript
import type { Product, User, Order, Review } from '@prisma/client'
```

## Pagination

Most list operations return pagination information:

```typescript
const { items, pagination } = await someOperation.getAll()

console.log(pagination)
// {
//   total: 100,
//   pages: 10,
//   currentPage: 1,
//   hasNext: true,
//   hasPrev: false
// }
```

## Best Practices

1. **Always handle errors** - Wrap database calls in try-catch blocks
2. **Use pagination** - Don't fetch all records at once for large datasets
3. **Validate input** - Validate data before passing to operations
4. **Use transactions** - For operations that modify multiple tables
5. **Cache results** - Consider caching frequently accessed data
6. **Monitor performance** - Use database query analysis tools

## Examples in Next.js API Routes

### API Route Example
```typescript
// app/api/products/route.ts
import { productOperations } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const page = parseInt(searchParams.get('page') || '1')
    
    const result = await productOperations.getAll({
      category: category || undefined,
      page,
      limit: 12
    })
    
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const product = await productOperations.create(data)
    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}
```

### Server Component Example
```typescript
// app/products/page.tsx
import { productOperations } from '@/lib/db'

export default async function ProductsPage({
  searchParams
}: {
  searchParams: { category?: string; page?: string }
}) {
  const { products, pagination } = await productOperations.getAll({
    category: searchParams.category,
    page: parseInt(searchParams.page || '1'),
    limit: 12
  })

  return (
    <div>
      {products.map(product => (
        <div key={product.id}>{product.title}</div>
      ))}
      {/* Pagination component */}
    </div>
  )
}
```

This comprehensive CRUD system provides everything you need to manage your e-commerce database efficiently and safely!