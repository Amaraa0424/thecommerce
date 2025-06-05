// Export Prisma client
export { prisma } from './client'

// Export all CRUD operations
export { productOperations } from './products'
export { userOperations } from './users'
export { orderOperations } from './orders'
export { reviewOperations } from './reviews'
export { categoryOperations } from './categories'
export { analyticsOperations } from './analytics'
export { cartOperations } from './cart'
export { favoritesOperations } from './favorites'

// Export deletion utilities
export { deletionUtils } from './deletion-utils'