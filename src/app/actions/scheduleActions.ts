"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

export async function saveDoctorSchedule(formData: FormData) {
  const session = await auth()
  if (session?.user?.role !== "DOCTOR" || !session.user.id) throw new Error("Unauthorized")

  const dayOfWeek = parseInt(formData.get("dayOfWeek") as string)
  const startTime = (formData.get("startTime") as string) || "00:00"
  const endTime = (formData.get("endTime") as string) || "00:00"
  const isOffDay = formData.get("isOffDay") === "true"

  await prisma.doctorSchedule.upsert({
    where: {
      doctorId_dayOfWeek: {
        doctorId: session.user.id,
        dayOfWeek
      }
    },
    update: {
      startTime,
      endTime,
      isOffDay
    },
    create: {
      doctorId: session.user.id,
      dayOfWeek,
      startTime,
      endTime,
      isOffDay
    }
  })

  revalidatePath("/dashboard")
}

export async function saveSpecialSchedule(formData: FormData) {
  const session = await auth()
  if (session?.user?.role !== "DOCTOR" || !session.user.id) throw new Error("Unauthorized")

  const dateStr = formData.get("date") as string
  if (!dateStr) throw new Error("Date required")
  
  const date = new Date(dateStr)
  const startTime = (formData.get("startTime") as string) || "00:00"
  const endTime = (formData.get("endTime") as string) || "00:00"
  const isOffDay = formData.get("isOffDay") === "true"

  await prisma.specialSchedule.upsert({
    where: {
      doctorId_date: {
        doctorId: session.user.id,
        date
      }
    },
    update: {
      startTime,
      endTime,
      isOffDay
    },
    create: {
      doctorId: session.user.id,
      date,
      startTime,
      endTime,
      isOffDay
    }
  })

  revalidatePath("/dashboard")
}

export async function deleteSpecialSchedule(id: string) {
  const session = await auth()
  if (session?.user?.role !== "DOCTOR" || !session.user.id) throw new Error("Unauthorized")

  await prisma.specialSchedule.delete({
    where: { id }
  })

  revalidatePath("/dashboard")
}
