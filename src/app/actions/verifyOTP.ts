"use server"

import { prisma } from "@/lib/prisma"

export async function verifyOTP(formData: FormData) {
  const email = formData.get("email") as string
  const otp = formData.get("otp") as string

  if (!email || !otp) {
    throw new Error("Missing email or OTP")
  }

  const user = await prisma.user.findUnique({
    where: { email }
  })

  if (!user) {
    throw new Error("User not found")
  }

  if (user.emailVerified) {
    return { success: true }
  }

  if (user.otp !== otp) {
    throw new Error("Invalid OTP code")
  }

  if (!user.otpExpiresAt || new Date() > user.otpExpiresAt) {
    throw new Error("OTP has expired. Please register again.")
  }

  // Verification successful
  await prisma.user.update({
    where: { email },
    data: {
      emailVerified: new Date(),
      otp: null,
      otpExpiresAt: null
    }
  })

  return { success: true }
}
