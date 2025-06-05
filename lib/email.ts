import nodemailer from "nodemailer"
import { prisma } from "@/lib/db/client"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

export async function generateOtpCode(): Promise<string> {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function sendOtpEmail(
  email: string,
  type: "EMAIL_VERIFICATION" | "PASSWORD_RESET" | "LOGIN_VERIFICATION"
): Promise<string> {
  const code = await generateOtpCode()
  const expires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

  // Store OTP in database
  await prisma.otpCode.create({
    data: {
      email,
      code,
      type,
      expires,
    },
  })

  let subject: string
  let html: string

  switch (type) {
    case "EMAIL_VERIFICATION":
      subject = "Verify Your Email - ShopHub"
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to ShopHub!</h2>
          <p>Thank you for signing up. Please verify your email address using the code below:</p>
          <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #007bff; font-size: 32px; margin: 0;">${code}</h1>
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't create an account with ShopHub, please ignore this email.</p>
        </div>
      `
      break
    case "PASSWORD_RESET":
      subject = "Reset Your Password - ShopHub"
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>You requested to reset your password. Use the code below to proceed:</p>
          <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #dc3545; font-size: 32px; margin: 0;">${code}</h1>
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request a password reset, please ignore this email.</p>
        </div>
      `
      break
    case "LOGIN_VERIFICATION":
      subject = "Login Verification - ShopHub"
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Login Verification</h2>
          <p>Use the code below to complete your login:</p>
          <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #28a745; font-size: 32px; margin: 0;">${code}</h1>
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't try to log in, please secure your account immediately.</p>
        </div>
      `
      break
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || "noreply@shophub.com",
      to: email,
      subject,
      html,
    })
    return code
  } catch (error) {
    console.error("Failed to send email:", error)
    throw new Error("Failed to send verification email")
  }
}

export async function verifyOtpCode(
  email: string,
  code: string,
  type: "EMAIL_VERIFICATION" | "PASSWORD_RESET" | "LOGIN_VERIFICATION"
): Promise<boolean> {
  const otpRecord = await prisma.otpCode.findFirst({
    where: {
      email,
      code,
      type,
      used: false,
      expires: { gt: new Date() },
    },
  })

  if (!otpRecord) {
    return false
  }

  // Mark OTP as used
  await prisma.otpCode.update({
    where: { id: otpRecord.id },
    data: { used: true },
  })

  return true
}