"use server"

import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { redirect } from "next/navigation"
import { sendNotificationEmail } from "@/lib/email"

export async function registerUser(formData: FormData) {
  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const role = formData.get("role") as string || "PATIENT"
  const specialty = formData.get("specialty") as string
  const qualifications = formData.get("qualifications") as string

  if (!name || !email || !password) {
    throw new Error("Missing required fields")
  }

  if (role === "DOCTOR" && (!specialty || !qualifications)) {
    throw new Error("Doctor specialty and qualifications are required")
  }

  const existingUser = await prisma.user.findUnique({
    where: { email }
  })

  if (existingUser) {
    throw new Error("User with this email already exists")
  }

  const hashedPassword = await bcrypt.hash(password, 10)
  
  // Generate 6 digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
      image: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
      otp,
      otpExpiresAt
    }
  })

  if (role === "DOCTOR") {
    await prisma.doctorProfile.create({
      data: {
        userId: user.id,
        specialty,
        qualifications,
        experience: 0,
        consultationFee: 500,
        isVerified: false
      }
    })
  } else if (role === "PATIENT") {
    await prisma.medicalRecord.create({
      data: {
        patientId: user.id
      }
    })
  }

  // Send OTP Email
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #0284c7; text-align: center;">Doctorify Account Verification</h2>
      <p style="font-size: 16px; color: #334155;">Hello <strong>${name}</strong>,</p>
      <p style="font-size: 16px; color: #334155;">Thank you for registering with Doctorify. To complete your account setup and ensure the security of our platform, please use the verification code below:</p>
      
      <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; text-align: center; margin: 25px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #0ea5e9;">${otp}</span>
      </div>
      
      <p style="font-size: 14px; color: #64748b;">This secure code will expire in exactly 10 minutes. If you did not request this account creation, please ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 12px; color: #94a3b8; text-align: center;">This is an automated message from the Doctorify Verification System. Please do not reply.</p>
    </div>
  `
  await sendNotificationEmail(name, email, "Verify your Doctorify Account", htmlContent)

  redirect(`/verify-email?email=${encodeURIComponent(email)}`)
}
