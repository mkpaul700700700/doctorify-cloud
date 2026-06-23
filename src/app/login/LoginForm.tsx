"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function LoginForm() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (res?.error) {
        setError("Invalid email or password")
      } else {
        router.push("/dashboard")
        router.refresh()
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div style={{ color: "var(--danger)", marginBottom: "1rem", fontSize: "0.875rem" }}>
          {error}
        </div>
      )}
      <div className="input-group">
        <label className="input-label" htmlFor="email">Email Address</label>
        <input 
          id="email" 
          name="email" 
          type="email" 
          required 
          className="input-field" 
          placeholder="admin@doctorify.com" 
          defaultValue="admin@doctorify.com"
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
          defaultValue="password123"
        />
      </div>
      <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "1rem" }} disabled={isLoading}>
        {isLoading ? "Signing in..." : "Sign In"}
      </button>
    </form>
  )
}
