"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { toggleDoctorStatus, deleteDoctor } from "@/app/actions/adminActions";
import { useTransition } from "react";
import { UserCheck, UserX, Trash2 } from "lucide-react";

const COLORS = ["#10b981", "#f59e0b", "#3b82f6", "#ef4444"];

export default function AdminDashboardClient({ 
  doctors, 
  statusData, 
  metrics 
}: { 
  doctors: any[], 
  statusData: any[],
  metrics: {
    totalPatients: number;
    totalDoctors: number;
    totalAppointments: number;
  }
}) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = (id: string, currentStatus: boolean) => {
    startTransition(() => {
      toggleDoctorStatus(id, !currentStatus);
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to permanently delete this doctor and all their data?")) {
      startTransition(() => {
        deleteDoctor(id);
      });
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "2rem", fontWeight: "bold" }}>Global Admin Dashboard</h1>

      {/* Top Metrics Row */}
      <div style={{ display: "flex", gap: "1.5rem", marginBottom: "3rem" }}>
        <div className="card" style={{ flex: 1, padding: "1.5rem", textAlign: "center" }}>
          <h3 style={{ color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Total Patients</h3>
          <p style={{ fontSize: "2.5rem", fontWeight: "bold", color: "var(--primary-color)" }}>{metrics.totalPatients}</p>
        </div>
        <div className="card" style={{ flex: 1, padding: "1.5rem", textAlign: "center" }}>
          <h3 style={{ color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Total Doctors</h3>
          <p style={{ fontSize: "2.5rem", fontWeight: "bold", color: "var(--primary-color)" }}>{metrics.totalDoctors}</p>
        </div>
        <div className="card" style={{ flex: 1, padding: "1.5rem", textAlign: "center" }}>
          <h3 style={{ color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Total Appointments</h3>
          <p style={{ fontSize: "2.5rem", fontWeight: "bold", color: "var(--primary-color)" }}>{metrics.totalAppointments}</p>
        </div>
      </div>

      {/* Charts Row */}
      <div style={{ display: "flex", gap: "2rem", marginBottom: "3rem", height: "300px" }}>
        <div className="card" style={{ flex: 1, padding: "1.5rem" }}>
          <h3 style={{ marginBottom: "1rem" }}>Appointment Status Distribution</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="card" style={{ flex: 1, padding: "1.5rem" }}>
          <h3 style={{ marginBottom: "1rem" }}>Revenue / Additional Metrics</h3>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "80%", color: "var(--text-secondary)" }}>
            (Payment Module Pending)
          </div>
        </div>
      </div>

      {/* Doctor Management Table */}
      <div className="card" style={{ padding: "2rem", overflowX: "auto" }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1.5rem" }}>Doctor Management</h2>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--border-color)" }}>
              <th style={{ padding: "1rem" }}>Doctor Name</th>
              <th style={{ padding: "1rem" }}>Email</th>
              <th style={{ padding: "1rem" }}>Specialty</th>
              <th style={{ padding: "1rem" }}>Status</th>
              <th style={{ padding: "1rem" }}>Total Appointments</th>
              <th style={{ padding: "1rem" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {doctors.map(doctor => (
              <tr key={doctor.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                <td style={{ padding: "1rem", fontWeight: "500" }}>Dr. {doctor.name}</td>
                <td style={{ padding: "1rem", color: "var(--text-secondary)" }}>{doctor.email}</td>
                <td style={{ padding: "1rem" }}>{doctor.doctorProfile?.specialty || "N/A"}</td>
                <td style={{ padding: "1rem" }}>
                  <span style={{ 
                    padding: "0.25rem 0.75rem", 
                    borderRadius: "9999px", 
                    fontSize: "0.875rem",
                    backgroundColor: doctor.isActive ? "#dcfce7" : "#fee2e2",
                    color: doctor.isActive ? "#166534" : "#991b1b"
                  }}>
                    {doctor.isActive ? "Active" : "Deactivated"}
                  </span>
                </td>
                <td style={{ padding: "1rem" }}>{doctor._count.appointmentsAsDoctor}</td>
                <td style={{ padding: "1rem", display: "flex", gap: "0.5rem" }}>
                  <button 
                    disabled={isPending}
                    onClick={() => handleToggle(doctor.id, doctor.isActive)}
                    className="btn"
                    style={{ 
                      backgroundColor: doctor.isActive ? "#fef3c7" : "#dcfce7", 
                      color: doctor.isActive ? "#92400e" : "#166534",
                      padding: "0.5rem",
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}
                    title={doctor.isActive ? "Deactivate" : "Activate"}
                  >
                    {doctor.isActive ? <UserX size={18} /> : <UserCheck size={18} />}
                  </button>
                  <button 
                    disabled={isPending}
                    onClick={() => handleDelete(doctor.id)}
                    className="btn"
                    style={{ backgroundColor: "#fee2e2", color: "#991b1b", padding: "0.5rem" }}
                    title="Delete permanently"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
