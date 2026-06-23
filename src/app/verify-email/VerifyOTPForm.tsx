"use client"

import { useState } from "react"
import { verifyOTP } from "@/app/actions/verifyOTP"
import { useRouter } from "next/navigation"
import { CheckCircle } from "lucide-react"

export default function VerifyOTPForm({ email }: { email: string }) {
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    formData.append("email", email)
    
    try {
      const res = await verifyOTP(formData)
      if (res?.success) {
        setIsSuccess(true)
        setTimeout(() => {
          router.push("/login?verified=true")
        }, 2000)
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div style={{ textAlign: "center", padding: "2rem" }}>
        <CheckCircle size={64} color="var(--success)" style={{ margin: "0 auto 1rem auto" }} />
        <h3 style={{ fontSize: "1.5rem", color: "var(--success)", marginBottom: "0.5rem" }}>Email Verified!</h3>
        <p style={{ color: "var(--text-muted)" }}>Redirecting you to the login page...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div style={{ color: "var(--danger)", marginBottom: "1rem", fontSize: "0.875rem", padding: "0.5rem", backgroundColor: "rgba(239, 68, 68, 0.1)", borderRadius: "var(--radius-sm)" }}>
          {error}
        </div>
      )}
      <div className="input-group">
        <label className="input-label" htmlFor="otp">Verification Code</label>
        <input 
          id="otp" 
          name="otp" 
          type="text" 
          required 
          className="input-field" 
          placeholder="123456" 
          maxLength={6}
          style={{ letterSpacing: "4px", fontSize: "1.25rem", textAlign: "center" }}
        />
        <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.5rem", textAlign: "center" }}>
          Please enter the 6-digit code sent to {email}
        </p>
      </div>
      <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "1rem" }} disabled={isLoading}>
        {isLoading ? "Verifying..." : "Verify Email"}
      </button>
    </form>
  )
}
