import styles from "./page.module.css"

export default function DashboardSkeleton() {
  return (
    <div className={styles.container}>
      {/* Skeleton stat cards */}
      <div className={styles.statsGrid}>
        {[1, 2].map(i => (
          <div key={i} className={styles.statCard} style={{ gap: "1.5rem" }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: "linear-gradient(90deg, #e8edf2 25%, #f4f6f8 50%, #e8edf2 75%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.4s infinite",
              flexShrink: 0
            }} />
            <div style={{ flex: 1 }}>
              <div style={{
                height: 28, width: "40%", borderRadius: 6, marginBottom: 8,
                background: "linear-gradient(90deg, #e8edf2 25%, #f4f6f8 50%, #e8edf2 75%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 1.4s infinite"
              }} />
              <div style={{
                height: 14, width: "65%", borderRadius: 4,
                background: "linear-gradient(90deg, #e8edf2 25%, #f4f6f8 50%, #e8edf2 75%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 1.4s infinite"
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* Skeleton appointment section */}
      {[1, 2].map(section => (
        <div key={section} className={styles.section} style={{ marginBottom: "2rem" }}>
          <div className={styles.sectionHeader}>
            <div style={{
              height: 16, width: "30%", borderRadius: 4,
              background: "linear-gradient(90deg, #e8edf2 25%, #f4f6f8 50%, #e8edf2 75%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.4s infinite"
            }} />
          </div>
          <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            {[1, 2].map(row => (
              <div key={row} style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 8, flexShrink: 0,
                  background: "linear-gradient(90deg, #e8edf2 25%, #f4f6f8 50%, #e8edf2 75%)",
                  backgroundSize: "200% 100%",
                  animation: "shimmer 1.4s infinite"
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{
                    height: 16, width: "55%", borderRadius: 4, marginBottom: 8,
                    background: "linear-gradient(90deg, #e8edf2 25%, #f4f6f8 50%, #e8edf2 75%)",
                    backgroundSize: "200% 100%",
                    animation: "shimmer 1.4s infinite"
                  }} />
                  <div style={{
                    height: 12, width: "35%", borderRadius: 4,
                    background: "linear-gradient(90deg, #e8edf2 25%, #f4f6f8 50%, #e8edf2 75%)",
                    backgroundSize: "200% 100%",
                    animation: "shimmer 1.4s infinite"
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  )
}
