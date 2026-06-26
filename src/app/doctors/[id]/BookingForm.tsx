"use client"

import { useState, useEffect } from "react"
import { bookAppointment } from "@/app/actions/bookAppointment"
import styles from "./page.module.css"
import { Loader2 } from "lucide-react"

export default function BookingForm({ doctorId, isLoggedIn }: { doctorId: string, isLoggedIn: boolean }) {
  const [date, setDate] = useState("")
  const [selectedTime, setSelectedTime] = useState("")
  const [reason, setReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const [slots, setSlots] = useState<{ time: string, available: boolean }[]>([])
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)

  // Fetch slots when date changes
  useEffect(() => {
    if (!date) {
      setSlots([])
      setSelectedTime("")
      return
    }

    const fetchSlots = async () => {
      setIsLoadingSlots(true)
      setSelectedTime("") // Reset selected time when date changes
      try {
        const res = await fetch(`/api/doctors/${doctorId}/slots?date=${date}`)
        const data = await res.json()
        if (data.slots) {
          setSlots(data.slots)
        } else {
          setSlots([])
        }
      } catch (err) {
        console.error("Failed to fetch slots")
        setSlots([])
      } finally {
        setIsLoadingSlots(false)
      }
    }

    fetchSlots()
  }, [date, doctorId])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!isLoggedIn) {
      window.location.href = "/login"
      return
    }
    
    setIsSubmitting(true)
    setError("")

    const formData = new FormData()
    formData.append("doctorId", doctorId)
    formData.append("date", date)
    formData.append("time", selectedTime)
    formData.append("reason", reason)

    try {
      const result = await bookAppointment(formData)
      if (result?.error) {
        setError(result.error)
        setIsSubmitting(false)
        return
      }
      if (result?.url) {
        window.location.href = result.url
        return
      }
    } catch (err: any) {
      setError(err.message || "Failed to book appointment")
      setIsSubmitting(false)
    }
  }

  const nowForDate = new Date()
  const localToday = new Date(nowForDate.getTime() - (nowForDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0]

  return (
    <form className={styles.bookingForm} onSubmit={handleSubmit}>
      <h3 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1.5rem" }}>Book Appointment</h3>
      
      {error && <div style={{ color: "var(--danger)", marginBottom: "1rem", fontSize: "0.875rem", padding: "0.5rem", backgroundColor: "rgba(239, 68, 68, 0.1)", borderRadius: "var(--radius-sm)" }}>{error}</div>}

      <div className="input-group">
        <label className="input-label" htmlFor="date">Select Date</label>
        <input 
          type="date" 
          id="date" 
          required 
          className="input-field" 
          value={date}
          onChange={e => setDate(e.target.value)}
          min={localToday}
        />
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <label className="input-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <span>Select Time Slot</span>
          {isLoadingSlots && <Loader2 className="spin" size={16} style={{ color: "var(--primary)" }} />}
        </label>
        
        {date && !isLoadingSlots && slots.length === 0 ? (
          <div style={{ color: "var(--danger)", fontSize: "0.85rem", padding: "1rem", backgroundColor: "rgba(239, 68, 68, 0.1)", borderRadius: "var(--radius-sm)" }}>
            No slots available on this date. Doctor may be off.
          </div>
        ) : (
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", 
            gap: "0.5rem",
            maxHeight: "220px",
            overflowY: "auto",
            paddingRight: "0.5rem"
          }}>
            {slots.map(slot => {
              const [h, m] = slot.time.split(":")
              const hourNum = parseInt(h)
              const minuteNum = parseInt(m)
              
              // Client-side past time check
              const now = new Date()
              let isPastLocally = false
              
              if (date === localToday) {
                const currentHour = now.getHours()
                const currentMinute = now.getMinutes()
                
                // A slot is considered passed locally if current time is past its 15-min end time
                const slotEndTotalMins = hourNum * 60 + minuteNum + 15
                const currentTotalMins = currentHour * 60 + currentMinute
                
                if (currentTotalMins >= slotEndTotalMins) {
                  isPastLocally = true
                }
              }

              const isAvailable = slot.available && !isPastLocally

              const ampm = hourNum >= 12 ? 'PM' : 'AM'
              const displayH = hourNum % 12 || 12
              const isSelected = selectedTime === slot.time
              
              return (
                <button
                  key={slot.time}
                  type="button"
                  disabled={!isAvailable}
                  onClick={() => setSelectedTime(slot.time)}
                  style={{
                    padding: "0.6rem 0.25rem",
                    borderRadius: "6px",
                    border: isSelected ? "2px solid #0284c7" : "1px solid var(--border-color)",
                    backgroundColor: isAvailable 
                      ? (isSelected ? "#e0f2fe" : "#dcfce7") 
                      : "#fee2e2", 
                    color: isAvailable ? (isSelected ? "#0369a1" : "#166534") : "#991b1b",
                    cursor: isAvailable ? "pointer" : "not-allowed",
                    fontSize: "0.85rem",
                    fontWeight: isSelected ? "700" : "500",
                    transition: "all 0.2s",
                    textDecoration: !isAvailable ? "line-through" : "none",
                    opacity: !isAvailable ? 0.7 : 1
                  }}
                >
                  {displayH}:{m} {ampm}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {selectedTime && (
        <div style={{ backgroundColor: "#f8fafc", padding: "1rem", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "1.5rem", textAlign: "center" }}>
          <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Reserved Slot</p>
          <p style={{ fontSize: "1.1rem", fontWeight: 600, color: "#0f172a" }}>
            {(() => {
              const [h, m] = selectedTime.split(":");
              const hourNum = parseInt(h);
              const ampm = hourNum >= 12 ? 'PM' : 'AM';
              const displayH = hourNum % 12 || 12;
              
              const totalMins = hourNum * 60 + parseInt(m) + 15;
              const endH = Math.floor(totalMins / 60);
              const endM = (totalMins % 60).toString().padStart(2, '0');
              const endAmpm = endH >= 12 ? 'PM' : 'AM';
              const endDisplayH = endH % 12 || 12;

              return `${displayH}:${m} ${ampm} - ${endDisplayH}:${endM} ${endAmpm}`;
            })()}
          </p>
        </div>
      )}

      <div className="input-group">
        <label className="input-label" htmlFor="reason">Reason for Visit</label>
        <textarea 
          id="reason" 
          required 
          className="input-field" 
          style={{ minHeight: "100px", resize: "vertical" }}
          placeholder="Please describe your symptoms..."
          value={reason}
          onChange={e => setReason(e.target.value)}
        ></textarea>
      </div>

      <button 
        type="submit" 
        className="btn btn-primary" 
        style={{ width: "100%" }}
        disabled={!date || !selectedTime || !reason || isSubmitting}
      >
        {isSubmitting ? "Processing Transaction..." : "Confirm Booking"}
      </button>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        
        /* Custom scrollbar for slots */
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}} />
    </form>
  )
}
