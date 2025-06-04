import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Manage your eCommerce store with comprehensive admin tools.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function AdminPage() {
  return null // Content is handled by layout
}
