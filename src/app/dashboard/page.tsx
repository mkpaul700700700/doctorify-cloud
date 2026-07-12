import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Calendar, Clock, Activity, FilePlus, Users, UserCog, Video } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"
import styles from "./page.module.css"
import MedicalProfileForm from "./MedicalProfileForm"
import PrescriptionModal from "./PrescriptionModal"
import ScheduleManager from "./ScheduleManager"
import JoinConsultationButton from "./JoinConsultationButton"
import PatientAppointmentActions from "./PatientAppointmentActions"
import ChatHistoryModal from "./ChatHistoryModal"
import AdminAnalytics from "./AdminAnalytics"
import AdminDoctorApprovals from "./AdminDoctorApprovals"
import ImageUpload from "@/components/ImageUpload"
import { updateAvatar, updateSignature } from "@/app/actions/updateProfileImages"
import Stripe from "stripe"
import { sendNotificationEmail } from "@/lib/email"

export const dynamic = 'force-dynamic'

export default async function DashboardPage(props: { searchParams: Promise<{ payment?: string, session_id?: string }> }) {
  const searchParams = await props.searchParams
  const sessionUser = await auth()

  if (!sessionUser?.user) {
    redirect("/login")
  }

  const { id, role, name } = sessionUser.user

  // Fetch full user to get latest image and doctor profile
  const fullUser = await prisma.user.findUnique({
    where: { id },
    include: { doctorProfile: true }
  })
  
  if (!fullUser) redirect("/login")

  // Synchronous Stripe Verification (Fix for local dev without Webhooks)
  if (searchParams?.payment === "success" && searchParams?.session_id) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: "2024-11-20.acacia" as any })
      const checkoutSession = await stripe.checkout.sessions.retrieve(searchParams.session_id)
      
      if (checkoutSession.payment_status === "paid" && checkoutSession.metadata?.appointmentId) {
        const appointmentId = checkoutSession.metadata.appointmentId
        
        // Check if already processed
        const existingAppt = await prisma.appointment.findUnique({ where: { id: appointmentId }, include: { doctor: true, patient: true } })
        
        if (existingAppt && existingAppt.status !== "CONFIRMED") {
          // Update DB
          await prisma.appointment.update({
            where: { id: appointmentId },
            data: { paymentStatus: "PAID", status: "CONFIRMED" }
          })

          // Notify Doctor
          await prisma.inAppNotification.create({
            data: { userId: existingAppt.doctorId, message: `New paid appointment confirmed from ${existingAppt.patient.name} for ${existingAppt.date.toISOString().split('T')[0]} at ${existingAppt.time}.` }
          })

          // Notify Patient
          await prisma.inAppNotification.create({
            data: { userId: existingAppt.patientId, message: `Your payment was successful! Appointment with Dr. ${existingAppt.doctor.name} is confirmed.` }
          })

          // Send Emails
          const dateStr = existingAppt.date.toISOString().split('T')[0]
          await sendNotificationEmail(
            existingAppt.doctor.name || "Doctor", existingAppt.doctor.email || "", "Payment Confirmed - New Appointment - Doctorify",
            `<p>You have a new paid appointment from <strong>${existingAppt.patient.name}</strong>.</p><p>Date: ${dateStr} at ${existingAppt.time}</p>`
          )
          await sendNotificationEmail(
            existingAppt.patient.name || "Patient", existingAppt.patient.email || "", "Payment Successful - Doctorify",
            `<p>Your payment was successful!</p><p>Your appointment with Dr. ${existingAppt.doctor.name} is now confirmed for <strong>${dateStr} at ${existingAppt.time}</strong>.</p>`
          )
        }
      }
    } catch (e) {
      console.error("Stripe verification error:", e)
    }
  }

  let appointments: any[] = []
  let medicalRecord = null
  let medicalReports: any[] = []
  let doctorSchedules: any[] = []
  let specialSchedules: any[] = []
  let allUsers: any[] = []
  let unverifiedDoctors: any[] = []
  let isVerifiedDoctor = true

  if (role === "PATIENT") {
    appointments = await prisma.appointment.findMany({
      where: { patientId: id },
      include: { 
        doctor: { include: { doctorProfile: true } },
        prescription: { include: { items: true } }
      },
      orderBy: { date: "asc" }
    })
    
    medicalRecord = await prisma.medicalRecord.findUnique({
      where: { patientId: id }
    })
    medicalReports = await prisma.medicalReport.findMany({
      where: { patientId: id },
      orderBy: { createdAt: "desc" }
    })
  } else if (role === "DOCTOR") {
    appointments = await prisma.appointment.findMany({
      where: { doctorId: id },
      include: { 
        patient: { include: { medicalRecord: true, medicalReports: true } },
        prescription: { include: { items: true } } 
      },
      orderBy: { date: "asc" }
    })
    const docProfile = await prisma.doctorProfile.findUnique({ where: { userId: id } })
    isVerifiedDoctor = docProfile?.isVerified || false

    doctorSchedules = await prisma.doctorSchedule.findMany({ where: { doctorId: id } })
    specialSchedules = await prisma.specialSchedule.findMany({ where: { doctorId: id }, orderBy: { date: "asc" } })
  } else if (role === "ADMIN") {
    appointments = await prisma.appointment.findMany({
      include: { doctor: true, patient: true },
      orderBy: { date: "desc" }
    })
    allUsers = await prisma.user.findMany({
      orderBy: { role: "asc" }
    })
    unverifiedDoctors = await prisma.doctorProfile.findMany({
      where: { isVerified: false },
      include: { user: true }
    })
  }

  const nowStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" });
  const nowDhaka = new Date(nowStr);

  const isPastAppointment = (app: any) => {
    if (app.status === "COMPLETED" || app.status === "CANCELLED" || app.status === "CANCELLED_EMERGENCY") return true;
    
    const [year, month, day] = app.date.toISOString().split("T")[0].split("-").map(Number);
    const [hours, minutes] = app.time.split(':').map(Number);
    const appEndTime = new Date(year, month - 1, day, hours, minutes + 15, 0);
    
    return nowDhaka > appEndTime;
  };

  const upcoming = appointments
    .filter(a => !isPastAppointment(a))
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      if (dateA !== dateB) return dateA - dateB
      return a.time.localeCompare(b.time)
    })

  const past = appointments
    .filter(a => isPastAppointment(a))
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      if (dateA !== dateB) return dateB - dateA
      return b.time.localeCompare(a.time)
    })

  if (role === "ADMIN") {
    const totalPatients = allUsers.filter(u => u.role === "PATIENT").length
    const totalDoctors = allUsers.filter(u => u.role === "DOCTOR").length
    
    // Calculate Total Revenue from PAID appointments
    const totalRevenue = appointments
      .filter(a => a.paymentStatus === "PAID" && a.amount)
      .reduce((sum, a) => sum + (a.amount || 0), 0)

    return (
      <main style={{ backgroundColor: "var(--background)", minHeight: "calc(100vh - 70px)" }}>
        <div className={styles.container}>
          
          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>System Administration</h1>
              <p className={styles.subtitle}>Welcome back, {name}. Here is the platform overview.</p>
            </div>
          </div>

          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}><Users size={28} /></div>
              <div>
                <div className={styles.statValue}>{totalPatients}</div>
                <div className={styles.statLabel}>Registered Patients</div>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}><UserCog size={28} /></div>
              <div>
                <div className={styles.statValue}>{totalDoctors}</div>
                <div className={styles.statLabel}>Active Doctors</div>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: "rgba(16, 185, 129, 0.1)", color: "var(--primary-color)" }}>
                <span style={{ fontSize: "24px", fontWeight: "bold" }}>৳</span>
              </div>
              <div className={styles.statInfo}>
                <div className={styles.statValue}>{totalRevenue.toLocaleString()}</div>
                <div className={styles.statLabel}>Total Revenue Generated</div>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: "rgba(245, 158, 11, 0.1)", color: "var(--warning)" }}>
                <Activity size={24} />
              </div>
              <div className={styles.statInfo}>
                <div className={styles.statValue}>{appointments.filter(a => a.status === 'PENDING').length}</div>
                <div className={styles.statLabel}>Pending Actions</div>
              </div>
            </div>
          </div>

          {unverifiedDoctors.length > 0 && (
            <div className={styles.section} style={{ marginTop: '2rem', border: '2px solid var(--primary)', background: 'rgba(2, 132, 199, 0.05)' }}>
              <div className={styles.sectionHeader} style={{ color: 'var(--primary-dark)' }}>Pending Doctor Approvals</div>
              <AdminDoctorApprovals unverifiedDoctors={unverifiedDoctors} />
            </div>
          )}

          <div className={styles.section} style={{ marginTop: '2rem' }}>
            <div className={styles.sectionHeader}>Advanced Analytics</div>
            <AdminAnalytics />
          </div>

          <div className={styles.section}>
            <div className={styles.sectionHeader}>All System Appointments</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ backgroundColor: "var(--surface-hover)", borderBottom: "2px solid rgba(0,0,0,0.05)" }}>
                    <th style={{ padding: "1rem 1.5rem" }}>Date & Time</th>
                    <th style={{ padding: "1rem 1.5rem" }}>Patient</th>
                    <th style={{ padding: "1rem 1.5rem" }}>Doctor</th>
                    <th style={{ padding: "1rem 1.5rem" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map(app => (
                    <tr key={app.id} style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                      <td style={{ padding: "1rem 1.5rem" }}>{format(new Date(app.date), 'MMM d, yyyy')} at {app.time}</td>
                      <td style={{ padding: "1rem 1.5rem", fontWeight: 500 }}>{app.patient?.name}</td>
                      <td style={{ padding: "1rem 1.5rem", color: "var(--primary)" }}>Dr. {app.doctor?.name}</td>
                      <td style={{ padding: "1rem 1.5rem" }}>
                        <span className={`${styles.badge} ${
                          app.status === 'PENDING' ? styles.badgePending :
                          app.status === 'CONFIRMED' ? styles.badgeConfirmed : 
                          app.status === 'COMPLETED' ? styles.badgeCompleted : ''
                        }`}>
                          {app.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionHeader}>User Directory</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ backgroundColor: "var(--surface-hover)", borderBottom: "2px solid rgba(0,0,0,0.05)" }}>
                    <th style={{ padding: "1rem 1.5rem" }}>Name</th>
                    <th style={{ padding: "1rem 1.5rem" }}>Email</th>
                    <th style={{ padding: "1rem 1.5rem" }}>Role</th>
                    <th style={{ padding: "1rem 1.5rem" }}>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers.map(u => (
                    <tr key={u.id} style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                      <td style={{ padding: "1rem 1.5rem", fontWeight: 500 }}>{u.name}</td>
                      <td style={{ padding: "1rem 1.5rem", color: "var(--text-muted)" }}>{u.email}</td>
                      <td style={{ padding: "1rem 1.5rem" }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: 600, padding: "0.25rem 0.5rem", borderRadius: "4px", backgroundColor: "rgba(0,0,0,0.05)" }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: "1rem 1.5rem", color: "var(--text-muted)" }}>{format(new Date(u.createdAt), 'MMM d, yyyy')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>
    )
  }

  // PATIENT AND DOCTOR DASHBOARD RENDER LOGIC
  return (
    <main style={{ backgroundColor: "var(--background)", minHeight: "calc(100vh - 70px)" }}>
      <div className={styles.container}>
        
        <div className={styles.header} style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
          <ImageUpload 
            currentImageUrl={fullUser.image} 
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

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}><Calendar size={28} /></div>
            <div>
              <div className={styles.statValue}>{upcoming.length}</div>
              <div className={styles.statLabel}>Upcoming Appointments</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}><Activity size={28} /></div>
            <div>
              <div className={styles.statValue}>{past.length}</div>
              <div className={styles.statLabel}>Past Consultations</div>
            </div>
          </div>
        </div>

        {/* MEDICAL PROFILE SECTION FOR PATIENTS */}
        {role === "PATIENT" && (
          <div className={styles.section}>
            <div className={styles.sectionHeader} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FilePlus size={20} color="var(--primary)" /> My Medical Profile
            </div>
            <div style={{ padding: "2rem" }}>
              <MedicalProfileForm initialData={medicalRecord} reports={medicalReports} />
            </div>
          </div>
        )}

        {/* DOCTOR SIGNATURE UPLOAD */}
        {role === "DOCTOR" && isVerifiedDoctor && (
          <div className={styles.section} style={{ marginTop: "2rem" }}>
            <div className={styles.sectionHeader} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserCog size={20} color="var(--primary)" /> Profile & Signature
            </div>
            <div style={{ padding: "1.5rem" }}>
              <ImageUpload 
                label="Digital Signature for Prescriptions"
                currentImageUrl={fullUser.doctorProfile?.signatureUrl}
                onUploadSuccess={async (url) => {
                  "use server"
                  await updateSignature(url)
                }}
              />
            </div>
          </div>
        )}

        {/* SCHEDULE MANAGER FOR DOCTORS */}
        {role === "DOCTOR" && isVerifiedDoctor && (
          <div className={styles.section} style={{ marginTop: "2rem" }}>
            <div className={styles.sectionHeader} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={20} color="var(--primary)" /> Manage My Schedule
            </div>
            <div style={{ padding: "1.5rem" }}>
              <ScheduleManager 
                regularSchedules={doctorSchedules} 
                specialSchedules={specialSchedules} 
              />
            </div>
          </div>
        )}

        {role === "DOCTOR" && !isVerifiedDoctor && (
          <div className={styles.section} style={{ marginTop: "2rem", border: "2px solid #f59e0b", background: "rgba(245, 158, 11, 0.05)" }}>
            <div className={styles.sectionHeader} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: "#d97706" }}>
              Pending Admin Verification
            </div>
            <div style={{ padding: "2rem", textAlign: "center" }}>
              <h3 style={{ fontSize: "1.25rem", color: "var(--text-color)", marginBottom: "0.5rem" }}>Your account is under review</h3>
              <p style={{ color: "var(--text-muted)", maxWidth: "500px", margin: "0 auto" }}>
                For the safety of our patients, all new doctor registrations must be verified by a platform administrator. You cannot set your schedule or accept appointments until your credentials have been approved.
              </p>
            </div>
          </div>
        )}

        <div className={styles.section} style={{ marginTop: "2rem" }}>
          <div className={styles.sectionHeader}>Upcoming Appointments</div>
          
          {upcoming.length > 0 ? (
            <ul className={styles.appointmentList}>
              {upcoming.map(app => (
                <li key={app.id} className={styles.appointmentItem}>
                  <div className={styles.appointmentDate}>
                    <span className={styles.dateMonth}>{format(new Date(app.date), 'MMM')}</span>
                    <span className={styles.dateDay}>{format(new Date(app.date), 'd')}</span>
                  </div>
                  
                  <div className={styles.appointmentDetails}>
                    {role === "PATIENT" ? (
                      <div className={styles.appointmentTitle}>Dr. {app.doctor.name} <span style={{fontWeight: 'normal', color: 'var(--text-muted)', fontSize: '0.9rem'}}>({app.doctor.doctorProfile?.specialty})</span></div>
                    ) : (
                      <div className={styles.appointmentTitle}>Patient: {app.patient.name}</div>
                    )}
                    <div className={styles.appointmentTime}>
                      <Clock size={16} /> {app.time}
                      <span style={{ margin: "0 0.5rem" }}>•</span>
                      <span>Reason: {app.reason}</span>
                    </div>
                    {/* If Doctor, show patient medical info snippet */}
                    {role === "DOCTOR" && app.patient.medicalRecord && (
                      <div style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "var(--danger)", background: "rgba(239, 68, 68, 0.05)", padding: "0.25rem 0.5rem", borderRadius: "4px", display: "inline-block" }}>
                        <strong>Alerts:</strong> {app.patient.medicalRecord.allergies || "No allergies"} | Blood: {app.patient.medicalRecord.bloodGroup || "Unknown"}
                      </div>
                    )}
                    {role === "DOCTOR" && app.patient.medicalReports && app.patient.medicalReports.length > 0 && (
                      <div style={{ marginTop: "0.5rem", fontSize: "0.8rem" }}>
                        <strong>Files:</strong> {app.patient.medicalReports.map((r: any) => (
                          <a key={r.id} href={r.fileUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary)", marginRight: "0.5rem", textDecoration: "underline" }}>
                            {r.fileName}
                          </a>
                        ))}
                      </div>
                    )}

                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <span className={`${styles.badge} ${
                      app.status === 'PENDING' ? styles.badgePending :
                      app.status === 'CONFIRMED' ? styles.badgeConfirmed : 
                      app.status === 'CANCELLED_EMERGENCY' ? styles.badgeCompleted : ''
                    }`}>
                      {app.status === 'CANCELLED_EMERGENCY' ? "EMERGENCY CANCELLATION" : app.status}
                    </span>
                    
                    {/* Manual Confirmation completely removed! Auto-confirmed via Stripe! */}

                    {/* Patient Actions: Reschedule / Refund */}
                    {role === "PATIENT" && (
                      <PatientAppointmentActions appointment={app} />
                    )}

                    {/* Video Call Action: Strictly enforced by time */}
                    {app.status === "CONFIRMED" && (
                      <JoinConsultationButton 
                        appointmentId={app.id} 
                        dateStr={app.date.toISOString()} 
                        timeStr={app.time} 
                      />
                    )}

                    {/* Prescription UI (for Doctors, anytime during the day) */}
                    {role === "DOCTOR" && (
                      <PrescriptionModal 
                        appointmentId={app.id} 
                        role={role} 
                        existingPrescription={app.prescription} 
                        doctorSignatureUrl={fullUser.doctorProfile?.signatureUrl}
                        compact={true}
                      />
                    )}

                  </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
              You have no upcoming appointments.
            </div>
          )}
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>Past Consultations</div>
          
          {past.length > 0 ? (
            <ul className={styles.appointmentList}>
              {past.map(app => (
                <li key={app.id} className={styles.appointmentItem}>
                  <div className={styles.appointmentDate} style={{ opacity: 0.6 }}>
                    <span className={styles.dateMonth}>{format(new Date(app.date), 'MMM')}</span>
                    <span className={styles.dateDay}>{format(new Date(app.date), 'd')}</span>
                  </div>
                  
                  <div className={styles.appointmentDetails}>
                    {role === "PATIENT" ? (
                      <div className={styles.appointmentTitle}>Dr. {app.doctor.name}</div>
                    ) : (
                      <div className={styles.appointmentTitle}>Patient: {app.patient.name}</div>
                    )}
                    <div className={styles.appointmentTime}>
                      <Clock size={16} /> {app.time}
                      <span style={{ margin: "0 0.5rem" }}>•</span>
                      <span>Reason: {app.reason}</span>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                    <span className={`${styles.badge} ${styles.badgeCompleted}`}>
                      {app.status}
                    </span>
                    
                    {/* Chat History UI */}
                    {false && <ChatHistoryModal appointmentId={app.id} currentUserId={id} role={role} />}

                    {/* Prescription UI */}
                    {(app.status === "COMPLETED" || role === "DOCTOR") && (
                      <PrescriptionModal 
                        appointmentId={app.id} 
                        role={role} 
                        existingPrescription={app.prescription} 
                        doctorSignatureUrl={role === "DOCTOR" ? fullUser.doctorProfile?.signatureUrl : app.doctor?.doctorProfile?.signatureUrl}
                      />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
              No past consultations.
            </div>
          )}
        </div>

      </div>
    </main>
  )
}
