import { NextRequest, NextResponse } from "next/server"
import { sendOtpEmail } from "@/lib/email"
import { prisma } from "@/lib/db/client"

export async function POST(request: NextRequest) {
  try {
    const { email, type } = await request.json()

    if (!email || !type) {
      return NextResponse.json(
        { error: "Email and type are required" },
        { status: 400 }
      )
    }

    // Check if user exists for certain types
    if (type === "PASSWORD_RESET" || type === "LOGIN_VERIFICATION") {
      const user = await prisma.user.findUnique({
        where: { email },
      })

      if (!user) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        )
      }
    }

    // Rate limiting: Check if OTP was sent recently
    const recentOtp = await prisma.otpCode.findFirst({
      where: {
        email,
        type,
        createdAt: { gt: new Date(Date.now() - 60 * 1000) }, // 1 minute ago
      },
    })

    if (recentOtp) {
      return NextResponse.json(
        { error: "Please wait before requesting another OTP" },
        { status: 429 }
      )
    }

    await sendOtpEmail(email, type)

    return NextResponse.json(
      { message: "OTP sent successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Send OTP error:", error)
    return NextResponse.json(
      { error: "Failed to send OTP" },
      { status: 500 }
    )
  }
}