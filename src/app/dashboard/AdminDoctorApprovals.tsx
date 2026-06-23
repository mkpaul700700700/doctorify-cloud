"use client"

import { useState } from "react"
import { approveDoctor } from "@/app/actions/approveDoctor"
import { CheckCircle, Loader2 } from "lucide-react"

export default function AdminDoctorApprovals({ unverifiedDoctors }: { unverifiedDoctors: any[] }) {
  const [approving, setApproving] = useState<string | null>(null)

  const handleApprove = async (doctorId: string) => {
    setApproving(doctorId)
    try {
      await approveDoctor(doctorId)
    } catch (err) {
      alert("Failed to approve doctor.")
    } finally {
      setApproving(null)
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {unverifiedDoctors.map(doc => (
        <div key={doc.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "white", padding: "1rem 1.5rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
          <div>
            <h4 style={{ margin: 0, fontSize: "1.1rem", color: "var(--text-color)" }}>Dr. {doc.user.name}</h4>
            <div style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              {doc.specialty} • {doc.experienceYears} Years Exp • ৳{doc.consultationFee}
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.25rem", fontStyle: "italic" }}>
              {doc.qualifications}
            </div>
          </div>
          <button 
            onClick={() => handleApprove(doc.userId)}
            className="btn btn-primary"
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            disabled={approving === doc.userId}
          >
            {approving === doc.userId ? <Loader2 size={18} className="spin" /> : <CheckCircle size={18} />}
            Approve Account
          </button>
        </div>
      ))}
    </div>
  )
}
