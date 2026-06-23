"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { sendNotificationEmail } from "@/lib/email"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function verifyPayment(appointmentId: string, cardNumber: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500))

  // Basic mock validation: we can accept anything or specifically look for 4242
  if (!cardNumber || cardNumber.length < 15) {
    throw new Error("Invalid card number. Please check your details.")
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { doctor: true, patient: true }
  })

  if (!appointment) throw new Error("Appointment not found")
  if (appointment.patientId !== session.user.id) throw new Error("Unauthorized")
  if (appointment.status !== "AWAITING_PAYMENT") throw new Error("Appointment is not awaiting payment.")

  // 1. Update Appointment Status
  await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      paymentStatus: "PAID",
      status: "CONFIRMED"
    }
  })

  // 2. Create In-App Notification for Doctor
  await prisma.inAppNotification.create({
    data: {
      userId: appointment.doctorId,
      message: `New paid appointment confirmed from ${appointment.patient.name} for ${appointment.date.toISOString().split('T')[0]} at ${appointment.time}.`
    }
  })

  // 3. Trigger Emails to Doctor and Patient
  const dateStr = appointment.date.toISOString().split('T')[0]
  const amount = appointment.amount ? appointment.amount.toFixed(2) : "0.00"

  await sendNotificationEmail(
    appointment.doctor.name || "Doctor",
    appointment.doctor.email || "",
    "Payment Confirmed - New Appointment - Doctorify",
    `<p>You have a new confirmed & paid appointment from <strong>${appointment.patient.name}</strong>.</p>
     <p>Date: ${dateStr}</p>
     <p>Time: ${appointment.time}</p>
     <p>Amount Paid: ৳${amount}</p>
     <p>Please log in to your dashboard to view details.</p>`
  )
  
  await sendNotificationEmail(
    appointment.patient.name || "Patient",
    appointment.patient.email || "",
    "Payment Successful - Appointment Confirmed - Doctorify",
    `<p>Your payment of ৳${amount} was successful!</p>
     <p>Your appointment with Dr. ${appointment.doctor.name} is now confirmed for <strong>${dateStr} at ${appointment.time}</strong>.</p>
     <p>Please log in to your dashboard to view details and join the call at the scheduled time.</p>`
  )

  revalidatePath("/dashboard")
  redirect("/dashboard?payment=success")
}
