import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { verifyOtpCode } from "@/lib/email"
import { prisma } from "@/lib/db/client"

export async function POST(request: NextRequest) {
  try {
    const { email, code, newPassword } = await request.json()

    if (!email || !code || !newPassword) {
      return NextResponse.json(
        { error: "Email, code, and new password are required" },
        { status: 400 }
      )
    }

    // Verify OTP
    const isValid = await verifyOtpCode(email, code, "PASSWORD_RESET")

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid or expired reset code" },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Update user's password
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    })

    return NextResponse.json(
      { message: "Password reset successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Password reset error:", error)
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    )
  }
}