import Link from "next/link"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Activity } from "lucide-react"
import styles from "./Navbar.module.css"
import { signOut } from "@/auth"
import NotificationBell from "./NotificationBell"

export default async function Navbar() {
  const session = await auth()
  
  let notifications: any[] = []
  let fullUser = null
  if (session?.user?.id) {
    notifications = await prisma.inAppNotification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 10
    })
    fullUser = await prisma.user.findUnique({ where: { id: session.user.id }})
  }

  return (
    <nav className={styles.nav}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          <Activity size={24} /> Doctorify
        </Link>

        <div className={styles.links}>
          <Link href="/doctors" className={styles.link}>Doctors</Link>
          
          {session ? (
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <NotificationBell notifications={notifications} />
              
              {fullUser?.image && (
                <img src={fullUser.image} alt="Avatar" style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover", border: "1px solid var(--border)" }} />
              )}
              
              <Link href="/dashboard" className={styles.link}>Dashboard</Link>
              <form action={async () => {
                "use server"
                await signOut()
              }}>
                <button type="submit" className="btn btn-outline" style={{ padding: "0.4rem 1rem" }}>
                  Logout
                </button>
              </form>
            </div>
          ) : (
            <Link href="/login" className="btn btn-primary" style={{ padding: "0.5rem 1.25rem" }}>
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
