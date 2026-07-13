import { Suspense } from "react"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import styles from "./page.module.css"
import ImageUpload from "@/components/ImageUpload"
import { updateAvatar } from "@/app/actions/updateProfileImages"
import Link from "next/link"
import DashboardContent from "./DashboardContent"
import DashboardSkeleton from "./DashboardSkeleton"

export const dynamic = 'force-dynamic'

export default async function DashboardPage(props: { searchParams: Promise<{ payment?: string, session_id?: string }> }) {
  const searchParams = await props.searchParams

  // Fast: just reads JWT token, no DB call
  const sessionUser = await auth()
  if (!sessionUser?.user) {
    redirect("/login")
  }

  const { id, role, name } = sessionUser.user

  // Minimal DB fetch — only what's needed for the header (avatar image)
  const headerUser = await prisma.user.findUnique({
    where: { id },
    select: { image: true }
  })

  if (!headerUser) redirect("/login")

  return (
    <main style={{ backgroundColor: "var(--background)", minHeight: "calc(100vh - 70px)" }}>

      {/* ✅ HEADER — renders immediately (fast, minimal DB) */}
      {role !== "ADMIN" && (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "3rem 2rem 1.5rem" }}>
          <div className={styles.header} style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
            <ImageUpload
              currentImageUrl={headerUser.image}
              onUploadSuccess={async (url) => {
                "use server"
                await updateAvatar(url)
              }}
              isAvatar={true}
            />
            <div style={{ flex: 1 }}>
              <h1 className={styles.title}>Welcome back, {name}</h1>
              <p className={styles.subtitle}>Here is your {role.toLowerCase()} dashboard overview.</p>
            </div>
            {role === "PATIENT" && (
              <Link href="/doctors" className="btn btn-primary">Book New Appointment</Link>
            )}
          </div>
        </div>
      )}

      {/* ✅ CONTENT — streamed in while skeleton shows */}
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent
          userId={id}
          role={role}
          name={name || ""}
          paymentParam={searchParams?.payment}
          sessionIdParam={searchParams?.session_id}
        />
      </Suspense>

    </main>
  )
}
