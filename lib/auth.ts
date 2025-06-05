import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db/client"
import { sendOtpEmail } from "@/lib/email"
import type { User } from "next-auth"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        otp: { label: "OTP", type: "text" },
        isOtpLogin: { label: "Is OTP Login", type: "text" },
      },
      async authorize(credentials: any) {
        if (!credentials?.email) {
          throw new Error("Email is required")
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        // Handle OTP login
        if (credentials.isOtpLogin === "true") {
          if (!credentials.otp) {
            throw new Error("OTP is required")
          }

          const otpRecord = await prisma.otpCode.findFirst({
            where: {
              email: credentials.email,
              code: credentials.otp,
              type: "LOGIN_VERIFICATION",
              used: false,
              expires: { gt: new Date() },
            },
          })

          if (!otpRecord) {
            throw new Error("Invalid or expired OTP")
          }

          // Mark OTP as used
          await prisma.otpCode.update({
            where: { id: otpRecord.id },
            data: { used: true },
          })

          if (!user) {
            throw new Error("User not found")
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role,
          }
        }

        // Handle password login
        if (!credentials.password) {
          throw new Error("Password is required")
        }

        if (!user || !user.password) {
          throw new Error("Invalid credentials")
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

        if (!isPasswordValid) {
          throw new Error("Invalid credentials")
        }

        // Check if email is verified (only if email verification is enabled)
        if (!user.emailVerified && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
          throw new Error("Please verify your email before signing in")
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, account, trigger }: { token: any; user: any; account: any; trigger?: string }) {
      // On sign in, store user data in token
      if (user) {
        token.userId = user.id
        token.role = user.role
      }
      
      // On every request, refresh user data to ensure role is up to date
      if (trigger === "update" || !token.role) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.userId || token.sub },
            select: { id: true, role: true, status: true }
          })
          
          if (dbUser) {
            token.userId = dbUser.id
            token.role = dbUser.role
            token.status = dbUser.status
          }
        } catch (error) {
          // Silently handle error in production
        }
      }
      
      return token
    },
    async session({ session, token }: { session: any; token: any }) {
      if (token) {
        session.user.id = token.userId || token.sub
        session.user.role = token.role
        session.user.status = token.status
        
        // Fallback: if role is missing, fetch from database
        if (session.user.email && !token.role) {
          try {
            const user = await prisma.user.findUnique({
              where: { email: session.user.email },
              select: { id: true, role: true, status: true }
            })
            if (user) {
              session.user.id = user.id
              session.user.role = user.role
              session.user.status = user.status
            }
          } catch (error) {
            // Silently handle error in production
          }
        }
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  events: {
    async createUser({ user }: { user: any }) {
      // Send welcome email verification
      if (user.email && !user.emailVerified) {
        await sendOtpEmail(user.email, "EMAIL_VERIFICATION")
      }
    },
  },
}