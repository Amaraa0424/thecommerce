import type { Metadata } from "next"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RegisterForm } from "@/components/auth/register-form"

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create a new ShopHub account to start shopping and access exclusive features.",
}

export default function RegisterPage() {
  const handleRegisterSuccess = () => {
    // Redirect to dashboard or previous page
    window.location.href = "/"
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Create Account</CardTitle>
            <CardDescription>Join ShopHub and start your shopping journey</CardDescription>
          </CardHeader>
          <CardContent>
            <RegisterForm onSuccess={handleRegisterSuccess} />

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-primary hover:underline">
                Sign in here
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
