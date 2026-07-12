"use client"

import { useState } from "react"
import { rescheduleAppointment } from "@/app/actions/rescheduleAppointment"
import { requestRefund } from "@/app/actions/requestRefund"
import { Calendar, RefreshCcw, Loader2 } from "lucide-react"

export default function PatientAppointmentActions({ appointment }: { appointment: any }) {
  const [isRescheduling, setIsRescheduling] = useState(false)
  const [isRefunding, setIsRefunding] = useState(false)

  const handleReschedule = async () => {
    if (!confirm("Are you sure you want to reschedule? This will use your 1 free reschedule and automatically book you for the doctor's last available slot tomorrow.")) return
    
    setIsRescheduling(true)
    try {
      const res = await rescheduleAppointment(appointment.id)
      alert(`Success! Your appointment has been rescheduled to ${res.newDate} at ${res.newTime}.`)
    } catch (err: any) {
      alert("Failed to reschedule: " + err.message)
    } finally {
      setIsRescheduling(false)
    }
  }

  const handleRefund = async () => {
    if (!confirm("Are you sure you want to request a refund for this cancelled appointment?")) return
    
    setIsRefunding(true)
    try {
      await requestRefund(appointment.id)
      alert("Refund requested successfully. It will be processed shortly.")
    } catch (err: any) {
      alert("Failed to request refund: " + err.message)
    } finally {
      setIsRefunding(false)
    }
  }

  // Determine what to show based on status
  if (appointment.status === "CANCELLED_EMERGENCY") {
    return (
      <div style={{ display: "flex", gap: "0.5rem" }}>
        {!appointment.refundRequested ? (
          <button 
            onClick={handleRefund} 
            disabled={isRefunding}
            className="btn" 
            style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem", backgroundColor: "#fef2f2", color: "#b91c1c", border: "1px solid #fca5a5", display: "flex", alignItems: "center", gap: "0.25rem" }}
          >
            {isRefunding ? <Loader2 size={14} className="spin" /> : <RefreshCcw size={14} />} Request Refund
          </button>
        ) : (
          <span style={{ fontSize: "0.8rem", color: "#b91c1c", padding: "0.3rem 0" }}>Refund Processing</span>
        )}
        
        <button 
          onClick={handleReschedule} 
          disabled={isRescheduling}
          className="btn btn-outline" 
          style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.25rem" }}
        >
          {isRescheduling ? <Loader2 size={14} className="spin" /> : <Calendar size={14} />} Reschedule
        </button>
      </div>
    )
  }

  // Awaiting Payment Logic (Resume Stripe Checkout)
  if (appointment.status === "AWAITING_PAYMENT") {
    return (
      <button 
        onClick={async () => {
          try {
            const { getPaymentUrl } = await import("@/app/actions/getPaymentUrl");
            const url = await getPaymentUrl(appointment.id);
            if (url) window.location.href = url;
          } catch (err: any) {
            alert("Failed to load payment page: " + err.message);
          }
        }}
        className="btn btn-primary" 
        style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.25rem" }}
      >
        Pay Now (Closes Soon)
      </button>
    )
  }

  // Normal Reschedule Logic
  if ((appointment.status === "PENDING" || appointment.status === "CONFIRMED") && appointment.rescheduleCount === 0) {
    return (
      <button 
        onClick={handleReschedule} 
        disabled={isRescheduling}
        className="btn btn-outline" 
        style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.25rem", color: "var(--text-color)", borderColor: "var(--border-color)" }}
      >
        {isRescheduling ? <Loader2 size={14} className="spin" /> : <Calendar size={14} />} Reschedule (1 Free)
      </button>
    )
  }

  return null
}
