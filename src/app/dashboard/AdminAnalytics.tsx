"use client"

import { useEffect, useState } from "react"
import { getAdminAnalytics } from "@/app/actions/adminAnalytics"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from "recharts"
import { Loader2 } from "lucide-react"

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a855f7', '#ec4899', '#f43f5e']

export default function AdminAnalytics() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAdminAnalytics().then(res => {
      setData(res)
      setLoading(false)
    }).catch(err => {
      console.error(err)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return <div style={{ padding: "3rem", display: "flex", justifyContent: "center" }}><Loader2 className="spin" size={32} /></div>
  }

  if (!data) return <div>Failed to load analytics.</div>

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginTop: "1rem" }}>
      
      {/* Revenue Line Chart */}
      <div style={{ backgroundColor: "var(--background)", padding: "1.5rem", borderRadius: "8px", border: "1px solid var(--border-color)", gridColumn: "1 / -1" }}>
        <h3 style={{ marginBottom: "1.5rem", fontSize: "1.1rem", fontWeight: 600 }}>30-Day Revenue Trend (Consultations + Prescriptions)</h3>
        <div style={{ height: "300px", width: "100%" }}>
          <ResponsiveContainer>
            <LineChart data={data.revenueData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{fontSize: 12}} />
              <YAxis tick={{fontSize: 12}} tickFormatter={(val) => `৳${val}`} />
              <RechartsTooltip formatter={(value) => [`৳${value}`, 'Revenue']} />
              <Line type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Specialties Pie Chart */}
      <div style={{ backgroundColor: "var(--background)", padding: "1.5rem", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
        <h3 style={{ marginBottom: "1.5rem", fontSize: "1.1rem", fontWeight: 600 }}>Registered Doctors by Specialty</h3>
        <div style={{ height: "300px", width: "100%" }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={data.specialtyData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                label={({name, percent}) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
              >
                {data.specialtyData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Peak Hours Bar Chart */}
      <div style={{ backgroundColor: "var(--background)", padding: "1.5rem", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
        <h3 style={{ marginBottom: "1.5rem", fontSize: "1.1rem", fontWeight: 600 }}>Peak Booking Hours</h3>
        <div style={{ height: "300px", width: "100%" }}>
          <ResponsiveContainer>
            <BarChart data={data.hourData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="hour" tick={{fontSize: 12}} />
              <YAxis tick={{fontSize: 12}} allowDecimals={false} />
              <RechartsTooltip formatter={(value) => [value, 'Appointments']} />
              <Bar dataKey="count" fill="var(--secondary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  )
}
