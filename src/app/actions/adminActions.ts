"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function toggleDoctorStatus(doctorId: string, isActive: boolean) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized");

  await prisma.user.update({
    where: { id: doctorId },
    data: { isActive },
  });

  revalidatePath("/admin");
}

export async function deleteDoctor(doctorId: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized");

  // On delete cascade will handle deleting profile and related
  await prisma.user.delete({
    where: { id: doctorId },
  });

  revalidatePath("/admin");
}
