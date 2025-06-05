"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
  const handleLoginSuccess = () => {
    // Redirect to dashboard or previous page
    window.location.href = "/"
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription>Sign in to your account to continue shopping</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm 
              onSuccess={handleLoginSuccess} 
              onSwitchToRegister={() => window.location.href = "/auth/register"}
            />

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/auth/register" className="text-primary hover:underline">
                Create one here
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
