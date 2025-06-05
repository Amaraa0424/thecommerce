"use client"
import { useCallback } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { LoginForm } from "@/components/auth/login-form"
import { RegisterForm } from "@/components/auth/register-form"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  mode: "login" | "register"
  onModeChange: (mode: "login" | "register") => void
}

export function AuthModal({ isOpen, onClose, mode, onModeChange }: AuthModalProps) {
  const handleSwitchToRegister = useCallback(() => {
    onModeChange("register")
  }, [onModeChange])

  const handleSwitchToLogin = useCallback(() => {
    onModeChange("login")
  }, [onModeChange])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "login" ? "Sign In" : "Create Account"}</DialogTitle>
          <DialogDescription>
            {mode === "login"
              ? "Welcome back! Please sign in to your account."
              : "Create a new account to start shopping."}
          </DialogDescription>
        </DialogHeader>

        {mode === "login" ? (
          <LoginForm 
            onSuccess={onClose} 
            onSwitchToRegister={handleSwitchToRegister} 
          />
        ) : (
          <RegisterForm 
            onSuccess={onClose} 
            onSwitchToLogin={handleSwitchToLogin} 
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
