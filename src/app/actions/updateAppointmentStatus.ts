"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { sendNotificationEmail } from "@/lib/email"

export async function updateAppointmentStatus(appointmentId: string, status: string) {
  const session = await auth()
  
  if (!session?.user || (session.user.role !== "DOCTOR" && session.user.role !== "ADMIN")) {
    throw new Error("Unauthorized")
  }

  // If Doctor, verify the appointment belongs to them
  if (session.user.role === "DOCTOR") {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId }
    })
    
    if (!appointment || appointment.doctorId !== session.user.id) {
      throw new Error("Invalid appointment")
    }
  }

  const updatedAppt = await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status },
    include: {
      patient: true,
      doctor: true
    }
  })

  // Trigger Notifications if Confirmed
  if (status === "CONFIRMED") {
    // In-App Notification
    await prisma.inAppNotification.create({
      data: {
        userId: updatedAppt.patientId,
        message: `Your appointment with ${updatedAppt.doctor.name} on ${updatedAppt.date.toISOString().split('T')[0]} at ${updatedAppt.time} has been CONFIRMED.`
      }
    })

    // Email Notification
    await sendNotificationEmail(
      updatedAppt.patient.name || "Patient",
      updatedAppt.patient.email || "",
      "Appointment Confirmed - Doctorify",
      `<p>Your appointment with <strong>${updatedAppt.doctor.name}</strong> has been confirmed.</p>
       <p>Date: ${updatedAppt.date.toISOString().split('T')[0]}</p>
       <p>Time: ${updatedAppt.time}</p>
       <p>Please log in to your dashboard at the scheduled time to join the video consultation.</p>`
    )
  }

  revalidatePath("/dashboard")
}
