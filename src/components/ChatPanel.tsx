"use client"

import { useState, useEffect, useRef } from "react"
import { Send, Loader2, Clock } from "lucide-react"
import { extendConsultation } from "@/app/actions/extendConsultation"

export default function ChatPanel({ appointmentId, currentUserId, role, readOnly = false }: { appointmentId: string, currentUserId: string, role?: string, readOnly?: boolean }) {
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [isExtending, setIsExtending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/appointments/${appointmentId}/messages`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages)
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Poll every 3 seconds if not readOnly
  useEffect(() => {
    fetchMessages()
    if (readOnly) return
    const interval = setInterval(fetchMessages, 3000)
    return () => clearInterval(interval)
  }, [appointmentId, readOnly])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isSending) return

    setIsSending(true)
    const content = input.trim()
    setInput("")

    try {
      const res = await fetch(`/api/appointments/${appointmentId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content })
      })
      if (res.ok) {
        await fetchMessages() // immediate refresh
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsSending(false)
    }
  }

  const handleExtend = async () => {
    if (!confirm("Are you sure you want to extend this consultation by 15 minutes? This will delay all your subsequent appointments today and notify the affected patients.")) return
    setIsExtending(true)
    try {
      await extendConsultation(appointmentId, 15)
      alert("Consultation extended successfully. Subsequent appointments have been delayed and patients notified.")
    } catch (err: any) {
      alert("Failed to extend: " + err.message)
    } finally {
      setIsExtending(false)
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", backgroundColor: "var(--background)", borderLeft: "1px solid var(--border-color)" }}>
      <div style={{ padding: "1rem", borderBottom: "1px solid var(--border-color)", fontWeight: 600, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>{readOnly ? "Consultation Chat History" : "Consultation Chat"}</span>
        {false && !readOnly && role === "DOCTOR" && (
          <button 
            onClick={handleExtend}
            disabled={isExtending}
            className="btn btn-outline" 
            style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.25rem", color: "var(--warning-dark)", borderColor: "var(--warning)" }}
          >
            {isExtending ? <Loader2 size={12} className="spin" /> : <Clock size={12} />} 
            Extend (+15m)
          </button>
        )}
      </div>
      
      <div style={{ flex: 1, overflowY: "auto", padding: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
        {messages.map(msg => {
          const isMine = msg.senderId === currentUserId
          return (
            <div key={msg.id} style={{ alignSelf: isMine ? "flex-end" : "flex-start", maxWidth: "80%" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem", textAlign: isMine ? "right" : "left" }}>
                {msg.sender.name} ({msg.sender.role === "DOCTOR" ? "Dr." : "Patient"})
              </div>
              <div style={{
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                backgroundColor: isMine ? "var(--primary)" : "#f1f5f9",
                color: isMine ? "white" : "inherit",
                borderBottomRightRadius: isMine ? "0" : "8px",
                borderBottomLeftRadius: isMine ? "8px" : "0",
              }}>
                {msg.content}
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {!readOnly && (
        <form onSubmit={handleSend} style={{ padding: "1rem", borderTop: "1px solid var(--border-color)", display: "flex", gap: "0.5rem" }}>
          <input 
            type="text" 
            value={input} 
            onChange={e => setInput(e.target.value)} 
            placeholder="Type a message..." 
            style={{ flex: 1, padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border-color)" }}
            disabled={isSending}
          />
          <button type="submit" disabled={isSending || !input.trim()} style={{ backgroundColor: "var(--primary)", color: "white", border: "none", borderRadius: "8px", padding: "0 1rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {isSending ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
          </button>
        </form>
      )}
    </div>
  )
}
