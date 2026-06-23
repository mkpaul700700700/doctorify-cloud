"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function updateAvatar(imageUrl: string) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { image: imageUrl }
  })

  return { success: true }
}

export async function updateSignature(signatureUrl: string) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "DOCTOR") {
    throw new Error("Unauthorized or not a doctor")
  }

  await prisma.doctorProfile.update({
    where: { userId: session.user.id },
    data: { signatureUrl }
  })

  return { success: true }
}
