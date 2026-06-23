"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

export async function updateMedicalRecord(formData: FormData) {
  const session = await auth()
  
  if (session?.user?.role !== "PATIENT" || !session.user.id) {
    throw new Error("Only patients can update medical records")
  }

  const data = {
    dob: formData.get("dob") ? new Date(formData.get("dob") as string) : null,
    gender: formData.get("gender") as string,
    phone: formData.get("phone") as string,
    address: formData.get("address") as string,

    emergencyName: formData.get("emergencyName") as string,
    emergencyRelation: formData.get("emergencyRelation") as string,
    emergencyPhone: formData.get("emergencyPhone") as string,

    bloodGroup: formData.get("bloodGroup") as string,
    rhFactor: formData.get("rhFactor") as string,
    height: formData.get("height") as string,
    weight: formData.get("weight") as string,

    allergies: formData.get("allergies") as string,
    conditions: formData.get("conditions") as string,
    currentMedications: formData.get("currentMedications") as string, // Expect JSON string
    pastSurgeries: formData.get("pastSurgeries") as string,
    familyHistory: formData.get("familyHistory") as string,

    smokingStatus: formData.get("smokingStatus") as string,
    alcoholStatus: formData.get("alcoholStatus") as string,
    exerciseStatus: formData.get("exerciseStatus") as string,

    isPregnant: formData.get("isPregnant") === "true",
    isBreastfeeding: formData.get("isBreastfeeding") === "true",
    lastMenstrualPeriod: formData.get("lastMenstrualPeriod") ? new Date(formData.get("lastMenstrualPeriod") as string) : null,

    patientNotes: formData.get("patientNotes") as string,
  }

  await prisma.medicalRecord.upsert({
    where: { patientId: session.user.id },
    update: data,
    create: {
      patientId: session.user.id,
      ...data
    }
  })

  revalidatePath("/dashboard")
  return { success: true }
}
