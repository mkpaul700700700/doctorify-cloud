"use client"

import { useState, useTransition } from "react"
import { saveDoctorSchedule, saveSpecialSchedule, deleteSpecialSchedule } from "@/app/actions/scheduleActions"
import { emergencyCancel } from "@/app/actions/emergencyCancel"
import { Calendar, Clock, Loader2, Trash2, AlertTriangle } from "lucide-react"

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

export default function ScheduleManager({ regularSchedules, specialSchedules }: { regularSchedules: any[], specialSchedules: any[] }) {
  const [isPending, startTransition] = useTransition()
  const [isEmergencyPending, setIsEmergencyPending] = useState(false)

  const handleRegularSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      await saveDoctorSchedule(formData)
    })
  }

  const handleSpecialSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      await saveSpecialSchedule(formData)
      // reset form manually if needed
    })
  }

  const handleDeleteSpecial = (id: string) => {
    startTransition(async () => {
      await deleteSpecialSchedule(id)
    })
  }

  const handleEmergency = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const date = formData.get("date") as string
    
    if (!confirm(`Are you absolutely sure you want to declare an EMERGENCY for ${date}? This will cancel ALL appointments for that day and notify patients immediately.`)) {
      return
    }

    setIsEmergencyPending(true)
    try {
      const res = await emergencyCancel(date)
      alert(`Emergency declared. ${res.count} appointments cancelled. Patients notified.`)
      // Refresh page
      window.location.reload()
    } catch (err: any) {
      alert("Failed to declare emergency: " + err.message)
    } finally {
      setIsEmergencyPending(false)
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      
      {/* Recurring Weekly Schedule */}
      <div style={{ backgroundColor: "var(--background)", padding: "1.5rem", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
        <h3 style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Clock size={20} color="var(--primary)" /> Recurring Weekly Schedule
        </h3>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {DAYS.map((day, index) => {
            const current = regularSchedules.find(s => s.dayOfWeek === index)
            return (
              <form key={day} onSubmit={handleRegularSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto auto", gap: "1rem", alignItems: "center", borderBottom: "1px solid #f0f0f0", paddingBottom: "0.5rem" }}>
                <input type="hidden" name="dayOfWeek" value={index} />
                
                <div style={{ fontWeight: 500, width: "100px" }}>{day}</div>
                
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <input type="time" name="startTime" className="input-field" defaultValue={current?.startTime || "09:00"} required={!current?.isOffDay} disabled={current?.isOffDay} />
                </div>
                
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <input type="time" name="endTime" className="input-field" defaultValue={current?.endTime || "17:00"} required={!current?.isOffDay} disabled={current?.isOffDay} />
                </div>
                
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                  <input type="checkbox" name="isOffDay" value="true" defaultChecked={current?.isOffDay} /> Off Day
                </label>
                
                <button type="submit" className="btn btn-secondary" disabled={isPending}>Save</button>
              </form>
            )
          })}
        </div>
      </div>

      {/* Special Date Overrides */}
      <div style={{ backgroundColor: "var(--background)", padding: "1.5rem", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
        <h3 style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Calendar size={20} color="var(--primary)" /> Specific Date Overrides
        </h3>
        
        <form onSubmit={handleSpecialSubmit} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr auto auto", gap: "1rem", alignItems: "end", marginBottom: "2rem", backgroundColor: "#f8fafc", padding: "1rem", borderRadius: "8px" }}>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">Date</label>
            <input type="date" name="date" className="input-field" required min={new Date().toISOString().split('T')[0]} />
          </div>
          
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">Start Time</label>
            <input type="time" name="startTime" className="input-field" defaultValue="09:00" />
          </div>
          
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">End Time</label>
            <input type="time" name="endTime" className="input-field" defaultValue="17:00" />
          </div>
          
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", marginBottom: "0.5rem" }}>
            <input type="checkbox" name="isOffDay" value="true" /> Off Day
          </label>
          
          <button type="submit" className="btn btn-primary" disabled={isPending}>Add Override</button>
        </form>

        <h4 style={{ fontWeight: 500, marginBottom: "1rem", color: "var(--text-muted)" }}>Active Overrides</h4>
        {specialSchedules.length === 0 ? (
          <p style={{ fontStyle: "italic", color: "var(--text-muted)", fontSize: "0.9rem" }}>No active overrides.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #ddd", textAlign: "left" }}>
                <th style={{ paddingBottom: "0.5rem" }}>Date</th>
                <th style={{ paddingBottom: "0.5rem" }}>Hours</th>
                <th style={{ paddingBottom: "0.5rem" }}>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {specialSchedules.map(ss => (
                <tr key={ss.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td style={{ padding: "0.75rem 0", fontWeight: 500 }}>{new Date(ss.date).toLocaleDateString()}</td>
                  <td style={{ padding: "0.75rem 0" }}>{ss.isOffDay ? "-" : `${ss.startTime} - ${ss.endTime}`}</td>
                  <td style={{ padding: "0.75rem 0" }}>
                    {ss.isOffDay ? <span style={{ color: "#991b1b", backgroundColor: "#fee2e2", padding: "0.2rem 0.5rem", borderRadius: "4px" }}>Off Day</span> : <span style={{ color: "#166534", backgroundColor: "#dcfce7", padding: "0.2rem 0.5rem", borderRadius: "4px" }}>Custom Hours</span>}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button onClick={() => handleDeleteSpecial(ss.id)} disabled={isPending} className="btn" style={{ padding: "0.4rem", color: "var(--danger)" }}><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Emergency Unavailability */}
      {false && (
      <div style={{ backgroundColor: "#fef2f2", padding: "1.5rem", borderRadius: "8px", border: "1px solid #fca5a5" }}>
        <h3 style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "#b91c1c" }}>
          <AlertTriangle size={20} /> Declare Emergency Unavailability
        </h3>
        <p style={{ fontSize: "0.9rem", color: "#991b1b", marginBottom: "1rem" }}>
          Use this ONLY for emergencies. Selecting a date here will instantly cancel ALL appointments for that entire day, email all affected patients, and instruct them to reschedule or request a refund.
        </p>
        
        <form onSubmit={handleEmergency} style={{ display: "flex", gap: "1rem", alignItems: "end" }}>
          <div className="input-group" style={{ marginBottom: 0, flex: 1 }}>
            <label className="input-label" style={{ color: "#7f1d1d" }}>Date of Emergency</label>
            <input type="date" name="date" className="input-field" required min={new Date().toISOString().split('T')[0]} style={{ borderColor: "#fca5a5" }} />
          </div>
          
          <button type="submit" className="btn" disabled={isEmergencyPending} style={{ backgroundColor: "#dc2626", color: "white", padding: "0.6rem 1.5rem", borderRadius: "8px", fontWeight: 600, border: "none", cursor: "pointer" }}>
            {isEmergencyPending ? "Processing..." : "CANCEL ALL APPOINTMENTS"}
          </button>
        </form>
      </div>
      )}

    </div>
  )
}
