"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { sendNotificationEmail } from "@/lib/email"

export async function emergencyCancel(dateStr: string) {
  const session = await auth()
  
  if (!session?.user || session.user.role !== "DOCTOR") {
    throw new Error("Only doctors can declare emergencies")
  }

  const targetDate = new Date(dateStr)
  targetDate.setUTCHours(0, 0, 0, 0)
  
  const endOfDay = new Date(targetDate)
  endOfDay.setUTCHours(23, 59, 59, 999)

  // 1. Mark the day as an OffDay in SpecialSchedule to prevent new bookings
  await prisma.specialSchedule.upsert({
    where: {
      doctorId_date: {
        doctorId: session.user.id,
        date: targetDate
      }
    },
    update: {
      isOffDay: true
    },
    create: {
      doctorId: session.user.id,
      date: targetDate,
      startTime: "00:00",
      endTime: "00:00",
      isOffDay: true
    }
  })

  // 2. Find affected appointments
  const affectedAppts = await prisma.appointment.findMany({
    where: {
      doctorId: session.user.id,
      date: { gte: targetDate, lte: endOfDay },
      status: { in: ["PENDING", "CONFIRMED"] }
    },
    include: { patient: true, doctor: true }
  })

  // 3. Cancel them and notify patients
  for (const appt of affectedAppts) {
    await prisma.appointment.update({
      where: { id: appt.id },
      data: { status: "CANCELLED_EMERGENCY", notes: "Cancelled due to doctor emergency." }
    })

    // In-App Notification
    await prisma.inAppNotification.create({
      data: {
        userId: appt.patientId,
        message: `EMERGENCY: Your appointment on ${dateStr} at ${appt.time} was cancelled due to an unforeseen emergency by Dr. ${appt.doctor.name}. Please go to your dashboard to Reschedule or Request a Refund.`
      }
    })

    // Email Notification
    await sendNotificationEmail(
      appt.patient.name || "Patient",
      appt.patient.email || "",
      "EMERGENCY CANCELLATION",
      `<h3>Emergency Cancellation Notice</h3>
       <p>We deeply apologize, but <strong>Dr. ${appt.doctor.name}</strong> has had to declare an emergency unavailability for <strong>${dateStr}</strong>.</p>
       <p>Your appointment at <strong>${appt.time}</strong> has been cancelled.</p>
       <p>Please log in to your Doctorify dashboard where you can either instantly <strong>Reschedule</strong> to their next available slot or <strong>Request a Refund</strong>.</p>`
    )
  }

  revalidatePath("/dashboard")
  return { success: true, count: affectedAppts.length }
}
