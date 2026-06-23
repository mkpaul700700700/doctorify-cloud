"use client"

import { useState } from "react"
import { Bell, Check } from "lucide-react"
import { markNotificationAsRead, markAllNotificationsAsRead } from "@/app/actions/notificationActions"

export default function NotificationBell({ notifications }: { notifications: any[] }) {
  const [isOpen, setIsOpen] = useState(false)
  
  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <div style={{ position: "relative" }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          background: "none", 
          border: "none", 
          cursor: "pointer", 
          position: "relative",
          padding: "0.5rem",
          color: "var(--text-color)"
        }}
      >
        <Bell size={24} />
        {unreadCount > 0 && (
          <span style={{
            position: "absolute",
            top: "2px",
            right: "2px",
            backgroundColor: "var(--danger)",
            color: "white",
            fontSize: "0.7rem",
            fontWeight: 600,
            padding: "2px 6px",
            borderRadius: "10px",
            minWidth: "18px",
            textAlign: "center"
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: "absolute",
          top: "100%",
          right: "0",
          width: "320px",
          backgroundColor: "var(--surface)",
          boxShadow: "var(--shadow-lg)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border-color)",
          zIndex: 1000,
          maxHeight: "400px",
          overflowY: "auto",
          marginTop: "0.5rem"
        }}>
          <div style={{ padding: "1rem", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h4 style={{ margin: 0, fontWeight: 600 }}>Notifications</h4>
            {unreadCount > 0 && (
              <button 
                onClick={() => markAllNotificationsAsRead()}
                style={{ fontSize: "0.75rem", color: "var(--primary)", background: "none", border: "none", cursor: "pointer" }}
              >
                Mark all read
              </button>
            )}
          </div>
          
          {notifications.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.875rem" }}>
              No notifications yet.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  style={{ 
                    padding: "1rem", 
                    borderBottom: "1px solid var(--border-color)",
                    backgroundColor: notif.isRead ? "transparent" : "rgba(37, 99, 235, 0.05)",
                    display: "flex",
                    gap: "0.75rem"
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.875rem", lineHeight: 1.4, color: notif.isRead ? "var(--text-muted)" : "inherit" }}>
                      {notif.message}
                    </p>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                      {new Date(notif.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {!notif.isRead && (
                    <button 
                      onClick={() => markNotificationAsRead(notif.id)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--primary)", alignSelf: "flex-start", padding: "0.25rem" }}
                      title="Mark as read"
                    >
                      <Check size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
