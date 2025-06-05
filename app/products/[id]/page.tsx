import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ProductDetail } from "@/components/product/product-detail"
import { ProductReviews } from "@/components/product/product-reviews"
import { RelatedProducts } from "@/components/product/related-products"
import { productOperations } from "@/lib/db"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

interface ProductPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  try {
    const product = await productOperations.getById(params.id)

    return {
      title: product.title,
      description: product.description,
      openGraph: {
        title: `${product.title} | ShopHub`,
        description: product.description,
        images: [product.images[0]],
      },
    }
  } catch (error) {
    return {
      title: "Product Not Found",
    }
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  try {
    const product = await productOperations.getById(params.id)
    
    return (
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/products">Products</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/products?category=${product.category}`}>{product.category}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{product.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Product Detail */}
        <ProductDetail product={product} />

        {/* Product Reviews */}
        <div className="mt-16">
          <ProductReviews productId={product.id} productTitle={product.title} />
        </div>

        {/* Related Products */}
        <div className="mt-16">
          <RelatedProducts currentProduct={product} />
        </div>
      </div>
    )
  } catch (error) {
    notFound()
  }
}
