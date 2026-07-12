import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ZegoVideoCallDynamic } from "@/components/ZegoVideoCallDynamic";
import ChatPanel from "@/components/ChatPanel";
import PatientHistorySidebar from "./PatientHistorySidebar";

export default async function CallPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const role = session.user.role; // "PATIENT" or "DOCTOR"
  const userName = session.user.name || "User";

  // Fetch appointment to ensure security
  const appointment = await prisma.appointment.findUnique({
    where: { id: resolvedParams.id },
    include: {
      patient: true,
      doctor: { include: { doctorProfile: true } },
      prescription: { include: { items: true } },
    },
  });

  if (!appointment) redirect("/dashboard");

  // Verify the user is either the doctor or the patient of this exact appointment
  if (role === "PATIENT" && appointment.patientId !== userId) {
    redirect("/dashboard");
  }
  if (role === "DOCTOR" && appointment.doctorId !== userId) {
    redirect("/dashboard");
  }

  // Generate a predictable room ID for this specific appointment
  const roomID = `room-${appointment.id}`;

  return (
    <div className="call-layout">
      
      {/* Patient Medical History (Left Sidebar - Doctors Only) */}
      {role === "DOCTOR" && (
        <PatientHistorySidebar 
          patientId={appointment.patientId} 
          role={role} 
          appointmentId={appointment.id}
          existingPrescription={appointment.prescription}
          doctorSignatureUrl={appointment.doctor?.doctorProfile?.signatureUrl}
        />
      )}

      {/* Video Call Area */}
      <div className="video-container">
        <ZegoVideoCallDynamic 
          roomID={roomID} 
          userID={userId} 
          userName={userName} 
          role={role}
          doctorId={appointment.doctorId}
          doctorName={appointment.doctor.name}
          appointmentId={appointment.id}
        />
      </div>
      
      {/* Persistent Chat Area */}
      {false && appointment && (
      <div className="chat-panel-container">
        <ChatPanel appointmentId={appointment!.id} currentUserId={userId} role={role} />
      </div>
      )}
    </div>
  );
}
