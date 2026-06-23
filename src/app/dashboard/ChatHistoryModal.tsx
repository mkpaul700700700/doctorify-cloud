"use client"

import { useState } from "react"
import { MessageSquare, X } from "lucide-react"
import ChatPanel from "@/components/ChatPanel"

export default function ChatHistoryModal({ 
  appointmentId, 
  currentUserId,
  role,
  compact = false
}: { 
  appointmentId: string, 
  currentUserId: string,
  role: string,
  compact?: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)} 
        className="btn btn-outline" 
        style={compact 
          ? { padding: "0.25rem 0.5rem", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.25rem" }
          : { padding: "0.5rem 1rem", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.5rem" }
        }
      >
        <MessageSquare size={compact ? 12 : 16} /> View Chat
      </button>

      {isOpen && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "var(--surface)", width: "100%", maxWidth: "450px", height: "70vh", borderRadius: "var(--radius-lg)", display: "flex", flexDirection: "column", boxShadow: "var(--shadow-lg)", overflow: "hidden" }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.5rem", borderBottom: "1px solid var(--border-color)", backgroundColor: "#f8fafc" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 600, margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <MessageSquare size={18} color="var(--primary)" /> Consultation Chat History
              </h2>
              <button onClick={() => setIsOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
              {/* Reuse ChatPanel in readOnly mode */}
              <ChatPanel 
                appointmentId={appointmentId} 
                currentUserId={currentUserId} 
                role={role} 
                readOnly={true} 
              />
            </div>
            
          </div>
        </div>
      )}
    </>
  )
}
