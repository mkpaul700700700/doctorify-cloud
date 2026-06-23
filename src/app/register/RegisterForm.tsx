"use client"

import { useState } from "react"
import { registerUser } from "@/app/actions/registerUser"

export default function RegisterForm() {
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [role, setRole] = useState("PATIENT")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    
    try {
      await registerUser(formData)
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div style={{ color: "var(--danger)", marginBottom: "1rem", fontSize: "0.875rem", padding: "0.5rem", backgroundColor: "rgba(239, 68, 68, 0.1)", borderRadius: "var(--radius-sm)" }}>
          {error}
        </div>
      )}
      <div className="input-group">
        <label className="input-label" htmlFor="name">Full Name</label>
        <input 
          id="name" 
          name="name" 
          type="text" 
          required 
          className="input-field" 
          placeholder="John Doe" 
        />
      </div>
      <div className="input-group">
        <label className="input-label" htmlFor="email">Email Address</label>
        <input 
          id="email" 
          name="email" 
          type="email" 
          required 
          className="input-field" 
          placeholder="you@example.com" 
        />
      </div>
      <div className="input-group">
        <label className="input-label" htmlFor="password">Password</label>
        <input 
          id="password" 
          name="password" 
          type="password" 
          required 
          className="input-field" 
          placeholder="••••••••" 
          minLength={6}
        />
      </div>

      <div className="input-group">
        <label className="input-label" htmlFor="role">Account Type</label>
        <select 
          id="role" 
          name="role" 
          className="input-field" 
          value={role} 
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="PATIENT">Patient</option>
          <option value="DOCTOR">Doctor</option>
        </select>
      </div>

      {role === "DOCTOR" && (
        <div style={{ padding: "1rem", backgroundColor: "rgba(2, 132, 199, 0.05)", border: "1px solid var(--primary-light)", borderRadius: "8px", marginBottom: "1.5rem" }}>
          <h4 style={{ color: "var(--primary-dark)", marginBottom: "1rem", fontSize: "0.95rem" }}>Doctor Credentials</h4>
          <div className="input-group">
            <label className="input-label" htmlFor="specialty">Medical Specialty <span style={{color:"red"}}>*</span></label>
            <input 
              id="specialty" 
              name="specialty" 
              type="text" 
              required 
              className="input-field" 
              placeholder="e.g. Cardiologist" 
            />
          </div>
          <div className="input-group">
            <label className="input-label" htmlFor="qualifications">Degrees / Qualifications <span style={{color:"red"}}>*</span></label>
            <input 
              id="qualifications" 
              name="qualifications" 
              type="text" 
              required 
              className="input-field" 
              placeholder="e.g. MBBS, MD, FCPS" 
            />
          </div>
        </div>
      )}

      <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "1rem" }} disabled={isLoading}>
        {isLoading ? "Creating Account..." : "Create Account"}
      </button>
    </form>
  )
}
