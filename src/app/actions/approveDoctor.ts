"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { sendNotificationEmail } from "@/lib/email"

export async function approveDoctor(doctorId: string) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized: Only admins can approve doctors")
  }

  const doctorProfile = await prisma.doctorProfile.update({
    where: { userId: doctorId },
    data: { isVerified: true },
    include: { user: true }
  })

  // Send approval email
  if (doctorProfile.user.email) {
    const htmlContent = `
      <p>Hello Dr. ${doctorProfile.user.name},</p>
      <p>Good news! Your credentials have been verified by an administrator. Your account is now active and you will appear in patient search results.</p>
      <p>You can now log in and manage your schedule.</p>
      <br/>
      <p>Thank you,<br/>The Doctorify Team</p>
    `
    await sendNotificationEmail(doctorProfile.user.name || "Doctor", doctorProfile.user.email, "Your Doctorify Account is Approved!", htmlContent)
  }

  revalidatePath("/dashboard")
  revalidatePath("/doctors")

  return { success: true }
}
