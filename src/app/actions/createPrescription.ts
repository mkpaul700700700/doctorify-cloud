"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

export async function createPrescription(formData: FormData) {
  const session = await auth()
  
  if (session?.user?.role !== "DOCTOR") {
    throw new Error("Only doctors can create prescriptions")
  }

  const appointmentId = formData.get("appointmentId") as string
  const instructions = formData.get("instructions") as string
  const diagnosis = formData.get("diagnosis") as string
  const tests = formData.get("tests") as string
  const revisitDays = formData.get("revisitDays") ? parseInt(formData.get("revisitDays") as string) : null
  const itemsJson = formData.get("items") as string

  if (!appointmentId || !itemsJson) {
    throw new Error("Missing required fields")
  }

  const items = JSON.parse(itemsJson)

  // Ensure appointment exists and belongs to this doctor
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId }
  })

  if (!appointment || appointment.doctorId !== session.user.id) {
    throw new Error("Invalid appointment")
  }

  // Calculate total prescription cost
  let grandTotal = 0;
  for (const item of items) {
    if (item.totalCost) {
      grandTotal += parseFloat(item.totalCost);
    }
  }

  const itemsData = items.map((item: any) => ({
    medicineName: item.medicineName,
    type: item.type || "Medicine",
    dosage: item.dosage,
    days: parseInt(item.days) || 0,
    unitPrice: item.unitPrice ? parseFloat(item.unitPrice) : null,
    totalCost: item.totalCost ? parseFloat(item.totalCost) : null
  }));

  await prisma.prescription.upsert({
    where: { appointmentId },
    update: {
      instructions,
      diagnosis,
      tests,
      revisitDays,
      totalCost: grandTotal,
      items: {
        deleteMany: {}, // Remove old items
        create: itemsData
      }
    },
    create: {
      appointmentId,
      instructions,
      diagnosis,
      tests,
      revisitDays,
      totalCost: grandTotal,
      items: {
        create: itemsData
      }
    }
  })

  // Mark appointment as COMPLETED
  if (appointment.status !== "COMPLETED") {
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: "COMPLETED" }
    })
  }

  revalidatePath("/dashboard")
  revalidatePath(`/call/${appointmentId}`)
  return { success: true }
}
