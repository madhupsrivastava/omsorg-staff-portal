export default function Offline() {
  return (
    <div style={{
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      background: "#8B1A1A", color: "#fff", minHeight: "100vh",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "24px", textAlign: "center",
    }}>
      <div style={{ fontSize: "64px", marginBottom: "24px" }}>📡</div>
      <h1 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "12px" }}>You're offline</h1>
      <p style={{ fontSize: "15px", opacity: 0.8, lineHeight: 1.6, maxWidth: "320px", marginBottom: "32px" }}>
        Please check your internet connection. The Omsorg Staff Portal needs a connection to load tools.
      </p>
      <button onClick={() => window.location.reload()} style={{
        background: "#fff", color: "#8B1A1A", border: "none",
        borderRadius: "12px", padding: "14px 32px", fontSize: "15px",
        fontWeight: 700, cursor: "pointer",
      }}>
        Try again
      </button>
    </div>
  );
}
