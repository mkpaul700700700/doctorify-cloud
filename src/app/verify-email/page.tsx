import VerifyOTPForm from "./VerifyOTPForm"
import { ShieldCheck } from "lucide-react"

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>
}) {
  const resolvedParams = await searchParams
  const email = resolvedParams.email || ""

  return (
    <main style={{ backgroundColor: "var(--background)", minHeight: "calc(100vh - 70px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ maxWidth: "450px", width: "100%", backgroundColor: "var(--surface)", padding: "2.5rem", borderRadius: "12px", boxShadow: "var(--shadow-lg)", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
          <div style={{ backgroundColor: "rgba(2, 132, 199, 0.1)", padding: "1rem", borderRadius: "50%", color: "var(--primary)" }}>
            <ShieldCheck size={48} />
          </div>
        </div>
        
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--text-color)", marginBottom: "0.5rem" }}>Verify Your Email</h1>
        <p style={{ color: "var(--text-muted)", marginBottom: "2rem", lineHeight: 1.5 }}>
          We've sent a 6-digit verification code to your email address. Please enter it below to activate your account.
        </p>

        {email ? (
          <VerifyOTPForm email={email} />
        ) : (
          <div style={{ color: "var(--danger)", padding: "1rem", backgroundColor: "rgba(239, 68, 68, 0.1)", borderRadius: "var(--radius-sm)" }}>
            No email address provided. Please register again.
          </div>
        )}
      </div>
    </main>
  )
}
