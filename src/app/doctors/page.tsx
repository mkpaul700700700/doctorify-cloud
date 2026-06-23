import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { MapPin, Clock, DollarSign, Stethoscope } from "lucide-react"
import styles from "./page.module.css"

export const dynamic = 'force-dynamic'

export default async function DoctorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; specialty?: string }>
}) {
  const resolvedParams = await searchParams
  const query = resolvedParams.q || ""
  const specialtyFilter = resolvedParams.specialty || ""

  // Fetch doctors from DB
  const doctors = await prisma.user.findMany({
    where: {
      role: "DOCTOR",
      name: { contains: query },
      doctorProfile: {
        isVerified: true,
        ...(specialtyFilter ? { specialty: specialtyFilter } : {})
      }
    },
    include: {
      doctorProfile: true
    }
  })

  // Get unique specialties for filter
  const allProfiles = await prisma.doctorProfile.findMany({
    select: { specialty: true },
    distinct: ['specialty']
  })
  const specialties = allProfiles.map(p => p.specialty)

  return (
    <main>
      <div className={styles.header}>
        <h1 className={styles.headerTitle}>Find Your Specialist</h1>
        <p className={styles.headerSubtitle}>Browse our network of top-rated doctors and book your appointment instantly.</p>
      </div>

      <div className={styles.container}>
        {/* Basic Search UI (Server-side rendering based on URL params is simplest, but for a beautiful UI we use client-side navigation. For now, a form is easiest) */}
        <form className={styles.filters}>
          <input 
            type="text" 
            name="q" 
            defaultValue={query} 
            placeholder="Search by doctor name..." 
            className={styles.searchInput}
          />
          <select name="specialty" defaultValue={specialtyFilter} className={styles.specialtySelect}>
            <option value="">All Specialties</option>
            {specialties.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button type="submit" className="btn btn-primary">Filter</button>
        </form>

        <div className={styles.grid}>
          {doctors.map(doctor => (
            <div key={doctor.id} className={styles.doctorCard}>
              <div className={styles.cardHeader}>
                {doctor.image ? (
                  <img src={doctor.image} alt={doctor.name!} className={styles.avatar} />
                ) : (
                  <div className={styles.avatar} style={{ backgroundColor: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Stethoscope color="var(--primary)" />
                  </div>
                )}
                <div>
                  <h3 className={styles.doctorName}>{doctor.name}</h3>
                  <span className={styles.specialtyBadge}>{doctor.doctorProfile?.specialty}</span>
                </div>
              </div>
              
              <div className={styles.cardBody}>
                <p style={{ color: "var(--text)", marginBottom: "1rem", fontSize: "0.95rem" }}>
                  {doctor.doctorProfile?.bio?.substring(0, 100)}...
                </p>
                <div className={styles.infoRow}>
                  <MapPin size={16} /> <span>{doctor.doctorProfile?.clinicAddress}</span>
                </div>
                <div className={styles.infoRow}>
                  <Clock size={16} /> <span>{doctor.doctorProfile?.workingHours}</span>
                </div>
                <div className={styles.infoRow}>
                  <DollarSign size={16} /> <span>${doctor.doctorProfile?.consultationFee} per visit</span>
                </div>
              </div>

              <div className={styles.cardFooter}>
                <Link href={`/doctors/${doctor.id}`} className="btn btn-primary" style={{ width: "100%" }}>
                  Book Appointment
                </Link>
              </div>
            </div>
          ))}

          {doctors.length === 0 && (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}>
              No doctors found matching your criteria.
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
