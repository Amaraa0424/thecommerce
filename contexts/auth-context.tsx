"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useSession, signIn, signOut } from "next-auth/react"
import { useErrorHandler } from "@/lib/error-handler"

interface AuthContextType {
  user: any
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  loginWithOtp: (email: string, otp: string) => Promise<void>
  logout: () => Promise<void>
  register: (name: string, email: string, password: string) => Promise<any>
  sendOtp: (email: string, type: "EMAIL_VERIFICATION" | "PASSWORD_RESET" | "LOGIN_VERIFICATION") => Promise<void>
  verifyEmail: (email: string, code: string) => Promise<void>
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const { handleError, showSuccess, handleAuthError } = useErrorHandler()

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        throw new Error(result.error)
      }

      showSuccess("Welcome back!", "You have been successfully signed in.")
    } catch (error: any) {
      handleAuthError(error, {
        title: "Login failed",
        description: error.message || "Invalid credentials"
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const loginWithOtp = async (email: string, otp: string) => {
    setIsLoading(true)
    try {
      const result = await signIn("credentials", {
        email,
        otp,
        isOtpLogin: "true",
        redirect: false,
      })

      if (result?.error) {
        throw new Error(result.error)
      }

      showSuccess("Welcome back!", "You have been successfully signed in with OTP.")
    } catch (error: any) {
      handleAuthError(error, {
        title: "OTP login failed",
        description: error.message || "Invalid OTP"
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    await signOut({ redirect: false })
    showSuccess("Signed out", "You have been successfully signed out.")
  }

  const register = async (name: string, email: string, password: string): Promise<any> => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Registration failed")
      }

      if (data.emailWarning) {
        showSuccess("Registration successful!", data.emailWarning)
      } else {
        showSuccess("Registration successful!", "Please check your email for verification code.")
      }
      
      return data
    } catch (error: any) {
      handleError(error, {
        title: "Registration failed",
        description: error.message
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const sendOtp = async (email: string, type: "EMAIL_VERIFICATION" | "PASSWORD_RESET" | "LOGIN_VERIFICATION") => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, type }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send OTP")
      }

      showSuccess("OTP sent", "Please check your email for the verification code.")
    } catch (error: any) {
      handleError(error, {
        title: "Failed to send OTP",
        description: error.message
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const verifyEmail = async (email: string, code: string) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Verification failed")
      }

      showSuccess("Email verified!", "Your email has been successfully verified.")
    } catch (error: any) {
      handleError(error, {
        title: "Verification failed",
        description: error.message
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const resetPassword = async (email: string, code: string, newPassword: string) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Password reset failed")
      }

      showSuccess("Password reset successful!", "Your password has been successfully updated.")
    } catch (error: any) {
      handleError(error, {
        title: "Password reset failed",
        description: error.message
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user: session?.user,
        isLoading: isLoading || status === "loading",
        isAuthenticated: !!session,
        login,
        loginWithOtp,
        logout,
        register,
        sendOtp,
        verifyEmail,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}