import type { Metadata } from "next"
import { ProductsGrid } from "@/components/product/products-grid"
import { ProductsFilter } from "@/components/product/products-filter"
import { ProductsSort } from "@/components/product/products-sort"
import { FilterCriteria } from "@/components/product/filter-criteria"
import { ProductsProvider } from "@/contexts/products-context"
import { productOperations } from "@/lib/db"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export const metadata: Metadata = {
  title: "Products",
  description: "Browse our extensive collection of high-quality products across various categories.",
  openGraph: {
    title: "Products | ShopHub",
    description: "Browse our extensive collection of high-quality products.",
  },
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  // Get search query from URL parameters
  const searchQuery = typeof searchParams.search === 'string' ? searchParams.search : undefined

  // Get initial products data with search if provided
  const { products, pagination } = await productOperations.getAll({
    page: 1,
    limit: 8,
    sortBy: "createdAt",
    sortOrder: "desc",
    ...(searchQuery && { search: searchQuery })
  })

  return (
    <ProductsProvider 
      initialProducts={products} 
      initialPagination={pagination}
      initialSearch={searchQuery}
    >
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Products</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Filter Criteria */}
        <FilterCriteria searchQuery={searchQuery} />

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">All Products</h1>
            <p className="text-muted-foreground mt-2">
              {searchQuery 
                ? `Search results for "${searchQuery}"` 
                : "Discover our extensive collection of high-quality products"
              }
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <ProductsSort />
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filter */}
          <div className="lg:col-span-1">
            <ProductsFilter />
          </div>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            <ProductsGrid />
          </div>
        </div>
      </div>
    </ProductsProvider>
  )
}