import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const resolvedParams = await params
    const appointmentId = resolvedParams.id

    const messages = await prisma.appointmentMessage.findMany({
      where: { appointmentId },
      orderBy: { createdAt: "asc" },
      include: {
        sender: {
          select: { id: true, name: true, role: true }
        }
      }
    })

    return NextResponse.json({ messages })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const resolvedParams = await params
    const appointmentId = resolvedParams.id
    
    const body = await req.json()
    if (!body.content || !body.content.trim()) {
      return NextResponse.json({ error: "Message content required" }, { status: 400 })
    }

    const message = await prisma.appointmentMessage.create({
      data: {
        appointmentId,
        senderId: session.user.id,
        content: body.content.trim()
      },
      include: {
        sender: {
          select: { id: true, name: true, role: true }
        }
      }
    })

    return NextResponse.json({ message }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}
