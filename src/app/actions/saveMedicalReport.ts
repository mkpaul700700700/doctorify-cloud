"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function saveMedicalReport({ fileUrl, fileName, fileType }: { fileUrl: string, fileName: string, fileType: string }) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "PATIENT") {
    throw new Error("Unauthorized");
  }

  await prisma.medicalReport.create({
    data: {
      patientId: session.user.id,
      fileUrl,
      fileName,
      fileType,
    }
  });

  revalidatePath("/dashboard");
}

export async function deleteMedicalReport(reportId: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "PATIENT") {
    throw new Error("Unauthorized");
  }

  // Ensure they own it
  const report = await prisma.medicalReport.findUnique({ where: { id: reportId } });
  if (report?.patientId !== session.user.id) throw new Error("Unauthorized");

  await prisma.medicalReport.delete({
    where: { id: reportId }
  });

  revalidatePath("/dashboard");
}
