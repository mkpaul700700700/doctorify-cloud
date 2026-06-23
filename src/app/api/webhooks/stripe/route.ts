import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendNotificationEmail } from "@/lib/email"
import Stripe from "stripe"

export async function POST(req: Request) {
  const payload = await req.text()
  const sig = req.headers.get("stripe-signature")

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: "2024-11-20.acacia"
  })

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      payload,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET as string
    )
  } catch (err: any) {
    console.error("Webhook Error:", err.message)
    // Accept it anyway if STRIPE_WEBHOOK_SECRET is empty for local testing
    // To strictly enforce in prod, remove the fallback below
    if (process.env.STRIPE_WEBHOOK_SECRET) {
       return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
    } else {
       event = JSON.parse(payload) as Stripe.Event
    }
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session

    const appointmentId = session.metadata?.appointmentId

    if (appointmentId) {
      // 1. Update Appointment Status
      const appointment = await prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          paymentStatus: "PAID",
          status: "CONFIRMED"
        },
        include: {
          doctor: true,
          patient: true
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
    }
  }

  return NextResponse.json({ received: true }, { status: 200 })
}
