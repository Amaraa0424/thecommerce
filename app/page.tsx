import type { Metadata } from "next"
import { HeroSection } from "@/components/home/hero-section"
import { FeaturesSection } from "@/components/home/features-section"
import { ProductsSection } from "@/components/home/products-section"
import { TestimonialsSection } from "@/components/home/testimonials-section"
import { NewsletterSection } from "@/components/home/newsletter-section"

export const metadata: Metadata = {
  title: "ShopHub - Modern eCommerce Store",
  description:
    "Discover amazing products at unbeatable prices. Shop the latest trends in fashion, electronics, home & garden, and more.",
  openGraph: {
    title: "ShopHub - Modern eCommerce Store",
    description: "Discover amazing products at unbeatable prices.",
    images: ["/placeholder.svg?height=630&width=1200"],
  },
}

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <FeaturesSection />
      <ProductsSection />
      <TestimonialsSection />
      <NewsletterSection />
    </div>
  )
}
