"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { sendNotificationEmail } from "@/lib/email"

export async function rescheduleAppointment(appointmentId: string) {
  const session = await auth()
  if (!session?.user || session.user.role !== "PATIENT") {
    throw new Error("Only patients can reschedule appointments")
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { doctor: true, patient: true }
  })

  if (!appointment || appointment.patientId !== session.user.id) {
    throw new Error("Invalid appointment")
  }

  if (appointment.status !== "CANCELLED_EMERGENCY" && appointment.rescheduleCount >= 1) {
    throw new Error("You have already used your one free reschedule.")
  }

  if (appointment.status === "COMPLETED" || appointment.status === "CANCELLED") {
    throw new Error("Cannot reschedule this appointment.")
  }

  // Calculate target date (tomorrow)
  const targetDate = new Date(appointment.date)
  targetDate.setDate(targetDate.getDate() + 1)
  targetDate.setUTCHours(0, 0, 0, 0)
  
  const dayOfWeek = targetDate.getUTCDay()
  
  const specialSchedule = await prisma.specialSchedule.findUnique({
    where: { doctorId_date: { doctorId: appointment.doctorId, date: targetDate } }
  })
  
  let isOffDay = false
  let startTimeStr = "09:00"
  let endTimeStr = "17:00"

  if (specialSchedule) {
    isOffDay = specialSchedule.isOffDay
    startTimeStr = specialSchedule.startTime
    endTimeStr = specialSchedule.endTime
  } else {
    const regularSchedule = await prisma.doctorSchedule.findUnique({
      where: { doctorId_dayOfWeek: { doctorId: appointment.doctorId, dayOfWeek } }
    })
    if (regularSchedule) {
      isOffDay = regularSchedule.isOffDay
      startTimeStr = regularSchedule.startTime
      endTimeStr = regularSchedule.endTime
    }
  }

  if (isOffDay) {
    throw new Error("The doctor is not working tomorrow. Please book a new slot manually.")
  }

  // Generate all 15-min slots
  const slots: string[] = []
  const [startH, startM] = startTimeStr.split(":").map(Number)
  const [endH, endM] = endTimeStr.split(":").map(Number)
  
  let currentMins = startH * 60 + startM
  const endMins = endH * 60 + endM
  
  while (currentMins + 15 <= endMins) {
    const h = Math.floor(currentMins / 60)
    const m = currentMins % 60
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    currentMins += 15
  }

  const startOfDay = new Date(targetDate)
  startOfDay.setUTCHours(0, 0, 0, 0)
  const endOfDay = new Date(targetDate)
  endOfDay.setUTCHours(23, 59, 59, 999)

  const bookedAppts = await prisma.appointment.findMany({
    where: {
      doctorId: appointment.doctorId,
      date: { gte: startOfDay, lte: endOfDay },
      status: { in: ["PENDING", "CONFIRMED"] }
    }
  })

  const bookedTimes = bookedAppts.map(a => a.time)
  const availableSlots = slots.filter(s => !bookedTimes.includes(s))

  if (availableSlots.length === 0) {
    throw new Error("The doctor is fully booked tomorrow. Please book a new slot manually.")
  }

  // Grab the absolute LAST available slot
  const newTime = availableSlots[availableSlots.length - 1]

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      date: targetDate,
      time: newTime,
      status: "PENDING", 
      rescheduleCount: appointment.rescheduleCount + 1,
      notes: "Automatically rescheduled by patient."
    }
  })

  await prisma.inAppNotification.create({
    data: {
      userId: appointment.doctorId,
      message: `Patient ${appointment.patient.name} has rescheduled their appointment to ${targetDate.toISOString().split('T')[0]} at ${newTime}.`
    }
  })

  await sendNotificationEmail(
    appointment.doctor.name || "Doctor",
    appointment.doctor.email || "",
    "Appointment Rescheduled",
    `<p>Patient <strong>${appointment.patient.name}</strong> has successfully used their auto-reschedule option.</p>
     <p>The new appointment time is: <strong>${targetDate.toISOString().split('T')[0]} at ${newTime}</strong>.</p>
     <p>Please log in to confirm the new slot.</p>`
  )

  revalidatePath("/dashboard")
  return { success: true, newDate: targetDate.toISOString().split('T')[0], newTime }
}
