"use client"

import { useState, useTransition, useEffect } from "react"
import { updateMedicalRecord } from "@/app/actions/updateMedicalRecord"
import { saveMedicalReport, deleteMedicalReport } from "@/app/actions/saveMedicalReport"
import { Upload, X, FileText, Loader2, Trash2, Plus } from "lucide-react"
import styles from "./page.module.css"

export default function MedicalProfileForm({ initialData, reports = [] }: { initialData: any, reports?: any[] }) {
  const isProfileComplete = initialData && initialData.dob && initialData.gender && initialData.phone && initialData.bloodGroup;
  const [isEditing, setIsEditing] = useState(!isProfileComplete)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Dynamic Medications State
  const [medications, setMedications] = useState<{name: string, dosage: string, frequency: string, reason: string}[]>([])

  useEffect(() => {
    if (initialData?.currentMedications) {
      try {
        setMedications(JSON.parse(initialData.currentMedications))
      } catch (e) {
        console.error("Failed to parse medications")
      }
    }
  }, [initialData])

  const addMedication = () => setMedications([...medications, { name: "", dosage: "", frequency: "", reason: "" }])
  const removeMedication = (index: number) => {
    const newMeds = [...medications]
    newMeds.splice(index, 1)
    setMedications(newMeds)
  }
  const updateMedication = (index: number, field: string, value: string) => {
    const newMeds = [...medications]
    newMeds[index] = { ...newMeds[index], [field]: value }
    setMedications(newMeds)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("upload_preset", "trdzwtsw") // Unsigned preset

    try {
      const resourceType = file.type === "application/pdf" ? "raw" : "auto"
      const res = await fetch(`https://api.cloudinary.com/v1_1/dsj8cr1ol/${resourceType}/upload`, {
        method: "POST",
        body: formData,
      })
      if (!res.ok) throw new Error("Upload failed")
      const data = await res.json()
      
      startTransition(async () => {
        await saveMedicalReport({ fileUrl: data.secure_url, fileName: file.name, fileType: file.type || "unknown" })
      })
    } catch (err) {
      console.error(err)
      alert("Failed to upload file")
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeleteReport = (id: string) => {
    if(confirm("Delete this medical report?")) {
      startTransition(async () => {
        await deleteMedicalReport(id)
      })
    }
  }

  const calculateAge = (dob: string) => {
    if (!dob) return ""
    const diff_ms = Date.now() - new Date(dob).getTime()
    const age_dt = new Date(diff_ms)
    return Math.abs(age_dt.getUTCFullYear() - 1970)
  }

  if (!isEditing && initialData) {
    const medsList = initialData.currentMedications ? JSON.parse(initialData.currentMedications) : []

    return (
      <div className={styles.medicalRecordView}>
        
        {/* VIEW MODE: Beautiful formatting for Doctors & Patients */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "2rem" }}>
          
          <div style={{ backgroundColor: "var(--background)", padding: "1.5rem", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 600, borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem", marginBottom: "1rem" }}>Personal & Emergency</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div><strong style={{ color: "var(--text-muted)", display: "block", fontSize: "0.85rem" }}>Date of Birth (Age)</strong>{initialData.dob ? `${new Date(initialData.dob).toLocaleDateString()} (${calculateAge(initialData.dob)} yrs)` : "N/A"}</div>
              <div><strong style={{ color: "var(--text-muted)", display: "block", fontSize: "0.85rem" }}>Gender</strong>{initialData.gender || "N/A"}</div>
              <div><strong style={{ color: "var(--text-muted)", display: "block", fontSize: "0.85rem" }}>Phone</strong>{initialData.phone || "N/A"}</div>
              <div><strong style={{ color: "var(--text-muted)", display: "block", fontSize: "0.85rem" }}>Address</strong>{initialData.address || "N/A"}</div>
              <div style={{ gridColumn: "1 / -1", backgroundColor: "#fef2f2", padding: "1rem", borderRadius: "6px" }}>
                <strong style={{ color: "#991b1b", display: "block", fontSize: "0.85rem", marginBottom: "0.25rem" }}>Emergency Contact</strong>
                {initialData.emergencyName ? `${initialData.emergencyName} (${initialData.emergencyRelation}) - ${initialData.emergencyPhone}` : "N/A"}
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: "var(--background)", padding: "1.5rem", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 600, borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem", marginBottom: "1rem" }}>Physical & Medical</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div><strong style={{ color: "var(--text-muted)", display: "block", fontSize: "0.85rem" }}>Blood Group</strong><span style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--primary-color)" }}>{initialData.bloodGroup} {initialData.rhFactor}</span></div>
              <div><strong style={{ color: "var(--text-muted)", display: "block", fontSize: "0.85rem" }}>Height / Weight</strong>{initialData.height || "-"} / {initialData.weight || "-"}</div>
              <div style={{ gridColumn: "1 / -1" }}><strong style={{ color: "var(--text-muted)", display: "block", fontSize: "0.85rem" }}>Allergies (Critical)</strong><span style={{ color: "var(--danger)", fontWeight: 500 }}>{initialData.allergies || "None reported"}</span></div>
              <div style={{ gridColumn: "1 / -1" }}><strong style={{ color: "var(--text-muted)", display: "block", fontSize: "0.85rem" }}>Existing Conditions</strong>{initialData.conditions || "None reported"}</div>
              <div style={{ gridColumn: "1 / -1" }}><strong style={{ color: "var(--text-muted)", display: "block", fontSize: "0.85rem" }}>Past Surgeries</strong>{initialData.pastSurgeries || "None reported"}</div>
              <div style={{ gridColumn: "1 / -1" }}><strong style={{ color: "var(--text-muted)", display: "block", fontSize: "0.85rem" }}>Family History</strong>{initialData.familyHistory || "None reported"}</div>
            </div>
          </div>

          <div style={{ backgroundColor: "var(--background)", padding: "1.5rem", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 600, borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem", marginBottom: "1rem" }}>Current Medications</h3>
            {medsList.length === 0 ? <p style={{ color: "var(--text-muted)" }}>No current medications.</p> : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                <thead><tr style={{ borderBottom: "1px solid #ddd", textAlign: "left" }}><th>Medicine</th><th>Dosage</th><th>Frequency</th><th>Reason</th></tr></thead>
                <tbody>
                  {medsList.map((m: any, i: number) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f0f0f0" }}><td style={{ padding: "0.5rem 0" }}>{m.name}</td><td>{m.dosage}</td><td>{m.frequency}</td><td>{m.reason}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div style={{ backgroundColor: "var(--background)", padding: "1.5rem", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 600, borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem", marginBottom: "1rem" }}>Lifestyle & Other</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div><strong style={{ color: "var(--text-muted)", display: "block", fontSize: "0.85rem" }}>Smoking</strong>{initialData.smokingStatus || "N/A"}</div>
              <div><strong style={{ color: "var(--text-muted)", display: "block", fontSize: "0.85rem" }}>Alcohol</strong>{initialData.alcoholStatus || "N/A"}</div>
              <div><strong style={{ color: "var(--text-muted)", display: "block", fontSize: "0.85rem" }}>Exercise</strong>{initialData.exerciseStatus || "N/A"}</div>
              
              {initialData.gender === "Female" && (
                <div style={{ gridColumn: "1 / -1", backgroundColor: "#f0fdf4", padding: "1rem", borderRadius: "6px", marginTop: "1rem" }}>
                  <strong style={{ color: "#166534", display: "block", fontSize: "0.85rem", marginBottom: "0.5rem" }}>Female Specific</strong>
                  <div style={{ display: "flex", gap: "2rem" }}>
                    <span>Pregnant: <strong>{initialData.isPregnant ? "Yes" : "No"}</strong></span>
                    <span>Breastfeeding: <strong>{initialData.isBreastfeeding ? "Yes" : "No"}</strong></span>
                    <span>LMP: <strong>{initialData.lastMenstrualPeriod ? new Date(initialData.lastMenstrualPeriod).toLocaleDateString() : "N/A"}</strong></span>
                  </div>
                </div>
              )}
            </div>
            {initialData.patientNotes && (
              <div style={{ marginTop: "1rem", padding: "1rem", backgroundColor: "#f8fafc", borderRadius: "6px" }}>
                <strong style={{ color: "var(--text-muted)", display: "block", fontSize: "0.85rem", marginBottom: "0.25rem" }}>Patient Notes</strong>
                <p>{initialData.patientNotes}</p>
              </div>
            )}
          </div>

        </div>

        {/* DOCUMENTS UPLOAD */}
        <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1.5rem", marginTop: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Medical Reports & Documents</h3>
            <label className="btn btn-primary" style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem" }}>
              {isUploading ? <Loader2 size={16} className="spin" /> : <Upload size={16} />}
              {isUploading ? "Uploading..." : "Upload File"}
              <input type="file" style={{ display: "none" }} onChange={handleFileUpload} accept=".pdf,.jpg,.jpeg,.png,.docx" disabled={isUploading || isPending} />
            </label>
          </div>
          
          {reports.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", fontStyle: "italic" }}>No medical reports uploaded yet.</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
              {reports.map((report) => (
                <div key={report.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem", backgroundColor: "var(--background)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", overflow: "hidden" }}>
                    <FileText size={20} color="var(--primary-color)" style={{ flexShrink: 0 }} />
                    <a href={report.fileUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--text)", textDecoration: "none", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {report.fileName}
                    </a>
                  </div>
                  <button onClick={() => handleDeleteReport(report.id)} disabled={isPending} style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer", flexShrink: 0 }}>
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginTop: "3rem", borderTop: "1px solid var(--border-color)", paddingTop: "1.5rem" }}>
          <button onClick={() => setIsEditing(true)} className="btn btn-secondary" style={{ width: "100%", maxWidth: "300px", padding: "0.75rem" }}>Update Medical Profile</button>
        </div>
      </div>
    )
  }

  // ==========================================
  // EDIT MODE: Comprehensive Form
  // ==========================================
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    formData.append("currentMedications", JSON.stringify(medications))
    
    // Convert checkbox states
    formData.append("isPregnant", (e.currentTarget.elements.namedItem("isPregnant") as HTMLInputElement)?.checked ? "true" : "false")
    formData.append("isBreastfeeding", (e.currentTarget.elements.namedItem("isBreastfeeding") as HTMLInputElement)?.checked ? "true" : "false")

    try {
      await updateMedicalRecord(formData)
      setIsEditing(false)
    } catch (err) {
      alert("Failed to save medical record")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {(!initialData || !isProfileComplete) && (
        <div style={{ backgroundColor: "#e0f2fe", border: "1px solid #bae6fd", color: "#0369a1", padding: "1rem", borderRadius: "8px" }}>
          <strong>Welcome!</strong> You must complete this comprehensive health profile before booking your first appointment.
        </div>
      )}

      {/* Section 1: Personal */}
      <div style={{ backgroundColor: "var(--background)", padding: "1.5rem", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
        <h3 style={{ fontSize: "1.2rem", fontWeight: 600, borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem", marginBottom: "1rem" }}>Section 1: Personal Information</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div className="input-group">
            <label className="input-label">Date of Birth *</label>
            <input type="date" name="dob" className="input-field" required defaultValue={initialData?.dob ? new Date(initialData.dob).toISOString().split('T')[0] : ""} />
          </div>
          <div className="input-group">
            <label className="input-label">Gender *</label>
            <select name="gender" className="input-field" required defaultValue={initialData?.gender || ""}>
              <option value="">Select Gender</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">Phone Number *</label>
            <input type="tel" name="phone" className="input-field" required defaultValue={initialData?.phone || ""} />
          </div>
          <div className="input-group" style={{ gridColumn: "1 / -1" }}>
            <label className="input-label">Address</label>
            <input type="text" name="address" className="input-field" defaultValue={initialData?.address || ""} />
          </div>
        </div>
      </div>

      {/* Section 2: Emergency */}
      <div style={{ backgroundColor: "var(--background)", padding: "1.5rem", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
        <h3 style={{ fontSize: "1.2rem", fontWeight: 600, borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem", marginBottom: "1rem" }}>Section 2: Emergency Contact *</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
          <div className="input-group">
            <label className="input-label">Name *</label>
            <input type="text" name="emergencyName" className="input-field" required defaultValue={initialData?.emergencyName || ""} />
          </div>
          <div className="input-group">
            <label className="input-label">Relationship *</label>
            <input type="text" name="emergencyRelation" className="input-field" required defaultValue={initialData?.emergencyRelation || ""} />
          </div>
          <div className="input-group">
            <label className="input-label">Phone Number *</label>
            <input type="tel" name="emergencyPhone" className="input-field" required defaultValue={initialData?.emergencyPhone || ""} />
          </div>
        </div>
      </div>

      {/* Section 3: Medical Information */}
      <div style={{ backgroundColor: "var(--background)", padding: "1.5rem", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
        <h3 style={{ fontSize: "1.2rem", fontWeight: 600, borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem", marginBottom: "1rem" }}>Section 3: Medical Information</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div className="input-group">
            <label className="input-label">Blood Group *</label>
            <select name="bloodGroup" className="input-field" required defaultValue={initialData?.bloodGroup || ""}>
              <option value="">Select</option><option value="A+">A+</option><option value="A-">A-</option><option value="B+">B+</option><option value="B-">B-</option><option value="AB+">AB+</option><option value="AB-">AB-</option><option value="O+">O+</option><option value="O-">O-</option>
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">Rh Factor</label>
            <select name="rhFactor" className="input-field" defaultValue={initialData?.rhFactor || ""}>
              <option value="">Select</option><option value="Positive">Positive</option><option value="Negative">Negative</option>
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">Height (e.g. 5'10")</label>
            <input type="text" name="height" className="input-field" defaultValue={initialData?.height || ""} />
          </div>
          <div className="input-group">
            <label className="input-label">Weight (e.g. 70kg)</label>
            <input type="text" name="weight" className="input-field" defaultValue={initialData?.weight || ""} />
          </div>
        </div>
      </div>

      {/* Section 4 & 5: Allergies & Conditions */}
      <div style={{ backgroundColor: "var(--background)", padding: "1.5rem", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
        <h3 style={{ fontSize: "1.2rem", fontWeight: 600, borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem", marginBottom: "1rem" }}>Section 4 & 5: Allergies & Conditions</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="input-group">
            <label className="input-label">Allergies (Drugs, Food, Environmental) *</label>
            <textarea name="allergies" className="input-field" required defaultValue={initialData?.allergies || ""} placeholder="List all allergies or write 'No known allergies'"></textarea>
          </div>
          <div className="input-group">
            <label className="input-label">Existing Medical Conditions *</label>
            <textarea name="conditions" className="input-field" required defaultValue={initialData?.conditions || ""} placeholder="List chronic conditions (Diabetes, Asthma, etc.) or write 'None'"></textarea>
          </div>
          <div className="input-group">
            <label className="input-label">Past Surgeries (Provide dates and details if applicable)</label>
            <textarea name="pastSurgeries" className="input-field" defaultValue={initialData?.pastSurgeries || ""} placeholder="None"></textarea>
          </div>
          <div className="input-group">
            <label className="input-label">Family Medical History</label>
            <textarea name="familyHistory" className="input-field" defaultValue={initialData?.familyHistory || ""} placeholder="Diabetes, Heart Disease, etc."></textarea>
          </div>
        </div>
      </div>

      {/* Section 6: Current Medications */}
      <div style={{ backgroundColor: "var(--background)", padding: "1.5rem", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
        <h3 style={{ fontSize: "1.2rem", fontWeight: 600, borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem", marginBottom: "1rem" }}>Section 6: Current Medications</h3>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {medications.map((m, idx) => (
            <div key={idx} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 2fr auto", gap: "0.5rem", alignItems: "center" }}>
              <input type="text" className="input-field" placeholder="Medicine Name" value={m.name} onChange={(e) => updateMedication(idx, 'name', e.target.value)} />
              <input type="text" className="input-field" placeholder="Dosage" value={m.dosage} onChange={(e) => updateMedication(idx, 'dosage', e.target.value)} />
              <input type="text" className="input-field" placeholder="Frequency" value={m.frequency} onChange={(e) => updateMedication(idx, 'frequency', e.target.value)} />
              <input type="text" className="input-field" placeholder="Reason" value={m.reason} onChange={(e) => updateMedication(idx, 'reason', e.target.value)} />
              <button type="button" onClick={() => removeMedication(idx)} className="btn" style={{ padding: "0.5rem", backgroundColor: "#fee2e2", color: "#991b1b" }}><Trash2 size={16}/></button>
            </div>
          ))}
          <button type="button" onClick={addMedication} className="btn btn-secondary" style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: "0.5rem" }}><Plus size={16}/> Add Medicine</button>
        </div>
      </div>

      {/* Section 7: Lifestyle */}
      <div style={{ backgroundColor: "var(--background)", padding: "1.5rem", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
        <h3 style={{ fontSize: "1.2rem", fontWeight: 600, borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem", marginBottom: "1rem" }}>Section 7: Lifestyle</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
          <div className="input-group">
            <label className="input-label">Smoking</label>
            <select name="smokingStatus" className="input-field" defaultValue={initialData?.smokingStatus || ""}>
              <option value="">Select</option><option value="Never">Never</option><option value="Former">Former</option><option value="Current">Current</option>
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">Alcohol</label>
            <select name="alcoholStatus" className="input-field" defaultValue={initialData?.alcoholStatus || ""}>
              <option value="">Select</option><option value="Never">Never</option><option value="Occasionally">Occasionally</option><option value="Frequently">Frequently</option>
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">Exercise</label>
            <select name="exerciseStatus" className="input-field" defaultValue={initialData?.exerciseStatus || ""}>
              <option value="">Select</option><option value="None">None</option><option value="Light">Light</option><option value="Moderate">Moderate</option><option value="Heavy">Heavy</option>
            </select>
          </div>
        </div>
      </div>

      {/* Section 8: Female Specific (Optional UI logic handled via CSS or pure inputs) */}
      <div style={{ backgroundColor: "var(--background)", padding: "1.5rem", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
        <h3 style={{ fontSize: "1.2rem", fontWeight: 600, borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem", marginBottom: "1rem" }}>Section 8: Female Patients Only</h3>
        <div style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
            <input type="checkbox" name="isPregnant" defaultChecked={initialData?.isPregnant} /> Pregnant
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
            <input type="checkbox" name="isBreastfeeding" defaultChecked={initialData?.isBreastfeeding} /> Breastfeeding
          </label>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">Last Menstrual Period</label>
            <input type="date" name="lastMenstrualPeriod" className="input-field" defaultValue={initialData?.lastMenstrualPeriod ? new Date(initialData.lastMenstrualPeriod).toISOString().split('T')[0] : ""} />
          </div>
        </div>
      </div>

      {/* Additional Notes */}
      <div className="input-group">
        <label className="input-label">Additional Patient Notes</label>
        <textarea name="patientNotes" className="input-field" defaultValue={initialData?.patientNotes || ""} placeholder="Any other important medical information your doctor should know..."></textarea>
      </div>

      <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
        <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ padding: "1rem 2rem", fontSize: "1.1rem" }}>
          {isSubmitting ? "Saving Profile..." : "Save Medical Profile"}
        </button>
        {initialData && isProfileComplete && (
          <button type="button" onClick={() => setIsEditing(false)} className="btn btn-secondary" disabled={isSubmitting}>
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
