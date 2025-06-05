import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Toaster } from "@/components/ui/toaster"
import { Providers } from "@/components/providers"
import { ProductsProvider } from "@/contexts/products-context"
import { ErrorBoundary } from "@/components/error-boundary"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: "ShopHub - Modern eCommerce Store",
    template: "%s | ShopHub",
  },
  description:
    "Discover amazing products at unbeatable prices. Shop the latest trends in fashion, electronics, home & garden, and more.",
  keywords: ["ecommerce", "shopping", "online store", "products", "fashion", "electronics"],
  authors: [{ name: "ShopHub Team" }],
  creator: "ShopHub",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://shophub.com",
    title: "ShopHub - Modern eCommerce Store",
    description: "Discover amazing products at unbeatable prices.",
    siteName: "ShopHub",
  },
  twitter: {
    card: "summary_large_image",
    title: "ShopHub - Modern eCommerce Store",
    description: "Discover amazing products at unbeatable prices.",
    creator: "@shophub",
  },
  robots: {
    index: true,
    follow: true,
  },
    generator: 'Amaraa'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ErrorBoundary>
          <Providers>
            <ProductsProvider>
              <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1">{children}</main>
                <Footer />
              </div>
            </ProductsProvider>
            <Toaster />
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  )
}