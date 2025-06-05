import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db/client"
import { sendOtpEmail } from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists with this email" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    })

    // Try to send verification email (optional)
    try {
      await sendOtpEmail(email, "EMAIL_VERIFICATION")
      return NextResponse.json(
        {
          message: "User created successfully. Please check your email for verification code.",
          userId: user.id,
        },
        { status: 201 }
      )
    } catch (emailError) {
      console.warn("Failed to send verification email:", emailError)
      // Still return success even if email fails
      return NextResponse.json(
        {
          message: "User created successfully. Email verification is currently unavailable.",
          userId: user.id,
          emailWarning: "Email service unavailable - you can still login with your credentials.",
        },
        { status: 201 }
      )
    }
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    )
  }
}