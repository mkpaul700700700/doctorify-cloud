import { auth } from "@/auth"
import { redirect } from "next/navigation"
import LoginForm from "./LoginForm"
import { Activity } from "lucide-react"

export default async function LoginPage() {
  const session = await auth()

  if (session) {
    redirect("/dashboard")
  }

  return (
    <main style={{ minHeight: "calc(100vh - 70px)", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--background)", padding: "2rem" }}>
      <div className="card" style={{ maxWidth: "400px", width: "100%" }}>
        <div className="text-center mb-8">
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "64px", height: "64px", borderRadius: "var(--radius-full)", backgroundColor: "rgba(0, 91, 150, 0.1)", color: "var(--primary)", marginBottom: "1rem" }}>
            <Activity size={32} />
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: "700" }}>Welcome Back</h1>
          <p className="text-muted" style={{ marginTop: "0.5rem" }}>Sign in to access your portal</p>
        </div>

        <LoginForm />

        <div className="text-center mt-4">
          <p className="text-muted" style={{ fontSize: "0.875rem" }}>
            Don't have an account? <a href="/register" style={{ color: "var(--primary)", fontWeight: 600 }}>Create one</a>
          </p>
        </div>
      </div>
    </main>
  )
}
