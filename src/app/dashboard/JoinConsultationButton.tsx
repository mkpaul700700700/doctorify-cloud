"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Video } from "lucide-react"

export default function JoinConsultationButton({ appointmentId, dateStr, timeStr }: { appointmentId: string, dateStr: string, timeStr: string }) {
  const [canJoin, setCanJoin] = useState(false)
  const [statusText, setStatusText] = useState("Checking time...")

  useEffect(() => {
    // We use UTC date to avoid timezone issues, but timeStr is "HH:MM" local to the clinic
    // Assume appointments are booked in the local timezone of the user
    // The date passed from DB is UTC midnight. We should combine them strictly.
    const [year, month, day] = dateStr.split("T")[0].split("-").map(Number)
    const [hour, min] = timeStr.split(":").map(Number)
    
    // Construct exact start time
    const startObj = new Date(year, month - 1, day, hour, min, 0)
    const endObj = new Date(year, month - 1, day, hour, min + 15, 0) // 15 mins exact

    const checkTime = () => {
      const now = new Date()
      
      if (now >= startObj && now <= endObj) {
        setCanJoin(true)
        setStatusText("")
      } else if (now > endObj) {
        setCanJoin(false)
        setStatusText("Window Closed")
      } else {
        setCanJoin(false)
        
        // Calculate time remaining for user feedback
        const diffMs = startObj.getTime() - now.getTime()
        if (diffMs > 0 && diffMs < 60 * 60 * 1000) { // less than 1 hour
          const diffMins = Math.ceil(diffMs / 60000)
          setStatusText(`Starts in ${diffMins} min`)
        } else {
          setStatusText("Not started yet")
        }
      }
    }

    checkTime()
    const interval = setInterval(checkTime, 10000) // check every 10 seconds
    return () => clearInterval(interval)
  }, [dateStr, timeStr])

  if (canJoin) {
    return (
      <Link href={`/call/${appointmentId}`} className="btn btn-primary" style={{ display: "flex", gap: "0.5rem", alignItems: "center", backgroundColor: "#10b981", borderColor: "#10b981" }}>
        <Video size={18} /> Join Consultation
      </Link>
    )
  }

  return (
    <button disabled className="btn btn-secondary" style={{ display: "flex", gap: "0.5rem", alignItems: "center", opacity: 0.7 }}>
      <Video size={18} /> {statusText}
    </button>
  )
}
