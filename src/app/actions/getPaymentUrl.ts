"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function getPaymentUrl(appointmentId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const appt = await prisma.appointment.findUnique({
    where: { id: appointmentId }
  })

  if (!appt || appt.patientId !== session.user.id) {
    throw new Error("Appointment not found")
  }

  if (!appt.stripeSessionId) {
    throw new Error("No payment session found")
  }

  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
  const stripeSession = await stripe.checkout.sessions.retrieve(appt.stripeSessionId)
  
  if (!stripeSession || !stripeSession.url) {
    throw new Error("Could not retrieve payment URL from Stripe")
  }

  return stripeSession.url
}
