"use client"

import { useState } from "react"
import { verifyPayment } from "@/app/actions/verifyPayment"
import { Loader2, CreditCard, Lock, Calendar, ShieldCheck, AlertCircle } from "lucide-react"

export default function MockCheckoutClient({ 
  appointmentId, 
  amount,
  date,
  time
}: { 
  appointmentId: string, 
  amount: number,
  date: string,
  time: string
}) {
  const [cardNumber, setCardNumber] = useState("")
  const [expiry, setExpiry] = useState("")
  const [cvc, setCvc] = useState("")
  const [name, setName] = useState("")
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState("")

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = v.match(/\d{4,16}/g)
    const match = matches && matches[0] || ''
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    if (parts.length) {
      return parts.join(' ')
    } else {
      return value
    }
  }

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)
    setError("")
    
    try {
      await verifyPayment(appointmentId, cardNumber)
      // Redirect happens in server action
    } catch (err: any) {
      setError(err.message || "Payment failed.")
      setIsProcessing(false)
    }
  }

  return (
    <div style={{ background: "white", borderRadius: "1rem", boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)", overflow: "hidden" }}>
      
      {/* Order Summary Header */}
      <div style={{ background: "#f8fafc", padding: "1.5rem", borderBottom: "1px solid #e2e8f0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
          <span style={{ color: "#64748b", fontWeight: 500 }}>Total Due</span>
          <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a" }}>৳{amount.toFixed(2)}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#64748b", fontSize: "0.875rem" }}>
          <Calendar size={14} /> {date} at {time}
        </div>
      </div>

      <form onSubmit={handlePay} style={{ padding: "1.5rem" }}>
        
        {error && (
          <div style={{ background: "#fef2f2", color: "#b91c1c", padding: "0.75rem 1rem", borderRadius: "0.5rem", marginBottom: "1.5rem", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* Mock Info Banner */}
        <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", padding: "0.75rem 1rem", borderRadius: "0.5rem", marginBottom: "1.5rem", fontSize: "0.85rem", color: "#1e40af", display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
          <ShieldCheck size={20} style={{ flexShrink: 0, marginTop: "2px" }} />
          <div>
            <strong>Test Mode Enabled.</strong> Use the dummy card number <code>4242 4242 4242 4242</code> with any future date and CVC to simulate a successful payment.
          </div>
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "#334155", marginBottom: "0.5rem" }}>Card Information</label>
          <div style={{ border: "1px solid #cbd5e1", borderRadius: "0.5rem", overflow: "hidden", background: "white", transition: "all 0.2s" }}>
            <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid #cbd5e1", padding: "0 1rem" }}>
              <CreditCard size={18} color="#94a3b8" />
              <input 
                type="text" 
                placeholder="Card number" 
                value={cardNumber}
                onChange={e => setCardNumber(formatCardNumber(e.target.value))}
                maxLength={19}
                required
                style={{ width: "100%", padding: "1rem", border: "none", outline: "none", fontSize: "1rem", color: "#334155" }}
              />
            </div>
            <div style={{ display: "flex" }}>
              <input 
                type="text" 
                placeholder="MM / YY" 
                value={expiry}
                onChange={e => setExpiry(e.target.value)}
                maxLength={7}
                required
                style={{ width: "50%", padding: "1rem", border: "none", borderRight: "1px solid #cbd5e1", outline: "none", fontSize: "1rem", color: "#334155" }}
              />
              <input 
                type="text" 
                placeholder="CVC" 
                value={cvc}
                onChange={e => setCvc(e.target.value)}
                maxLength={4}
                required
                style={{ width: "50%", padding: "1rem", border: "none", outline: "none", fontSize: "1rem", color: "#334155" }}
              />
            </div>
          </div>
        </div>

        <div style={{ marginBottom: "2rem" }}>
          <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "#334155", marginBottom: "0.5rem" }}>Name on card</label>
          <input 
            type="text" 
            placeholder="John Doe" 
            value={name}
            onChange={e => setName(e.target.value)}
            required
            style={{ width: "100%", padding: "1rem", border: "1px solid #cbd5e1", borderRadius: "0.5rem", outline: "none", fontSize: "1rem", color: "#334155", transition: "all 0.2s" }}
          />
        </div>

        <button 
          type="submit" 
          disabled={isProcessing}
          style={{ 
            width: "100%", 
            background: "#6366f1", 
            color: "white", 
            padding: "1rem", 
            borderRadius: "0.5rem", 
            fontSize: "1rem", 
            fontWeight: 600, 
            border: "none", 
            cursor: isProcessing ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            boxShadow: "0 4px 6px -1px rgba(99, 102, 241, 0.4)",
            transition: "all 0.2s"
          }}
        >
          {isProcessing ? (
            <>
              <Loader2 size={18} className="spin" /> Processing Payment...
            </>
          ) : (
            <>
              <Lock size={16} /> Pay ৳{amount.toFixed(2)}
            </>
          )}
        </button>

      </form>
    </div>
  )
}
