"use client"

import { useEffect, useState } from "react"
import { getPatientHistory } from "@/app/actions/patientHistory"
import { Loader2, Activity, FileText, Calendar, AlertTriangle } from "lucide-react"

import PrescriptionModal from "@/app/dashboard/PrescriptionModal"
import ChatHistoryModal from "@/app/dashboard/ChatHistoryModal"

export default function PatientHistorySidebar({ 
  patientId, 
  role,
  appointmentId,
  existingPrescription,
  doctorSignatureUrl
}: { 
  patientId: string, 
  role: string,
  appointmentId?: string,
  existingPrescription?: any,
  doctorSignatureUrl?: string | null
}) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (role !== "DOCTOR") return
    getPatientHistory(patientId).then(res => {
      setData(res)
      setLoading(false)
    }).catch(err => {
      console.error(err)
      setLoading(false)
    })
  }, [patientId, role])

  if (role !== "DOCTOR") return null

  if (loading) {
    return <div className="sidebar-container" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><Loader2 className="spin" /></div>
  }

  if (!data) return null

  return (
    <div className="sidebar-container" style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "1.5rem 1rem", borderBottom: "1px solid #e2e8f0", backgroundColor: "white", display: "flex", flexDirection: "column", gap: "1rem" }}>
        <h2 style={{ fontSize: "1.2rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
          <Activity size={20} color="var(--primary)" /> Medical History
        </h2>
        
        {appointmentId && (
          <PrescriptionModal 
            appointmentId={appointmentId} 
            role={role} 
            existingPrescription={existingPrescription} 
            doctorSignatureUrl={doctorSignatureUrl}
          />
        )}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem 1rem", display: "flex", flexDirection: "column", gap: "2rem" }}>
        
        {/* Critical Alerts */}
        {data.record && (data.record.allergies || data.record.conditions || data.record.currentMedications) && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <h3 style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", margin: 0 }}>Critical Alerts</h3>
            
            {data.record.allergies && (
              <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fca5a5", padding: "0.75rem", borderRadius: "6px", fontSize: "0.85rem", color: "#991b1b", display: "flex", gap: "0.5rem" }}>
                <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: "0.1rem" }} />
                <div><strong>Allergies:</strong> {data.record.allergies}</div>
              </div>
            )}
            
            {data.record.conditions && (
              <div style={{ backgroundColor: "#fff7ed", border: "1px solid #fdba74", padding: "0.75rem", borderRadius: "6px", fontSize: "0.85rem", color: "#9a3412", display: "flex", gap: "0.5rem" }}>
                <Activity size={18} style={{ flexShrink: 0, marginTop: "0.1rem" }} />
                <div><strong>Conditions:</strong> {data.record.conditions}</div>
              </div>
            )}

            {data.record.currentMedications && (
              <div style={{ backgroundColor: "#f8fafc", border: "1px solid #cbd5e1", padding: "0.75rem", borderRadius: "6px", fontSize: "0.85rem", color: "#334155", display: "flex", gap: "0.5rem" }}>
                <FileText size={18} style={{ flexShrink: 0, marginTop: "0.1rem" }} />
                <div><strong>Current Meds:</strong> {data.record.currentMedications}</div>
              </div>
            )}
          </div>
        )}

        {/* Medical Reports */}
        {data.reports && data.reports.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <h3 style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", margin: 0 }}>Medical Reports</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {data.reports.map((rep: any) => (
                <a key={rep.id} href={rep.fileUrl} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem", backgroundColor: "white", borderRadius: "6px", border: "1px solid #e2e8f0", textDecoration: "none", color: "var(--primary)", transition: "all 0.2s", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }} onMouseOver={e => e.currentTarget.style.borderColor = "var(--primary)"} onMouseOut={e => e.currentTarget.style.borderColor = "#e2e8f0"}>
                  <FileText size={18} style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: "0.85rem", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{rep.fileName}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Past Consultations */}
        {data.appointments && data.appointments.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <h3 style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", margin: 0 }}>Past Consultations</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {data.appointments.map((app: any) => (
                <div key={app.id} style={{ backgroundColor: "white", padding: "1rem", borderRadius: "8px", border: "1px solid #e2e8f0", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    <Calendar size={14} /> {new Date(app.date).toLocaleDateString()}
                  </div>
                  <h4 style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-color)", margin: "0 0 0.25rem 0" }}>Dr. {app.doctorName}</h4>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>{app.doctorSpecialty}</div>
                  
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.5rem", paddingTop: "0.75rem", borderTop: "1px solid #f1f5f9" }}>
                    <ChatHistoryModal appointmentId={app.id} currentUserId={patientId} role={role} compact={true} />
                    {app.prescription ? (
                      <PrescriptionModal appointmentId={app.id} role={role} existingPrescription={app.prescription} compact={true} doctorSignatureUrl={doctorSignatureUrl} />
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(!data.record || (!data.record.allergies && !data.record.conditions && !data.record.currentMedications)) && (!data.reports || data.reports.length === 0) && (!data.appointments || data.appointments.length === 0) && (
          <div style={{ textAlign: "center", padding: "2rem 0", color: "var(--text-muted)" }}>
            <Activity size={32} style={{ opacity: 0.2, margin: "0 auto 1rem auto" }} />
            <p style={{ fontSize: "0.9rem" }}>No medical history available for this patient.</p>
          </div>
        )}

      </div>
    </div>
  )
}
