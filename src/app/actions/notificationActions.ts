"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

export async function markNotificationAsRead(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  await prisma.inAppNotification.update({
    where: { id, userId: session.user.id },
    data: { isRead: true }
  })
  
  revalidatePath("/dashboard")
}

export async function markAllNotificationsAsRead() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  await prisma.inAppNotification.updateMany({
    where: { userId: session.user.id, isRead: false },
    data: { isRead: true }
  })
  
  revalidatePath("/dashboard")
}
