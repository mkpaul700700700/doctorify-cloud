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
    
    // Save credentials temporarily for auto-fill after OTP verification
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    if (email) sessionStorage.setItem("tempEmail", email)
    if (password) sessionStorage.setItem("tempPassword", password)
    
    try {
      await registerUser(formData)
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
      setIsLoading(false)
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
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
            <div className="input-group">
              <label className="input-label" htmlFor="experience">Years of Experience <span style={{color:"red"}}>*</span></label>
              <input 
                id="experience" 
                name="experience" 
                type="number" 
                required 
                min="0"
                max="60"
                className="input-field" 
                placeholder="e.g. 10" 
              />
            </div>
          </div>
        )}

        <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "1rem" }} disabled={isLoading}>
          {isLoading ? "Creating Account..." : "Create Account"}
        </button>
      </form>

      <div style={{ display: "flex", alignItems: "center", margin: "0.5rem 0" }}>
        <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border-color)" }}></div>
        <span style={{ padding: "0 10px", color: "var(--text-muted)", fontSize: "0.875rem" }}>OR</span>
        <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border-color)" }}></div>
      </div>

      <button 
        type="button" 
        className="btn" 
        style={{ width: "100%", backgroundColor: "white", color: "#333", border: "1px solid #d1d5db", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }} 
        onClick={() => {
          import("next-auth/react").then(({ signIn }) => signIn("google", { callbackUrl: "/dashboard" }))
        }}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
          <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
            <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
            <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
            <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
            <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
          </g>
        </svg>
        <span style={{ fontWeight: 500 }}>Continue with Google</span>
      </button>
    </div>
  )
}
