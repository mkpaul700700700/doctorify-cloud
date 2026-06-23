import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { ShieldCheck, Calendar, Clock, Activity, FileText } from "lucide-react"

export default async function VerifyPrescriptionPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  
  const prescription = await prisma.prescription.findUnique({
    where: { id: resolvedParams.id },
    include: {
      items: true,
      appointment: {
        include: {
          doctor: { include: { doctorProfile: true } },
          patient: true
        }
      }
    }
  })

  if (!prescription) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc", padding: "1rem" }}>
        <div style={{ backgroundColor: "white", padding: "3rem 2rem", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)", textAlign: "center", maxWidth: "400px", width: "100%" }}>
          <ShieldCheck size={48} color="#ef4444" style={{ margin: "0 auto 1rem" }} />
          <h1 style={{ fontSize: "1.5rem", fontWeight: 600, color: "#1e293b", marginBottom: "0.5rem" }}>Verification Failed</h1>
          <p style={{ color: "#64748b" }}>This prescription ID is invalid or does not exist in our system.</p>
        </div>
      </div>
    )
  }

  const { appointment } = prescription

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", padding: "2rem 1rem" }}>
      <div style={{ maxWidth: "600px", margin: "0 auto", backgroundColor: "white", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ backgroundColor: "#10b981", color: "white", padding: "2rem", textAlign: "center" }}>
          <ShieldCheck size={48} style={{ margin: "0 auto 1rem" }} />
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>Authentic Prescription</h1>
          <p style={{ opacity: 0.9, marginTop: "0.5rem", fontSize: "0.9rem" }}>Verified by Doctorify Systems</p>
        </div>

        <div style={{ padding: "2rem" }}>
          <div style={{ display: "grid", gap: "1.5rem" }}>
            
            {/* Parties Info */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", backgroundColor: "#f1f5f9", padding: "1rem", borderRadius: "8px" }}>
              <div>
                <p style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b", marginBottom: "0.25rem", fontWeight: 600 }}>Prescribed By</p>
                <p style={{ fontWeight: 600, color: "#0f172a" }}>Dr. {appointment.doctor.name}</p>
                <p style={{ fontSize: "0.85rem", color: "#475569" }}>{appointment.doctor.doctorProfile?.specialty}</p>
              </div>
              <div>
                <p style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b", marginBottom: "0.25rem", fontWeight: 600 }}>Patient</p>
                <p style={{ fontWeight: 600, color: "#0f172a" }}>{appointment.patient.name}</p>
              </div>
            </div>

            {/* DateTime */}
            <div style={{ display: "flex", gap: "1rem", color: "#475569", fontSize: "0.9rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <Calendar size={16} /> {new Date(prescription.createdAt).toLocaleDateString()}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <Clock size={16} /> {new Date(prescription.createdAt).toLocaleTimeString('en-US', { timeZone: 'Asia/Dhaka', hour: 'numeric', minute: '2-digit', hour12: true })}
              </div>
            </div>

            <hr style={{ border: "none", borderTop: "1px dashed #cbd5e1" }} />

            {/* Medicines List */}
            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#0f172a", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <FileText size={18} color="#10b981" /> Prescribed Items
              </h3>
              
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {prescription.items.map(item => (
                  <li key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: "0.75rem", borderBottom: "1px solid #e2e8f0" }}>
                    <div>
                      <span style={{ fontWeight: 600, color: "#1e293b", display: "block" }}>{item.type === "Test" ? `[Test] ${item.medicineName}` : item.medicineName}</span>
                      {item.type === "Medicine" && (
                        <span style={{ fontSize: "0.85rem", color: "#64748b" }}>{item.dosage} for {item.days} days</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
