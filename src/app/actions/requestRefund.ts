"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

export async function requestRefund(appointmentId: string) {
  const session = await auth()
  if (!session?.user || session.user.role !== "PATIENT") {
    throw new Error("Only patients can request refunds")
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId }
  })

  if (!appointment || appointment.patientId !== session.user.id) {
    throw new Error("Invalid appointment")
  }

  if (appointment.status !== "CANCELLED_EMERGENCY") {
    throw new Error("Refunds are only available for emergency cancellations.")
  }

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { refundRequested: true }
  })

  // Optionally notify admin or doctor
  await prisma.inAppNotification.create({
    data: {
      userId: appointment.doctorId,
      message: `Patient has requested a refund for the emergency cancelled appointment on ${appointment.date.toISOString().split('T')[0]}.`
    }
  })

  revalidatePath("/dashboard")
  return { success: true }
}
