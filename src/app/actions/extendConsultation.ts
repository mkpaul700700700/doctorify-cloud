"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { sendNotificationEmail } from "@/lib/email"

export async function extendConsultation(appointmentId: string, delayMinutes: number = 15) {
  const session = await auth()
  
  if (!session?.user || session.user.role !== "DOCTOR") {
    throw new Error("Only doctors can extend consultations")
  }

  const currentAppt = await prisma.appointment.findUnique({
    where: { id: appointmentId }
  })

  if (!currentAppt || currentAppt.doctorId !== session.user.id) {
    throw new Error("Invalid appointment")
  }

  // Find all subsequent appointments for this doctor on this day
  const startOfDay = new Date(currentAppt.date)
  startOfDay.setUTCHours(0, 0, 0, 0)
  const endOfDay = new Date(currentAppt.date)
  endOfDay.setUTCHours(23, 59, 59, 999)

  const subsequentAppts = await prisma.appointment.findMany({
    where: {
      doctorId: session.user.id,
      date: { gte: startOfDay, lte: endOfDay },
      time: { gt: currentAppt.time }, // Lexicographical comparison works for HH:MM strings (e.g. "14:30" > "14:15")
      status: { in: ["CONFIRMED", "PENDING"] }
    },
    include: { patient: true }
  })

  // Start Transaction to shift timeline
  await prisma.$transaction(async (tx) => {
    
    // Extend the current appointment (We can just mark it extended in notes or just leave it)
    // The core requirement is shifting subsequent appointments.
    
    for (const appt of subsequentAppts) {
      // Parse HH:MM and add delayMinutes
      const [hourStr, minStr] = appt.time.split(":")
      const totalMins = parseInt(hourStr) * 60 + parseInt(minStr) + delayMinutes
      const newHour = Math.floor(totalMins / 60)
      const newMin = totalMins % 60
      const newTimeStr = `${String(newHour).padStart(2, '0')}:${String(newMin).padStart(2, '0')}`

      // Update Appointment Time
      await tx.appointment.update({
        where: { id: appt.id },
        data: { time: newTimeStr }
      })

      // Send In-App Notification
      await tx.inAppNotification.create({
        data: {
          userId: appt.patientId,
          message: `Urgent: Your appointment has been delayed by ${delayMinutes} minutes. Your new time is ${newTimeStr}.`
        }
      })

      // Send Email Notification
      await sendNotificationEmail(
        appt.patient.name || "Patient",
        appt.patient.email || "",
        "Urgent: Appointment Delayed",
        `<p>Your upcoming appointment has been delayed by ${delayMinutes} minutes because the doctor is extending a previous consultation to provide extra care.</p>
         <p>Your new appointment time is: <strong>${newTimeStr}</strong>.</p>
         <p>We apologize for the wait and appreciate your patience.</p>`
      )
    }
  })

  revalidatePath("/dashboard")
  revalidatePath(`/call/${appointmentId}`)
}
