"use client"
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

        {mode === "login" ? <LoginForm onSuccess={onClose} /> : <RegisterForm onSuccess={onClose} />}

        <div className="text-center text-sm text-muted-foreground">
          {mode === "login" ? (
            <>
              Don't have an account?{" "}
              <Button variant="link" className="p-0 h-auto" onClick={() => onModeChange("register")}>
                Sign up
              </Button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Button variant="link" className="p-0 h-auto" onClick={() => onModeChange("login")}>
                Sign in
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
