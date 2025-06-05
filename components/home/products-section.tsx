import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProductCard, ProductCardProps } from "@/components/product/product-card";
import { productOperations } from "@/lib/db";
import { ArrowRight } from "lucide-react";

export async function ProductsSection() {
  const featuredProducts = await productOperations.getFeatured(4);

  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Featured Products
            </h2>
            <p className="text-xl text-muted-foreground">
              Discover our most popular and trending items
            </p>
          </div>
          <Button variant="outline" asChild className="hidden md:flex">
            <Link href="/products">
              View All Products
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {featuredProducts.map((product: ProductCardProps["product"]) => (
            <ProductCard key={product.id} product={product} />
            ))}
        </div>

        <div className="text-center md:hidden">
          <Button asChild>
            <Link href="/products">
              View All Products
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
