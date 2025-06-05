import type { Metadata } from "next"

export const metadata: Metadata = {
  title: {
    default: "Authentication",
    template: "%s | ShopHub",
  },
  description: "Sign in or create an account to access your ShopHub account.",
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}