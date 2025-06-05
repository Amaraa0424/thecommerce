import { NextRequest, NextResponse } from "next/server"
import { verifyOtpCode } from "@/lib/email"
import { prisma } from "@/lib/db/client"

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json()

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email and code are required" },
        { status: 400 }
      )
    }

    const isValid = await verifyOtpCode(email, code, "EMAIL_VERIFICATION")

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid or expired verification code" },
        { status: 400 }
      )
    }

    // Update user's email verification status
    await prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    })

    return NextResponse.json(
      { message: "Email verified successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Email verification error:", error)
    return NextResponse.json(
      { error: "Failed to verify email" },
      { status: 500 }
    )
  }
}