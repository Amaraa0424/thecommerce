"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { useAuth } from "@/contexts/auth-context"
import { Eye, EyeOff, Loader2, Mail, Shield } from "lucide-react"

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

const otpSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  otp: z.string().length(6, "OTP must be 6 digits"),
})

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
})

const resetPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  code: z.string().length(6, "Code must be 6 digits"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
})

type LoginFormData = z.infer<typeof loginSchema>
type OtpFormData = z.infer<typeof otpSchema>
type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>
type ResetPasswordData = z.infer<typeof resetPasswordSchema>

interface LoginFormProps {
  onSuccess: () => void
  onSwitchToRegister: () => void
}

export function LoginForm({ onSuccess, onSwitchToRegister }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [loginMode, setLoginMode] = useState<"password" | "otp" | "forgot" | "reset">("password")
  const [otpEmail, setOtpEmail] = useState("")
  const { login, loginWithOtp, sendOtp, resetPassword, isLoading } = useAuth()

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const otpForm = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
  })

  const forgotForm = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const resetForm = useForm<ResetPasswordData>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const onPasswordLogin = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password)
      onSuccess()
    } catch (error) {
      // Error handled in context
    }
  }

  const onOtpLogin = async (data: OtpFormData) => {
    try {
      await loginWithOtp(data.email, data.otp)
      onSuccess()
    } catch (error) {
      // Error handled in context
    }
  }

  const onSendOtpForLogin = async () => {
    const email = otpForm.getValues("email")
    if (!email) {
      otpForm.setError("email", { message: "Email is required" })
      return
    }
    try {
      await sendOtp(email, "LOGIN_VERIFICATION")
    } catch (error) {
      // Error handled in context
    }
  }

  const onForgotPassword = async (data: ForgotPasswordData) => {
    try {
      await sendOtp(data.email, "PASSWORD_RESET")
      setOtpEmail(data.email)
      setLoginMode("reset")
    } catch (error) {
      // Error handled in context
    }
  }

  const onResetPassword = async (data: ResetPasswordData) => {
    try {
      await resetPassword(data.email, data.code, data.newPassword)
      setLoginMode("password")
    } catch (error) {
      // Error handled in context
    }
  }

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/" })
  }

  if (loginMode === "otp") {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto text-primary mb-2" />
          <h3 className="text-lg font-semibold">Login with OTP</h3>
          <p className="text-sm text-muted-foreground">
            Enter your email and we'll send you a verification code
          </p>
        </div>

        <form onSubmit={otpForm.handleSubmit(onOtpLogin)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="otp-email">Email</Label>
            <Input
              id="otp-email"
              type="email"
              placeholder="Enter your email"
              {...otpForm.register("email")}
            />
            {otpForm.formState.errors.email && (
              <p className="text-sm text-destructive">{otpForm.formState.errors.email.message}</p>
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={onSendOtpForLogin}
            disabled={isLoading}
          >
            <Mail className="h-4 w-4 mr-2" />
            Send OTP
          </Button>

          <div className="space-y-2">
            <Label htmlFor="otp">Verification Code</Label>
            <InputOTP
              maxLength={6}
              value={otpForm.watch("otp") || ""}
              onChange={(value) => otpForm.setValue("otp", value)}
            >
              <InputOTPGroup className="w-full justify-center">
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
            {otpForm.formState.errors.otp && (
              <p className="text-sm text-destructive">{otpForm.formState.errors.otp.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verify & Sign In
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => setLoginMode("password")}
          >
            Back to Password Login
          </Button>
        </form>
      </div>
    )
  }

  if (loginMode === "forgot") {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <Mail className="h-12 w-12 mx-auto text-primary mb-2" />
          <h3 className="text-lg font-semibold">Forgot Password</h3>
          <p className="text-sm text-muted-foreground">
            Enter your email to receive a password reset code
          </p>
        </div>

        <form onSubmit={forgotForm.handleSubmit(onForgotPassword)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="forgot-email">Email</Label>
            <Input
              id="forgot-email"
              type="email"
              placeholder="Enter your email"
              {...forgotForm.register("email")}
            />
            {forgotForm.formState.errors.email && (
              <p className="text-sm text-destructive">{forgotForm.formState.errors.email.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send Reset Code
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => setLoginMode("password")}
          >
            Back to Login
          </Button>
        </form>
      </div>
    )
  }

  if (loginMode === "reset") {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto text-primary mb-2" />
          <h3 className="text-lg font-semibold">Reset Password</h3>
          <p className="text-sm text-muted-foreground">
            Enter the code sent to {otpEmail} and your new password
          </p>
        </div>

        <form onSubmit={resetForm.handleSubmit(onResetPassword)} className="space-y-4">
          <input type="hidden" {...resetForm.register("email")} value={otpEmail} />

          <div className="space-y-2">
            <Label htmlFor="reset-code">Reset Code</Label>
            <InputOTP
              maxLength={6}
              value={resetForm.watch("code") || ""}
              onChange={(value) => resetForm.setValue("code", value)}
            >
              <InputOTPGroup className="w-full justify-center">
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
            {resetForm.formState.errors.code && (
              <p className="text-sm text-destructive">{resetForm.formState.errors.code.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              placeholder="Enter new password"
              {...resetForm.register("newPassword")}
            />
            {resetForm.formState.errors.newPassword && (
              <p className="text-sm text-destructive">{resetForm.formState.errors.newPassword.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Reset Password
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => setLoginMode("password")}
          >
            Back to Login
          </Button>
        </form>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <form onSubmit={loginForm.handleSubmit(onPasswordLogin)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            {...loginForm.register("email")}
          />
          {loginForm.formState.errors.email && (
            <p className="text-sm text-destructive">{loginForm.formState.errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              {...loginForm.register("password")}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          {loginForm.formState.errors.password && (
            <p className="text-sm text-destructive">{loginForm.formState.errors.password.message}</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="link"
            className="p-0 h-auto text-sm"
            onClick={() => setLoginMode("forgot")}
          >
            Forgot password?
          </Button>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Sign In
        </Button>
      </form>

      <div className="space-y-4">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => setLoginMode("otp")}
            disabled={isLoading}
          >
            <Shield className="h-4 w-4 mr-2" />
            OTP Login
          </Button>
        </div>

        <div className="text-center text-sm">
          Don't have an account?{" "}
          <Button
            type="button"
            variant="link"
            className="p-0 h-auto"
            onClick={onSwitchToRegister}
          >
            Sign up
          </Button>
        </div>
      </div>
    </div>
  )
}
