"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createPrescription } from "@/app/actions/createPrescription"
import { scrapeMedicineAction } from "@/app/actions/scrapeMedicineAction"
import styles from "./page.module.css"
import { FileText, X, Plus, Loader2, Info, Eye, EyeOff, Download } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"

type PrescriptionItem = {
  type: string; // "Medicine" | "Test"
  medicineName: string;
  dosage: string;
  days: number;
  unitPrice: number | null;
  totalCost: number | null;
}

export default function PrescriptionModal({ 
  appointmentId, 
  role, 
  existingPrescription,
  compact = false,
  doctorSignatureUrl
}: { 
  appointmentId: string, 
  role: string, 
  existingPrescription?: any,
  compact?: boolean,
  doctorSignatureUrl?: string | null
}) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Builder state
  const [items, setItems] = useState<PrescriptionItem[]>([])
  const [itemType, setItemType] = useState("Medicine")
  const [medName, setMedName] = useState("")
  const [dosage, setDosage] = useState("")
  const [days, setDays] = useState("")
  const [instructions, setInstructions] = useState("")
  const [diagnosis, setDiagnosis] = useState("")
  const [tests, setTests] = useState("")
  const [revisitDays, setRevisitDays] = useState("")
  
  const [isScraping, setIsScraping] = useState(false)
  const [showPrice, setShowPrice] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const handleEdit = () => {
    if (existingPrescription) {
      setDiagnosis(existingPrescription.diagnosis || "")
      setTests(existingPrescription.tests || "")
      setInstructions(existingPrescription.instructions || "")
      setRevisitDays(existingPrescription.revisitDays ? String(existingPrescription.revisitDays) : "")
      setItems(existingPrescription.items.map((i: any) => ({
        type: i.type || "Medicine",
        medicineName: i.medicineName,
        dosage: i.dosage,
        days: i.days,
        unitPrice: i.unitPrice,
        totalCost: i.totalCost
      })))
      setIsEditing(true)
    }
  }

  const downloadPDF = async () => {
    const element = document.getElementById("prescription-paper")
    if (!element) return

    // Hide print/download buttons temporarily
    const buttons = document.getElementById("prescription-actions")
    if (buttons) buttons.style.display = "none"

    // Hide cost elements for PDF
    const costElements = document.querySelectorAll(".pdf-hide-cost")
    costElements.forEach((el: any) => el.style.display = "none")

    try {
      // Dynamically import html2pdf to avoid SSR issues
      const html2pdf = (await import('html2pdf.js')).default
      
      const opt = {
        margin:       10,
        filename:     `Prescription_${existingPrescription.id.slice(-6).toUpperCase()}.pdf`,
        image:        { type: "jpeg" as const, quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
      }
      
      await html2pdf().set(opt).from(element).save()
    } finally {
      if (buttons) buttons.style.display = "flex"
      costElements.forEach((el: any) => el.style.display = "")
    }
  }

  const parseDailyQuantity = (doseStr: string) => {
    const parts = doseStr.split(/[-\+]/)
    let sum = 0
    for(let p of parts) {
      const val = parseInt(p.trim())
      if(!isNaN(val)) sum += val
    }
    return sum > 0 ? sum : 1
  }

  const handleAddItem = async () => {
    if(!medName) return

    let unitPrice = null
    let totalCost = null

    if (itemType === "Medicine") {
      if (!dosage || !days) return

      setIsScraping(true)
      unitPrice = await scrapeMedicineAction(medName)
      setIsScraping(false)

      const dailyQty = parseDailyQuantity(dosage)
      const numDays = parseInt(days) || 1
      
      if (unitPrice) {
        // Advanced Pricing Logic: If it's a Syrup or Injection, usually 1 unit is enough for a standard course unless specified.
        // If it's a tablet/capsule, multiply by daily dose and days.
        const nameLower = medName.toLowerCase()
        if (nameLower.includes("syrup") || nameLower.includes("suspension") || nameLower.includes("drop")) {
          totalCost = unitPrice * 1 // Default 1 bottle
        } else {
          totalCost = unitPrice * dailyQty * numDays // Tablets/Capsules math
        }
      }
    }

    setItems([...items, {
      type: itemType,
      medicineName: medName,
      dosage: itemType === "Medicine" ? dosage : "N/A",
      days: itemType === "Medicine" ? (parseInt(days) || 1) : 0,
      unitPrice,
      totalCost
    }])

    // Reset inputs
    setMedName("")
    setDosage("")
    setDays("")
  }

  const removeItem = (idx: number) => {
    const newItems = [...items]
    newItems.splice(idx, 1)
    setItems(newItems)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if(items.length === 0) {
      alert("Please add at least one medicine.")
      return
    }

    setIsSubmitting(true)
    const formData = new FormData()
    formData.append("appointmentId", appointmentId)
    formData.append("instructions", instructions)
    formData.append("diagnosis", diagnosis)
    formData.append("tests", tests)
    if (revisitDays) formData.append("revisitDays", revisitDays)
    formData.append("items", JSON.stringify(items))
    
    try {
      await createPrescription(formData)
      setIsEditing(false)
      setIsOpen(false)
      router.push('/dashboard')
    } catch (err) {
      alert("Failed to save prescription")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Determine items to display based on mode
  const displayItems = existingPrescription?.items || []

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)} 
        className={existingPrescription ? "btn btn-outline" : "btn btn-primary"}
        style={compact 
          ? { padding: "0.25rem 0.5rem", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.25rem" }
          : { width: existingPrescription ? "auto" : "100%", padding: "0.5rem", fontSize: "0.9rem" }
        }
      >
        <FileText size={compact ? 12 : 18} style={{ marginRight: "0.5rem" }} /> 
        {existingPrescription ? "View Prescription" : "Write Prescription"}
      </button>

      {isOpen && (
        <div className="modal-content" style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "var(--surface)", width: "100%", maxWidth: "700px", borderRadius: "var(--radius-lg)", padding: "clamp(1rem, 5vw, 2rem)", boxShadow: "var(--shadow-lg)", maxHeight: "90vh", overflowY: "auto" }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 700 }}>
                {existingPrescription ? "Medical Prescription" : "Write Prescription"}
              </h2>
              <button onClick={() => { setIsOpen(false); setIsEditing(false); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                <X size={24} />
              </button>
            </div>

            {existingPrescription && !isEditing ? (
              // View Mode (Patient or Doctor reviewing) - Real-world Paper Design
              <div 
                id="prescription-paper"
                style={{ 
                backgroundColor: "#fdfbf7", 
                padding: "2.5rem 2rem", 
                borderRadius: "2px", 
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1), inset 0 0 40px rgba(0,0,0,0.02)", 
                border: "1px solid #e5e5e5",
                fontFamily: "Georgia, serif",
                color: "#1a1a1a",
                position: "relative"
              }}>
                
                {/* Hospital/Clinic Letterhead */}
                <div style={{ textAlign: "center", borderBottom: "2px solid #1a1a1a", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
                  <h3 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0, color: "#000" }}>DOCTORIFY MEDICAL CENTER</h3>
                  <p style={{ fontSize: "0.85rem", color: "#555", margin: "0.25rem 0 0 0" }}>123 Health Avenue, Medical District • Contact: +880 1234-567890</p>
                </div>
                
                {/* Patient Info Header */}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", borderBottom: "1px solid #ccc", paddingBottom: "0.5rem", marginBottom: "1.5rem" }}>
                  <div><strong>Date:</strong> {new Date(existingPrescription.createdAt).toLocaleDateString()}</div>
                  <div><strong>Ref ID:</strong> {existingPrescription.id.slice(-6).toUpperCase()}</div>
                </div>

                {/* Diagnosis & Tests */}
                <div style={{ display: "flex", gap: "2rem", marginBottom: "2rem", fontSize: "0.95rem" }}>
                  {existingPrescription.diagnosis && (
                    <div style={{ flex: 1 }}>
                      <strong>Diagnosis:</strong>
                      <div style={{ marginTop: "0.25rem", whiteSpace: "pre-wrap" }}>{existingPrescription.diagnosis}</div>
                    </div>
                  )}
                  {existingPrescription.tests && (
                    <div style={{ flex: 1 }}>
                      <strong>Medical Tests/Investigations:</strong>
                      <div style={{ marginTop: "0.25rem", whiteSpace: "pre-wrap" }}>{existingPrescription.tests}</div>
                    </div>
                  )}
                </div>

                {/* Rx Symbol */}
                <div style={{ fontSize: "2.5rem", fontWeight: "bold", fontFamily: "serif", marginBottom: "1rem", lineHeight: 1 }}>
                  ℞
                </div>

                {/* Medicines List */}
                <div style={{ minHeight: "200px" }}>
                  {displayItems.map((item: any, idx: number) => (
                    <div key={item.id} style={{ marginBottom: "1.25rem", paddingLeft: "1rem", borderLeft: "2px solid rgba(0,0,0,0.1)" }}>
                      <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>{idx + 1}. {item.medicineName} {item.type === 'Test' && <span style={{fontSize: "0.8rem", color: "var(--primary-color)", marginLeft: "0.5rem"}}>[Medical Test]</span>}</div>
                      {item.type !== 'Test' && (
                        <div style={{ fontSize: "0.95rem", marginTop: "0.25rem" }}>
                          Take <strong>{item.dosage}</strong> for <strong>{item.days}</strong> days
                        </div>
                      )}
                      {showPrice && item.totalCost > 0 && (
                        <div className="pdf-hide-cost" style={{ fontSize: "0.85rem", color: "var(--primary)", marginTop: "0.4rem", fontWeight: 500 }}>
                          Est. Cost: ৳{item.totalCost.toFixed(2)} <span style={{color: "#888", fontSize: "0.75rem", fontWeight: "normal"}}>(৳{item.unitPrice || 0}/unit)</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Special Instructions & Revisit */}
                {existingPrescription.instructions && (
                  <div style={{ marginTop: "2rem", padding: "1rem", backgroundColor: "rgba(0,0,0,0.03)", borderRadius: "4px" }}>
                    <strong style={{ display: "block", marginBottom: "0.5rem" }}>Special Advice:</strong>
                    <div style={{ fontStyle: "italic", whiteSpace: "pre-wrap" }}>{existingPrescription.instructions}</div>
                  </div>
                )}
                {existingPrescription.revisitDays && (
                  <div style={{ marginTop: "1rem", padding: "1rem", border: "1px dashed var(--primary)", borderRadius: "4px", color: "var(--primary-dark)" }}>
                    <strong>Revisit Recommended:</strong> After {existingPrescription.revisitDays} days
                  </div>
                )}
                
                {/* Cost Summary & Signature */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "3rem", paddingTop: "1rem", borderTop: "1px dashed #ccc" }}>
                  <div className="pdf-hide-cost">
                    <div style={{ fontSize: "0.85rem", color: "#666", marginBottom: "0.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      Total Estimated Medicine Cost
                      <button onClick={() => setShowPrice(!showPrice)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--primary-color)", padding: 0, display: "flex", alignItems: "center" }}>
                        {showPrice ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--primary)" }}>
                      {showPrice ? `৳${existingPrescription.totalCost?.toFixed(2) || "0.00"}` : "***"}
                    </div>
                  </div>
                  
                  {/* Space for PDF when cost is hidden */}
                  <div className="pdf-show-only" style={{ display: "none" }}></div>
                  
                  {/* Authenticity Verification QR */}
                  <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <QRCodeSVG value={`${typeof window !== 'undefined' ? window.location.origin : 'https://doctorify.com'}/verify/${existingPrescription.id}`} size={64} level="M" />
                    <span style={{ fontSize: "0.6rem", color: "#666", marginTop: "0.25rem" }}>Scan to Verify Authenticity</span>
                  </div>

                  <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end" }}>
                    {doctorSignatureUrl ? (
                      <img src={doctorSignatureUrl} crossOrigin="anonymous" alt="Signature" style={{ height: "40px", objectFit: "contain", marginBottom: "0.25rem" }} />
                    ) : (
                      <div style={{ height: "40px" }}></div>
                    )}
                    <div style={{ borderBottom: "1px solid #000", width: "150px", marginBottom: "0.25rem" }}></div>
                    <div style={{ fontSize: "0.85rem" }}>Doctor's Signature</div>
                  </div>
                </div>
                
                <div id="prescription-actions" style={{ position: "absolute", top: "1rem", right: "1rem", display: "flex", gap: "0.5rem" }} className="print-hide">
                  {role === "DOCTOR" && (
                    <button onClick={handleEdit} className="btn btn-primary" style={{ padding: "0.25rem 0.75rem", fontSize: "0.8rem", fontFamily: "var(--font-sans)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      Edit
                    </button>
                  )}
                  <button onClick={downloadPDF} className="btn btn-outline" style={{ padding: "0.25rem 0.75rem", fontSize: "0.8rem", fontFamily: "var(--font-sans)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    <Download size={14} /> PDF
                  </button>

                </div>
                <style dangerouslySetInnerHTML={{__html: `
                  @media print {
                    body * { visibility: hidden; }
                    .modal-content * { visibility: visible; }
                    .modal-content { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none; border: none; }
                    .print-hide { display: none !important; }
                  }
                  .modal-container:hover .print-hide { display: flex; }
                `}} />
              </div>
            ) : (
              // Edit Mode (Doctor)
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                
                {/* Items Table */}
                <div style={{ backgroundColor: "var(--background)", padding: "1rem", borderRadius: "var(--radius-md)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <h4 style={{ fontWeight: 600 }}>Added Medicines</h4>
                    <button type="button" onClick={() => setShowPrice(!showPrice)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--primary-color)", display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.8rem" }}>
                      {showPrice ? <EyeOff size={14} /> : <Eye size={14} />} {showPrice ? "Hide Cost" : "Show Cost"}
                    </button>
                  </div>
                  {items.length === 0 ? (
                    <div style={{ color: "var(--text-muted)", fontSize: "0.875rem", fontStyle: "italic", marginBottom: "1rem" }}>No medicines added yet.</div>
                  ) : (
                    <table style={{ width: "100%", fontSize: "0.875rem", marginBottom: "1rem", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.1)" }}>
                          <th style={{ textAlign: "left", paddingBottom: "0.5rem" }}>Medicine</th>
                          <th style={{ textAlign: "left", paddingBottom: "0.5rem" }}>Dosage</th>
                          {showPrice && <th style={{ textAlign: "right", paddingBottom: "0.5rem" }}>Est. Cost</th>}
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((it, idx) => (
                          <tr key={idx} style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                            <td style={{ padding: "0.5rem 0" }}>{it.type === 'Test' ? `[Test] ${it.medicineName}` : it.medicineName}</td>
                            <td style={{ padding: "0.5rem 0" }}>{it.type === 'Test' ? '-' : `${it.dosage} (${it.days} days)`}</td>
                            {showPrice && (
                              <td style={{ padding: "0.5rem 0", textAlign: "right", color: "var(--primary)", fontWeight: 600 }}>
                                {it.type === 'Test' ? <span style={{color: "var(--text-muted)"}}>N/A</span> : (it.totalCost ? `৳${it.totalCost.toFixed(2)}` : 'N/A')}
                              </td>
                            )}
                            <td style={{ textAlign: "right" }}>
                              <button type="button" onClick={() => removeItem(idx)} style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer" }}>
                                <X size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {/* Add Item Builder */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 0.65fr 0.45fr", gap: "0.5rem" }}>
                      <div>
                        <label style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Type</label>
                        <select className="input-field" value={itemType} onChange={(e) => setItemType(e.target.value)}>
                          <option value="Medicine">Medicine</option>
                          <option value="Test">Medical Test</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{itemType === "Medicine" ? "Medicine Name" : "Test Name"}</label>
                        <input type="text" className="input-field" placeholder={itemType === "Medicine" ? "e.g. Napa 500mg" : "e.g. CBC"} value={medName} onChange={(e) => setMedName(e.target.value)} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", opacity: itemType === "Test" ? 0.3 : 1 }}>Dosage</label>
                        <input type="text" className="input-field" placeholder="1-0-1" value={dosage} onChange={(e) => setDosage(e.target.value)} disabled={itemType === "Test"} style={{ width: "100%", minWidth: 0 }} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", opacity: itemType === "Test" ? 0.3 : 1 }}>Days</label>
                        <input type="number" className="input-field" placeholder="5" value={days} onChange={(e) => setDays(e.target.value)} min="1" disabled={itemType === "Test"} style={{ width: "100%", minWidth: 0 }} />
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <button 
                        type="button"
                        onClick={handleAddItem}
                        disabled={!medName || (itemType === "Medicine" && (!dosage || !days)) || isScraping}
                        style={{
                          padding: "0.6rem 1.5rem",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.4rem",
                          border: "none",
                          borderRadius: "var(--radius-md, 8px)",
                          cursor: (!medName || (itemType === "Medicine" && (!dosage || !days)) || isScraping) ? "not-allowed" : "pointer",
                          fontWeight: 600,
                          fontSize: "0.9rem",
                          transition: "background 0.2s, color 0.2s",
                          background: (!medName || (itemType === "Medicine" && (!dosage || !days)) || isScraping)
                            ? "#b0bec5"
                            : "#29b6f6",
                          color: (!medName || (itemType === "Medicine" && (!dosage || !days)) || isScraping)
                            ? "#78909c"
                            : "#fff",
                        }}
                      >
                        {isScraping ? <Loader2 size={18} className="spin" /> : <><Plus size={18} /> Add</>}
                      </button>
                    </div>
                  </div>

                  {isScraping && <div style={{ fontSize: "0.75rem", color: "var(--primary)", marginTop: "0.5rem" }}>Scraping live price from BD indices...</div>}
                </div>

                <div className="input-group">
                  <label className="input-label">Diagnosis</label>
                  <textarea 
                    className="input-field" 
                    placeholder="Enter patient diagnosis..."
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                  ></textarea>
                </div>

                <div className="input-group">
                  <label className="input-label">Medical Tests / Investigations</label>
                  <textarea 
                    className="input-field" 
                    placeholder="e.g. Complete Blood Count (CBC), Chest X-Ray..."
                    value={tests}
                    onChange={(e) => setTests(e.target.value)}
                  ></textarea>
                </div>

                <div className="input-group">
                  <label className="input-label">Special Advice / Notes</label>
                  <textarea 
                    name="instructions" 
                    className="input-field" 
                    placeholder="Take medicine after meals. Drink plenty of water."
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                  ></textarea>
                </div>

                <div className="input-group">
                  <label className="input-label">Revisit Recommended (Days)</label>
                  <input 
                    type="number"
                    className="input-field" 
                    placeholder="e.g. 7"
                    value={revisitDays}
                    onChange={(e) => setRevisitDays(e.target.value)}
                    min="1"
                  />
                  <small style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "0.25rem", display: "block" }}>
                    The patient will automatically receive a reminder notification 1 day before this revisit date.
                  </small>
                </div>
                
                <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={isSubmitting || items.length === 0}>
                  {isSubmitting ? "Saving..." : "Save & Complete Appointment"}
                </button>
              </form>
            )}
            
          </div>
        </div>
      )}
      
      {/* Global styles for spinner if not already defined */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}} />
    </>
  )
}
