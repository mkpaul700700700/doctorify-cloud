import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendNotificationEmail } from "@/lib/email"

export async function GET() {
  try {
    const now = new Date()
    
    // TASK A: 5-Minute Appointment Reminders
    // Look for appointments that are CONFIRMED and starting in exactly 5 minutes
    const fiveMinsFromNow = new Date(now.getTime() + 5 * 60000)
    const fiveMinsStart = new Date(fiveMinsFromNow)
    fiveMinsStart.setSeconds(0, 0)
    const fiveMinsEnd = new Date(fiveMinsFromNow)
    fiveMinsEnd.setSeconds(59, 999)

    // Convert to YYYY-MM-DD and HH:MM format used in our DB
    const dateStr = fiveMinsStart.toISOString().split('T')[0]
    const timeStr = `${String(fiveMinsStart.getHours()).padStart(2, '0')}:${String(fiveMinsStart.getMinutes()).padStart(2, '0')}`

    // Note: In SQLite, date is stored as DateTime (UTC midnight). 
    // For exact minute matching, it's easier to pull today's appointments and filter in memory since time is a string.
    const today = new Date()
    today.setUTCHours(0,0,0,0)

    const upcomingAppointments = await prisma.appointment.findMany({
      where: {
        status: "CONFIRMED",
        date: today,
        time: timeStr
      },
      include: { patient: true, doctor: true }
    })

    for (const appt of upcomingAppointments) {
      // Create In-App Notif
      await prisma.inAppNotification.create({
        data: {
          userId: appt.patientId,
          message: `Reminder: Your appointment with ${appt.doctor.name} starts in 5 minutes!`
        }
      })
      
      // Email Notif
      await sendNotificationEmail(
        appt.patient.name || "Patient",
        appt.patient.email || "",
        "Appointment Starting Soon!",
        `<p>Your appointment with <strong>${appt.doctor.name}</strong> is starting in exactly 5 minutes.</p>
         <p>Please log in to your dashboard to join the consultation.</p>`
      )
    }

    // TASK B: 1-Day Revisit Reminders
    // Look for prescriptions where revisitDays is not null
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    oneDayFromNow.setUTCHours(0,0,0,0) // Tomorrow midnight

    // We have to pull prescriptions with revisitDays and check if their target date matches tomorrow
    const prescriptions = await prisma.prescription.findMany({
      where: {
        revisitDays: { not: null }
      },
      include: {
        appointment: {
          include: { patient: true, doctor: true }
        }
      }
    })

    for (const rx of prescriptions) {
      if (rx.revisitDays) {
        // Calculate the exact revisit date
        const targetDate = new Date(rx.createdAt)
        targetDate.setDate(targetDate.getDate() + rx.revisitDays)
        targetDate.setUTCHours(0,0,0,0)

        // If the target revisit date is exactly 1 day from now (tomorrow)
        if (targetDate.getTime() === oneDayFromNow.getTime()) {
          // Check if we already sent a notification (we can check InAppNotif to avoid spam)
          // For simplicity, we just send it. In production we'd add a "reminderSent" flag to Prescription.
          
          await prisma.inAppNotification.create({
            data: {
              userId: rx.appointment.patientId,
              message: `Revisit Reminder: Dr. ${rx.appointment.doctor.name} recommended you schedule a follow-up visit tomorrow.`
            }
          })

          await sendNotificationEmail(
            rx.appointment.patient.name || "Patient",
            rx.appointment.patient.email || "",
            "Follow-up Visit Reminder",
            `<p>This is a reminder that <strong>Dr. ${rx.appointment.doctor.name}</strong> recommended a follow-up visit for tomorrow.</p>
             <p>Please log in to Doctorify to book your next slot.</p>`
          )
        }
      }
    }

    return NextResponse.json({ success: true, processedReminders: upcomingAppointments.length, processedRevisits: prescriptions.length })
  } catch (err) {
    console.error("Cron Error:", err)
    return NextResponse.json({ error: "Failed to process cron jobs" }, { status: 500 })
  }
}
