import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { MapPin, Clock, DollarSign, Stethoscope, Briefcase } from "lucide-react"
import styles from "./page.module.css"
import BookingForm from "./BookingForm"
import { auth } from "@/auth"
import Link from "next/link"

function formatWorkingHours(hoursStr: string | undefined | null) {
  if (!hoursStr) return "Not specified";
  const parts = hoursStr.split('-');
  if (parts.length !== 2) return hoursStr;
  const formatTime = (time: string) => {
    const [h, m] = time.trim().split(':');
    if (!h || !m) return time;
    let hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    if (hour === 0) hour = 12;
    return `${hour}:${m} ${ampm}`;
  };
  return `${formatTime(parts[0])} to ${formatTime(parts[1])}`;
}

export default async function DoctorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const resolvedParams = await params
  
  const doctor = await prisma.user.findUnique({
    where: { id: resolvedParams.id, role: "DOCTOR" },
    include: { doctorProfile: true }
  })

  if (!doctor || !doctor.doctorProfile) {
    notFound()
  }

  const profile = doctor.doctorProfile

  // 8.2 Mandatory Completion Check
  let isProfileComplete = true
  let isPatient = false

  if (session?.user?.role === "PATIENT") {
    isPatient = true
    const record = await prisma.medicalRecord.findUnique({
      where: { patientId: session.user.id }
    })
    
    isProfileComplete = !!(record && record.dob && record.gender && record.bloodGroup && record.emergencyPhone)
  }

  return (
    <main style={{ backgroundColor: "var(--background)", minHeight: "calc(100vh - 70px)" }}>
      <div className={styles.container}>
        
        {/* Profile Details */}
        <div className={styles.profileSection}>
          <div className={styles.profileHeader}>
            {doctor.image ? (
              <img src={doctor.image} alt={doctor.name!} className={styles.avatar} />
            ) : (
              <div className={styles.avatar} style={{ backgroundColor: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Stethoscope color="var(--primary)" size={40} />
              </div>
            )}
            <div>
              <h1 className={styles.doctorName}>{doctor.name}</h1>
              <div className={styles.specialtyBadge}>{profile.specialty}</div>
            </div>
          </div>

          <h3 className={styles.sectionTitle}>About {doctor.name}</h3>
          <p className={styles.bio}>
            {profile.qualifications || "No qualifications provided."}
          </p>

          <h3 className={styles.sectionTitle}>Clinic Information</h3>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <div className={styles.iconWrapper}><MapPin size={20} /></div>
              <div className={styles.infoText}>
                <h4>Location</h4>
                <p>{profile.clinicAddress}</p>
              </div>
            </div>
            
            <div className={styles.infoItem}>
              <div className={styles.iconWrapper}><Clock size={20} /></div>
              <div className={styles.infoText}>
                <h4>Working Hours</h4>
                <p>{formatWorkingHours(profile.workingHours)}<br/><span style={{fontSize: "0.8rem", color: "var(--text-muted)"}}>{profile.availableDays}</span></p>
              </div>
            </div>

            <div className={styles.infoItem}>
              <div className={styles.iconWrapper}><Briefcase size={20} /></div>
              <div className={styles.infoText}>
                <h4>Experience</h4>
                <p>{profile.experience}+ Years</p>
              </div>
            </div>

            <div className={styles.infoItem}>
              <div className={styles.iconWrapper}><DollarSign size={20} /></div>
              <div className={styles.infoText}>
                <h4>Consultation Fee</h4>
                <p>${profile.consultationFee.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Section */}
        <div className={styles.bookingSection}>
          {isPatient && !isProfileComplete ? (
            <div style={{ padding: "2rem", backgroundColor: "#fee2e2", borderRadius: "8px", border: "1px solid #fca5a5", textAlign: "center" }}>
              <h3 style={{ color: "#991b1b", marginBottom: "1rem", fontSize: "1.25rem", fontWeight: "bold" }}>Medical Profile Incomplete</h3>
              <p style={{ color: "#7f1d1d", marginBottom: "1.5rem" }}>You must complete your mandatory Medical Profile before you can book an appointment.</p>
              <Link href="/dashboard" className="btn btn-primary" style={{ display: "inline-block" }}>Complete Profile</Link>
            </div>
          ) : (
            <BookingForm doctorId={doctor.id} isLoggedIn={!!session} />
          )}
        </div>

      </div>
    </main>
  )
}
