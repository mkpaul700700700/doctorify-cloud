import Link from "next/link"
import { Calendar, Shield, Activity, ArrowRight } from "lucide-react"
import styles from "./page.module.css"

export default function LandingPage() {
  return (
    <main>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.title}>
            Healthcare at Your Fingertips.
          </h1>
          <p className={styles.subtitle}>
            Book appointments, manage records, and connect with top-tier medical professionals seamlessly. Experience the future of personal healthcare today.
          </p>
          <div className={styles.buttonGroup}>
            <Link href="/doctors" className="btn btn-primary">
              Find a Doctor <ArrowRight size={18} style={{ marginLeft: "8px" }} />
            </Link>
            <Link href="/login" className="btn btn-outline">
              Patient Portal
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features}>
        <div className="container">
          <div className="text-center">
            <h2 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>Why Choose Doctorify?</h2>
            <p className="text-muted" style={{ maxWidth: "600px", margin: "0 auto" }}>
              We've redesigned the patient-doctor experience from the ground up to be intuitive, fast, and completely secure.
            </p>
          </div>

          <div className={styles.featuresGrid}>
            <div className={`card ${styles.featureCard}`}>
              <div className={styles.iconWrapper}>
                <Calendar size={32} />
              </div>
              <h3 className={styles.featureTitle}>Instant Booking</h3>
              <p className={styles.featureDesc}>
                View real-time availability and book your appointment instantly without waiting on hold.
              </p>
            </div>
            
            <div className={`card ${styles.featureCard}`}>
              <div className={styles.iconWrapper}>
                <Activity size={32} />
              </div>
              <h3 className={styles.featureTitle}>Top Specialists</h3>
              <p className={styles.featureDesc}>
                Access a curated network of highly rated, board-certified medical professionals.
              </p>
            </div>

            <div className={`card ${styles.featureCard}`}>
              <div className={styles.iconWrapper}>
                <Shield size={32} />
              </div>
              <h3 className={styles.featureTitle}>Secure Records</h3>
              <p className={styles.featureDesc}>
                Your medical data is encrypted and securely stored, accessible only to you and your doctor.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
