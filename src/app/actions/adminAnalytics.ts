"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function getAdminAnalytics() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }

  // 1. Revenue Over Last 30 Days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const completedAppts = await prisma.appointment.findMany({
    where: {
      status: "COMPLETED",
      date: { gte: thirtyDaysAgo }
    },
    include: {
      doctor: { include: { doctorProfile: true } },
      prescription: true
    }
  })

  // Group by day for the line chart
  const revenueMap: Record<string, number> = {}
  
  completedAppts.forEach(app => {
    const dateStr = app.date.toISOString().split('T')[0]
    const consultationFee = app.doctor?.doctorProfile?.consultationFee || 0
    const medsCost = app.prescription?.totalCost || 0
    const total = consultationFee + medsCost
    
    if (!revenueMap[dateStr]) revenueMap[dateStr] = 0
    revenueMap[dateStr] += total
  })

  // Fill in empty days so the graph looks continuous
  const revenueData = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    revenueData.push({
      date: dateStr.split('-').slice(1).join('/'), // e.g., "06/13"
      revenue: revenueMap[dateStr] || 0
    })
  }

  // 2. Doctor Specialties Pie Chart
  const doctors = await prisma.doctorProfile.findMany()
  const specialtyMap: Record<string, number> = {}
  
  doctors.forEach(doc => {
    if (!specialtyMap[doc.specialty]) specialtyMap[doc.specialty] = 0
    specialtyMap[doc.specialty] += 1
  })

  const specialtyData = Object.entries(specialtyMap).map(([name, value]) => ({ name, value }))

  // 3. Peak Appointment Booking Hours Bar Chart
  const allAppts = await prisma.appointment.findMany({
    select: { time: true }
  })
  const hourMap: Record<string, number> = {}
  
  allAppts.forEach(app => {
    const hour = app.time.split(':')[0] + ":00"
    if (!hourMap[hour]) hourMap[hour] = 0
    hourMap[hour] += 1
  })

  // Sort hours chronologically
  const hourData = Object.entries(hourMap)
    .map(([hour, count]) => ({ hour, count }))
    .sort((a, b) => a.hour.localeCompare(b.hour))

  return { revenueData, specialtyData, hourData }
}
