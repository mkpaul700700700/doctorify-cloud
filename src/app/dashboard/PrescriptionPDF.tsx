import { QRCodeSVG } from "qrcode.react"

export default function PrescriptionPDF({ data }: { data: any }) {
  if (!data || !data.prescription) return null;

  return (
    <div id={`pdf-template-${data.appointmentId}`} style={{ display: 'none' }}>
      <div style={{ padding: "40px", fontFamily: "sans-serif", color: "#333", backgroundColor: "white", width: "800px", minHeight: "1050px" }}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "3px solid var(--primary)", paddingBottom: "20px", marginBottom: "20px" }}>
          <div>
            <h1 style={{ color: "var(--primary)", margin: 0, fontSize: "28px", fontWeight: "bold" }}>Doctorify Hospital</h1>
            <p style={{ margin: "5px 0 0 0", fontSize: "14px", color: "#666" }}>123 Health Avenue, Dhaka 1212</p>
            <p style={{ margin: "2px 0 0 0", fontSize: "14px", color: "#666" }}>Phone: +880 1234 567890</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <h2 style={{ margin: 0, fontSize: "20px", color: "#333" }}>Dr. {data.doctorName}</h2>
            <p style={{ margin: "5px 0 0 0", fontSize: "14px", color: "#666" }}>{data.doctorSpecialty}</p>
            <p style={{ margin: "2px 0 0 0", fontSize: "14px", color: "#666" }}>Date: {new Date(data.prescription.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Patient Details */}
        <div style={{ display: "flex", justifyContent: "space-between", backgroundColor: "#f8fafc", padding: "15px", borderRadius: "8px", marginBottom: "30px" }}>
          <div>
            <p style={{ margin: 0 }}><strong>Patient Name:</strong> {data.patientName}</p>
          </div>
          <div>
            <p style={{ margin: 0 }}><strong>Age/Sex:</strong> {data.patientAge || "N/A"} / {data.patientGender || "N/A"}</p>
          </div>
          <div>
            <p style={{ margin: 0 }}><strong>Date:</strong> {new Date(data.prescription.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Clinical Info */}
        <div style={{ display: "flex", gap: "20px", minHeight: "500px" }}>
          {/* Left Column (Tests/Advice) */}
          <div style={{ width: "30%", borderRight: "1px solid #e2e8f0", paddingRight: "20px" }}>
            {data.prescription.diagnosis && (
              <div style={{ marginBottom: "20px" }}>
                <h4 style={{ margin: "0 0 10px 0", borderBottom: "1px solid #e2e8f0", paddingBottom: "5px" }}>Diagnosis</h4>
                <p style={{ fontSize: "14px", margin: 0, whiteSpace: "pre-wrap" }}>{data.prescription.diagnosis}</p>
              </div>
            )}
            
            {data.prescription.tests && (
              <div style={{ marginBottom: "20px" }}>
                <h4 style={{ margin: "0 0 10px 0", borderBottom: "1px solid #e2e8f0", paddingBottom: "5px" }}>Investigations</h4>
                <p style={{ fontSize: "14px", margin: 0, whiteSpace: "pre-wrap" }}>{data.prescription.tests}</p>
              </div>
            )}

            {data.prescription.instructions && (
              <div style={{ marginBottom: "20px" }}>
                <h4 style={{ margin: "0 0 10px 0", borderBottom: "1px solid #e2e8f0", paddingBottom: "5px" }}>Advice</h4>
                <p style={{ fontSize: "14px", margin: 0, whiteSpace: "pre-wrap" }}>{data.prescription.instructions}</p>
              </div>
            )}
          </div>

          {/* Right Column (Medicines Rx) */}
          <div style={{ width: "70%", paddingLeft: "20px" }}>
            <h1 style={{ margin: "0 0 20px 0", fontSize: "36px", color: "var(--primary)", fontFamily: "serif" }}>Rx</h1>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {data.prescription.items.map((item: any, idx: number) => (
                <li key={idx} style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: "bold", fontSize: "16px", marginBottom: "5px" }}>{idx + 1}. {item.type === 'Test' ? `[Test] ${item.medicineName}` : item.medicineName}</div>
                    {item.type !== 'Test' && (
                      <div style={{ display: "flex", gap: "20px", fontSize: "14px", color: "#444" }}>
                        <span>Dosage: {item.dosage}</span>
                        <span>Duration: {item.days} Days</span>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>

          </div>
        </div>

        {/* Footer with Signature and QR Code */}
        <div style={{ marginTop: "auto", borderTop: "1px solid #e2e8f0", paddingTop: "20px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ textAlign: "center" }}>
            <QRCodeSVG value={`https://doctorify.com/verify/${data.prescription.id}`} size={80} />
            <p style={{ fontSize: "10px", margin: "5px 0 0 0", color: "#666" }}>Scan to Verify Authenticity</p>
          </div>
          
          <div style={{ textAlign: "center" }}>
            <div style={{ borderBottom: "1px solid #333", width: "200px", marginBottom: "10px" }}></div>
            <p style={{ margin: 0, fontWeight: "bold" }}>Dr. {data.doctorName}</p>
            <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>Signature</p>
          </div>
        </div>
        
      </div>
    </div>
  )
}
