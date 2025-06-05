"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { useAuth } from "@/contexts/auth-context"
import { Eye, EyeOff, Loader2, Mail, CheckCircle } from "lucide-react"

const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine((val) => val === true, "You must accept the terms and conditions"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

const verificationSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6, "Verification code must be 6 digits"),
})

type RegisterFormData = z.infer<typeof registerSchema>
type VerificationFormData = z.infer<typeof verificationSchema>

interface RegisterFormProps {
  onSuccess: () => void
  onSwitchToLogin: () => void
}

export function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [step, setStep] = useState<"register" | "verify" | "success">("register")
  const [registeredEmail, setRegisteredEmail] = useState("")
  const { register, verifyEmail, sendOtp, isLoading } = useAuth()

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const verificationForm = useForm<VerificationFormData>({
    resolver: zodResolver(verificationSchema),
  })

  const onRegister = async (data: RegisterFormData) => {
    try {
      const result = await register(data.name, data.email, data.password)
      setRegisteredEmail(data.email)
      verificationForm.setValue("email", data.email)
      
      // Check if email verification is available
      if (result && result.emailWarning) {
        // Email service unavailable, skip verification step
        setStep("success")
        setTimeout(() => {
          onSuccess()
        }, 2000)
      } else {
        // Email verification available, proceed to verification step
        setStep("verify")
      }
    } catch (error) {
      // Error handled in context
    }
  }

  const onVerifyEmail = async (data: VerificationFormData) => {
    try {
      await verifyEmail(data.email, data.code)
      setStep("success")
      setTimeout(() => {
        onSuccess()
      }, 2000)
    } catch (error) {
      // Error handled in context
    }
  }

  const onResendCode = async () => {
    try {
      await sendOtp(registeredEmail, "EMAIL_VERIFICATION")
    } catch (error) {
      // Error handled in context
    }
  }

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/" })
  }

  if (step === "success") {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-green-600">Email Verified!</h3>
          <p className="text-sm text-muted-foreground">
            Your account has been successfully created and verified.
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          Redirecting you to login...
        </div>
      </div>
    )
  }

  if (step === "verify") {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <Mail className="h-12 w-12 mx-auto text-primary mb-2" />
          <h3 className="text-lg font-semibold">Verify Your Email</h3>
          <p className="text-sm text-muted-foreground">
            We've sent a verification code to <strong>{registeredEmail}</strong>
          </p>
        </div>

        <form onSubmit={verificationForm.handleSubmit(onVerifyEmail)} className="space-y-4">
          <input type="hidden" {...verificationForm.register("email")} value={registeredEmail} />

          <div className="space-y-2">
            <Label htmlFor="verification-code">Verification Code</Label>
            <InputOTP
              maxLength={6}
              value={verificationForm.watch("code") || ""}
              onChange={(value) => verificationForm.setValue("code", value)}
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
            {verificationForm.formState.errors.code && (
              <p className="text-sm text-destructive">{verificationForm.formState.errors.code.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verify Email
          </Button>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Didn't receive the code?{" "}
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto text-sm"
                onClick={onResendCode}
                disabled={isLoading}
              >
                Resend
              </Button>
            </p>
          </div>

          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => setStep("register")}
          >
            Back to Registration
          </Button>
        </form>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            type="text"
            placeholder="Enter your full name"
            {...registerForm.register("name")}
          />
          {registerForm.formState.errors.name && (
            <p className="text-sm text-destructive">{registerForm.formState.errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            {...registerForm.register("email")}
          />
          {registerForm.formState.errors.email && (
            <p className="text-sm text-destructive">{registerForm.formState.errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a password"
              {...registerForm.register("password")}
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
          {registerForm.formState.errors.password && (
            <p className="text-sm text-destructive">{registerForm.formState.errors.password.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm your password"
              {...registerForm.register("confirmPassword")}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          {registerForm.formState.errors.confirmPassword && (
            <p className="text-sm text-destructive">{registerForm.formState.errors.confirmPassword.message}</p>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="acceptTerms"
            checked={registerForm.watch("acceptTerms") || false}
            onCheckedChange={(checked) => registerForm.setValue("acceptTerms", checked as boolean)}
          />
          <Label htmlFor="acceptTerms" className="text-sm leading-none">
            I accept the{" "}
            <Button variant="link" className="p-0 h-auto text-sm">
              Terms and Conditions
            </Button>{" "}
            and{" "}
            <Button variant="link" className="p-0 h-auto text-sm">
              Privacy Policy
            </Button>
          </Label>
        </div>
        {registerForm.formState.errors.acceptTerms && (
          <p className="text-sm text-destructive">{registerForm.formState.errors.acceptTerms.message}</p>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || !registerForm.watch("acceptTerms")}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Account
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

        <Button
          type="button"
          variant="outline"
          className="w-full"
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
          Continue with Google
        </Button>

        <div className="text-center text-sm">
          Already have an account?{" "}
          <Button
            type="button"
            variant="link"
            className="p-0 h-auto"
            onClick={onSwitchToLogin}
          >
            Sign in
          </Button>
        </div>
      </div>
    </div>
  )
}