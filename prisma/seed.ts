import { PrismaClient } from '@prisma/client'
import { products, users, orders, reviews } from '../lib/data'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Clear existing data
  console.log('🧹 Cleaning existing data...')
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.shippingAddress.deleteMany()
  await prisma.review.deleteMany()
  await prisma.favorite.deleteMany()
  await prisma.cartItem.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()
  await prisma.user.deleteMany()

  // Seed Categories
  console.log('📂 Seeding categories...')
  const categories = [
    {
      name: 'Electronics',
      slug: 'electronics',
      description: 'Electronic devices and gadgets',
      sortOrder: 1,
    },
    {
      name: 'Clothing',
      slug: 'clothing',
      description: 'Fashion and apparel',
      sortOrder: 2,
    },
    {
      name: 'Home & Garden',
      slug: 'home-garden',
      description: 'Home improvement and garden supplies',
      sortOrder: 3,
    },
    {
      name: 'Sports',
      slug: 'sports',
      description: 'Sports equipment and gear',
      sortOrder: 4,
    },
    {
      name: 'Books',
      slug: 'books',
      description: 'Books and literature',
      sortOrder: 5,
    },
    {
      name: 'Beauty',
      slug: 'beauty',
      description: 'Beauty and personal care products',
      sortOrder: 6,
    },
  ]

  for (const category of categories) {
    await prisma.category.create({
      data: category,
    })
  }

  // Seed Users
  console.log('👥 Seeding users...')
  for (const user of users) {
    await prisma.user.create({
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.toUpperCase() as 'ADMIN' | 'CUSTOMER',
        status: user.status.toUpperCase() as 'ACTIVE' | 'INACTIVE',
        image: user.avatar,
        createdAt: new Date(user.createdAt),
      },
    })
  }

  // Seed Products
  console.log('📦 Seeding products...')
  for (const product of products) {
    await prisma.product.create({
      data: {
        id: product.id,
        title: product.title,
        subtitle: product.subtitle || '',
        description: product.description,
        price: product.price,
        originalPrice: product.originalPrice,
        category: product.category,
        images: product.images,
        availability: product.availability,
        rating: product.rating,
        reviewCount: product.reviewCount,
        tags: product.tags,
        createdAt: new Date(product.createdAt),
        updatedAt: new Date(product.updatedAt),
      },
    })
  }

  // Seed Reviews
  console.log('⭐ Seeding reviews...')
  for (const review of reviews) {
    await prisma.review.create({
      data: {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        productId: review.productId,
        userId: review.userId,
        userName: review.userName,
        createdAt: new Date(review.createdAt),
      },
    })
  }

  // Seed Orders with Shipping Addresses and Order Items
  console.log('🛒 Seeding orders...')
  for (const order of orders) {
    // First create the shipping address
    const shippingAddress = await prisma.shippingAddress.create({
      data: {
        street: order.shippingAddress.street,
        city: order.shippingAddress.city,
        state: order.shippingAddress.state,
        zipCode: order.shippingAddress.zipCode,
        country: order.shippingAddress.country,
        orderId: order.id,
      },
    })

    // Create the order
    const createdOrder = await prisma.order.create({
      data: {
        id: order.id,
        total: order.total,
        status: order.status.toUpperCase() as 'PENDING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED',
        customerId: order.customerId,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        shippingAddressId: shippingAddress.id,
        createdAt: new Date(order.createdAt),
      },
    })

    // Create order items
    for (const item of order.items) {
      await prisma.orderItem.create({
        data: {
          productId: item.productId,
          productTitle: item.productTitle,
          quantity: item.quantity,
          price: item.price,
          image: item.image,
          orderId: createdOrder.id,
        },
      })
    }
  }

  console.log('✅ Database seeding completed successfully!')
  
  // Print summary
  const categoryCount = await prisma.category.count()
  const userCount = await prisma.user.count()
  const productCount = await prisma.product.count()
  const orderCount = await prisma.order.count()
  const reviewCount = await prisma.review.count()
  
  console.log(`📊 Seeding Summary:`)
  console.log(`   Categories: ${categoryCount}`)
  console.log(`   Users: ${userCount}`)
  console.log(`   Products: ${productCount}`)
  console.log(`   Orders: ${orderCount}`)
  console.log(`   Reviews: ${reviewCount}`)
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })