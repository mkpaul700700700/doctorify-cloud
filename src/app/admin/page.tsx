import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import AdminDashboardClient from "./AdminDashboardClient";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await auth();
  
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard"); // Only ADMIN allowed

  // Fetch doctors
  const doctors = await prisma.user.findMany({
    where: { role: "DOCTOR" },
    include: {
      doctorProfile: true,
      _count: {
        select: { appointmentsAsDoctor: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  // Fetch metrics
  const totalPatients = await prisma.user.count({ where: { role: "PATIENT" } });
  const totalDoctors = await prisma.user.count({ where: { role: "DOCTOR" } });
  const totalAppointments = await prisma.appointment.count();

  // Fetch Status Distribution
  const pendingCount = await prisma.appointment.count({ where: { status: "PENDING" } });
  const confirmedCount = await prisma.appointment.count({ where: { status: "CONFIRMED" } });
  const completedCount = await prisma.appointment.count({ where: { status: "COMPLETED" } });
  const cancelledCount = await prisma.appointment.count({ where: { status: "CANCELLED" } });

  const statusData = [
    { name: "Completed", value: completedCount },
    { name: "Pending", value: pendingCount },
    { name: "Confirmed", value: confirmedCount },
    { name: "Cancelled", value: cancelledCount },
  ].filter(item => item.value > 0); // Only show statuses that have data

  const metrics = {
    totalPatients,
    totalDoctors,
    totalAppointments
  };

  return (
    <div style={{ backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      <AdminDashboardClient 
        doctors={doctors} 
        statusData={statusData.length > 0 ? statusData : [{ name: "No Data", value: 1 }]} 
        metrics={metrics} 
      />
    </div>
  );
}
