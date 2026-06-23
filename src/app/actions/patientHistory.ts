"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function getPatientHistory(patientId: string) {
  const session = await auth()
  if (!session?.user || session.user.role !== "DOCTOR") {
    throw new Error("Unauthorized")
  }

  // Fetch past appointments and their prescriptions
  const appointments = await prisma.appointment.findMany({
    where: { patientId, status: { in: ["COMPLETED", "CONFIRMED"] } },
    include: {
      doctor: { select: { name: true, doctorProfile: { select: { specialty: true } } } },
      prescription: { include: { items: true } }
    },
    orderBy: { date: "desc" }
  })

  // Fetch medical reports
  const reports = await prisma.medicalReport.findMany({
    where: { patientId },
    orderBy: { createdAt: "desc" }
  })

  // Fetch medical record (allergies, conditions)
  const record = await prisma.medicalRecord.findUnique({
    where: { patientId }
  })

  // Return structured data with serialized dates
  return {
    appointments: appointments.map(app => ({
      id: app.id,
      date: new Date(app.date).toISOString(),
      time: app.time,
      status: app.status,
      reason: app.reason,
      doctorName: app.doctor.name,
      doctorSpecialty: app.doctor.doctorProfile?.specialty,
      prescription: app.prescription ? {
        id: app.prescription.id,
        diagnosis: app.prescription.diagnosis,
        items: app.prescription.items.map(i => ({
          medicineName: i.medicineName,
          dosage: i.dosage,
          days: i.days
        })),
        createdAt: new Date(app.prescription.createdAt).toISOString(),
      } : null
    })),
    reports: reports.map(rep => ({
      id: rep.id,
      fileName: rep.fileName,
      fileUrl: rep.fileUrl,
      createdAt: new Date(rep.createdAt).toISOString()
    })),
    record: record ? {
      ...record,
      updatedAt: new Date(record.updatedAt).toISOString(),
      dob: record.dob ? new Date(record.dob).toISOString() : null,
      lastMenstrualPeriod: record.lastMenstrualPeriod ? new Date(record.lastMenstrualPeriod).toISOString() : null,
    } : null
  }
}
