import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
    const doctorId = resolvedParams.id
    
    const { searchParams } = new URL(req.url)
    const dateStr = searchParams.get("date")
    
    if (!dateStr) return NextResponse.json({ error: "Date required" }, { status: 400 })

    const date = new Date(dateStr)
    
    // Parse the date as LOCAL date (not UTC midnight) to get the correct day of week.
    // "new Date('2026-07-12')" gives UTC midnight which shifts the day in UTC+6 timezone.
    const [year, month, day] = dateStr.split("-").map(Number)
    const localDate = new Date(year, month - 1, day) // local midnight
    const dayOfWeek = localDate.getDay()

    // 1. Check Special Schedule
    const specialSchedule = await prisma.specialSchedule.findUnique({
      where: { doctorId_date: { doctorId, date } }
    })

    let startTimeStr = ""
    let endTimeStr = ""

    if (specialSchedule) {
      if (specialSchedule.isOffDay) return NextResponse.json({ slots: [] })
      startTimeStr = specialSchedule.startTime
      endTimeStr = specialSchedule.endTime
    } else {
      // 2. Check Regular Schedule
      const regularSchedule = await prisma.doctorSchedule.findUnique({
        where: { doctorId_dayOfWeek: { doctorId, dayOfWeek } }
      })
      if (regularSchedule) {
        if (regularSchedule.isOffDay) return NextResponse.json({ slots: [] })
        startTimeStr = regularSchedule.startTime
        endTimeStr = regularSchedule.endTime
      } else {
        // Fallback to doctor's default profile settings if no schedule record exists
        const doctorProfile = await prisma.doctorProfile.findUnique({
          where: { userId: doctorId }
        })
        if (!doctorProfile) return NextResponse.json({ slots: [] })
        
        const daysMap = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const dayName = daysMap[dayOfWeek];
        if (!doctorProfile.availableDays.includes(dayName)) {
            return NextResponse.json({ slots: [] })
        }
        
        const [start, end] = doctorProfile.workingHours.split("-");
        if (!start || !end) return NextResponse.json({ slots: [] })
        
        startTimeStr = start;
        endTimeStr = end;
      }
    }

    // Generate 15-min intervals
    const [startH, startM] = startTimeStr.split(":").map(Number)
    const [endH, endM] = endTimeStr.split(":").map(Number)
    
    let currentMin = startH * 60 + startM
    const endTotalMin = endH * 60 + endM

    const allSlots = []
    while (currentMin + 15 <= endTotalMin) { // ensure the 15 min slot fits
      const h = Math.floor(currentMin / 60)
      const m = currentMin % 60
      allSlots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`)
      currentMin += 15
    }

    // 3. Remove booked slots
    // Since appointments are exact matches of "HH:MM", we fetch all for this date
    // Note: Appointments in DB save the date at midnight UTC usually.
    // To be safe, query between start of day and end of day.
    const startOfDay = new Date(date)
    startOfDay.setUTCHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setUTCHours(23, 59, 59, 999)

    const bookedAppointments = await prisma.appointment.findMany({
      where: {
        doctorId,
        date: { gte: startOfDay, lte: endOfDay },
        status: { notIn: ["CANCELLED", "CANCELLED_CONFLICT", "ABANDONED"] }
      },
      select: { time: true, status: true, lockedUntil: true, paymentStatus: true }
    })

    const bookedTimes = new Set()
    for (const app of bookedAppointments) {
      let isActive = false
      if (app.status === "CONFIRMED" || app.status === "COMPLETED" || app.paymentStatus === "PAID") isActive = true
      if (app.status === "AWAITING_PAYMENT" && app.lockedUntil && app.lockedUntil > new Date()) isActive = true
      if (app.status === "PENDING") isActive = true // Fallback for old records
      if (isActive) bookedTimes.add(app.time)
    }

    const now = new Date()

    const slotsWithStatus = allSlots.map(slot => {
      const slotDateTime = new Date(`${dateStr}T${slot}:00`)
      // A slot is only considered past if its entire 15-minute duration is over
      const slotEndTime = new Date(slotDateTime.getTime() + 15 * 60000)
      const isPast = slotEndTime <= now

      return {
        time: slot,
        available: !bookedTimes.has(slot) && !isPast
      }
    })

    return NextResponse.json({ slots: slotsWithStatus })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
