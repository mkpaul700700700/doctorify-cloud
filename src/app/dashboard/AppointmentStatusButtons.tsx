"use client"

import { useState } from "react"
import { updateAppointmentStatus } from "@/app/actions/updateAppointmentStatus"
import { Check, X } from "lucide-react"

export default function AppointmentStatusButtons({ appointmentId }: { appointmentId: string }) {
  const [isUpdating, setIsUpdating] = useState(false)

  const handleUpdate = async (status: string) => {
    setIsUpdating(true)
    try {
      await updateAppointmentStatus(appointmentId, status)
    } catch (err) {
      alert("Failed to update status")
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div style={{ display: "flex", gap: "0.5rem" }}>
      <button 
        onClick={() => handleUpdate("CONFIRMED")} 
        disabled={isUpdating}
        className="btn btn-outline"
        style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem", color: "var(--primary)", borderColor: "var(--primary)", display: "flex", alignItems: "center", gap: "0.25rem" }}
      >
        <Check size={14} /> Confirm
      </button>
      <button 
        onClick={() => handleUpdate("CANCELLED")} 
        disabled={isUpdating}
        className="btn btn-outline"
        style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem", color: "var(--danger)", borderColor: "var(--danger)", display: "flex", alignItems: "center", gap: "0.25rem" }}
      >
        <X size={14} /> Decline
      </button>
    </div>
  )
}
