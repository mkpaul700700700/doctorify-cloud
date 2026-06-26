"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { sendNotificationEmail } from "@/lib/email"

export async function bookAppointment(formData: FormData) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      throw new Error("You must be logged in to book an appointment")
    }

  const doctorId = formData.get("doctorId") as string
  const dateStr = formData.get("date") as string
  const time = formData.get("time") as string
  const reason = formData.get("reason") as string

  if (!doctorId || !dateStr || !time || !reason) {
    throw new Error("Missing required fields")
  }

  // 8.2 Mandatory Profile Check
  const medicalRecord = await prisma.medicalRecord.findUnique({
    where: { patientId: session.user.id }
  })

  const isComplete = medicalRecord && 
    medicalRecord.dob && 
    medicalRecord.gender && 
    medicalRecord.bloodGroup && 
    medicalRecord.emergencyPhone;

  if (!isComplete) {
    throw new Error("You must complete your Medical Profile before booking an appointment. Go to your Dashboard to fill it out.")
  }

  const date = new Date(dateStr)
  // 16. Booking Lock & Stripe Checkout Session
  const doctorProfile = await prisma.doctorProfile.findUnique({
    where: { userId: doctorId },
    include: { user: true }
  })

  if (!doctorProfile) throw new Error("Doctor not found")
  
  const fee = doctorProfile.consultationFee > 0 ? doctorProfile.consultationFee : 15 // fallback to 15 USD if zero

  const checkoutUrl = await prisma.$transaction(async (tx) => {
    // 1. Lock the appointment slot logic by checking existing non-cancelled appointments
    const startOfDay = new Date(date)
    startOfDay.setUTCHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setUTCHours(23, 59, 59, 999)

    const existingAppts = await tx.appointment.findMany({
      where: {
        doctorId,
        date: { gte: startOfDay, lte: endOfDay },
        time,
        status: { notIn: ["CANCELLED", "CANCELLED_CONFLICT", "ABANDONED"] }
      }
    })

    const hasActiveLock = existingAppts.some(app => {
      if (app.status === "CONFIRMED" || app.status === "COMPLETED" || app.paymentStatus === "PAID") return true
      if (app.status === "AWAITING_PAYMENT" && app.lockedUntil && app.lockedUntil > new Date()) return true
      return false
    })

    if (hasActiveLock) {
      throw new Error("This slot is currently being booked by another patient. Please try another time.")
    }

    // 2. Create the new appointment with a 10-minute lock
    const lockedUntil = new Date(Date.now() + 10 * 60 * 1000)
    
    const newAppt = await tx.appointment.create({
      data: {
        patientId: session.user.id,
        doctorId,
        date,
        time,
        reason,
        amount: fee,
        status: "AWAITING_PAYMENT",
        paymentStatus: "UNPAID",
        lockedUntil
      },
      include: {
        doctor: true,
        patient: true
      }
    })

    // 3. Create Stripe Checkout Session
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
    
    // In production, we'd use the actual base URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL 
      || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null) 
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
      || 'http://localhost:3000'
    
    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Consultation with Dr. ${doctorProfile.user.name}`,
              description: `Date: ${dateStr} at ${time}`,
            },
            unit_amount: Math.round(fee * 100), // Stripe expects amounts in cents/paisa
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/dashboard?payment=cancelled`,
      client_reference_id: newAppt.id,
      metadata: {
        appointmentId: newAppt.id,
        doctorId,
        patientId: session.user.id
      },
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60) // Stripe minimum is 30 mins
    })

    await tx.appointment.update({
      where: { id: newAppt.id },
      data: { stripeSessionId: stripeSession.id }
    })

    return stripeSession.url
  }, {
    isolationLevel: 'Serializable', // Ensures absolute sequential execution to prevent race conditions
    maxWait: 5000,
    timeout: 10000
  })

    return { url: checkoutUrl }
  } catch (err: any) {
    return { error: err.message || "Failed to book appointment" }
  }
}
