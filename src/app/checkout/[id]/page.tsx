import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import MockCheckoutClient from "./MockCheckoutClient"

export default async function CheckoutPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  const appointmentId = resolvedParams.id
  
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { doctor: true }
  })

  if (!appointment) redirect("/dashboard")
  if (appointment.patientId !== session.user.id) redirect("/dashboard")
  
  if (appointment.status !== "AWAITING_PAYMENT") {
    redirect("/dashboard")
  }

  // Ensure lock has not expired
  if (appointment.lockedUntil && appointment.lockedUntil < new Date()) {
    // Lock expired! We should mark it as abandoned
    await prisma.appointment.update({
      where: { id: appointment.id },
      data: { status: "ABANDONED" }
    })
    redirect("/dashboard?payment=expired")
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f3f4f6", padding: "2rem 1rem" }}>
      <div style={{ maxWidth: "500px", width: "100%" }}>
        
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111827", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
            <span style={{ color: "#6366f1" }}>●</span> Secure Checkout
          </h1>
          <p style={{ color: "#6b7280", marginTop: "0.5rem" }}>Complete your booking for Dr. {appointment.doctor.name}</p>
        </div>

        <MockCheckoutClient 
          appointmentId={appointment.id} 
          amount={appointment.amount || 500} 
          date={appointment.date.toISOString().split('T')[0]}
          time={appointment.time}
        />
        
        <p style={{ textAlign: "center", marginTop: "2rem", fontSize: "0.875rem", color: "#9ca3af", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "1.2rem" }}>🔒</span> Mock Payment Gateway (Test Mode)
        </p>

      </div>
    </div>
  )
}
