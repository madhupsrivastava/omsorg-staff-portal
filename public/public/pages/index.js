import Head from "next/head";
import { useState, useEffect } from "react";

const TOOLS = [
  {
    id: "quote",
    name: "Quote Tool",
    desc: "Generate instant home care cost estimates for clients",
    url: "https://omsorg-quote-tool.vercel.app",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="4" y="2" width="16" height="22" rx="2" stroke="currentColor" strokeWidth="2"/>
        <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="21" cy="21" r="5" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="2"/>
        <path d="M19 21h4M21 19v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    color: "#8B1A1A",
    lightColor: "#FFF0F0",
    status: "live",
    tag: "Client-facing",
  },
  {
    id: "pricing",
    name: "Pricing Tool",
    desc: "Manage and update internal rate cards and pricing tables",
    url: "#",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M14 3L25 8v6c0 6-5 10-11 12C8 24 3 20 3 14V8l11-5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
        <path d="M10 14l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    color: "#1A5C8B",
    lightColor: "#F0F5FF",
    status: "coming",
    tag: "Internal",
  },
  {
    id: "staff",
    name: "Staff Profile Generator",
    desc: "Create and manage caregiver and staff profile documents",
    url: "#",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="9" r="5" stroke="currentColor" strokeWidth="2"/>
        <path d="M5 24c0-5 4-9 9-9s9 4 9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M20 13l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    color: "#1A7A4A",
    lightColor: "#F0FFF5",
    status: "coming",
    tag: "HR & Operations",
  },
  {
    id: "future",
    name: "More Tools",
    desc: "Additional operational tools will appear here as they are built",
    url: null,
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="14" r="11" stroke="currentColor" strokeWidth="2"/>
        <path d="M14 9v10M9 14h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    color: "#6B6B6B",
    lightColor: "#F5F5F5",
    status: "placeholder",
    tag: "Coming soon",
  },
];

function InstallBanner({ onDismiss }) {
  return (
    <div style={{
      background: "#8B1A1A", color: "#fff",
      padding: "12px 16px", display: "flex", alignItems: "center",
      gap: "12px", borderRadius: "12px", marginBottom: "16px",
    }}>
      <div style={{ fontSize: "24px", flexShrink: 0 }}>📲</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "2px" }}>Install as app</div>
        <div style={{ fontSize: "12px", opacity: 0.85 }}>Tap your browser menu → "Add to Home Screen" for the best experience</div>
      </div>
      <button onClick={onDismiss} style={{ background: "none", border: "none", color: "#fff", fontSize: "20px", cursor: "pointer", padding: "4px", opacity: 0.7, flexShrink: 0 }}>✕</button>
    </div>
  );
}

function ToolCard({ tool }) {
  const isLive = tool.status === "live";
  const isPlaceholder = tool.status === "placeholder";

  const handleOpen = () => {
    if (isLive && tool.url && tool.url !== "#") {
      window.location.href = tool.url;
    }
  };

  return (
    <div
      onClick={handleOpen}
      style={{
        background: "#fff",
        borderRadius: "16px",
        padding: "20px",
        border: isLive ? `2px solid ${tool.color}22` : "1px solid #e5e7eb",
        cursor: isLive ? "pointer" : "default",
        position: "relative",
        overflow: "hidden",
        transition: "transform 0.1s, box-shadow 0.1s",
        WebkitTapHighlightColor: "transparent",
        opacity: isPlaceholder ? 0.6 : 1,
      }}
      onTouchStart={e => { if (isLive) e.currentTarget.style.transform = "scale(0.97)"; }}
      onTouchEnd={e => { e.currentTarget.style.transform = "scale(1)"; }}
    >
      {/* Colour accent bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: isPlaceholder ? "#e5e7eb" : tool.color }} />

      {/* Icon */}
      <div style={{
        width: "52px", height: "52px", borderRadius: "14px",
        background: isPlaceholder ? "#f5f5f5" : tool.lightColor,
        color: isPlaceholder ? "#9ca3af" : tool.color,
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: "14px", marginTop: "4px",
      }}>
        {tool.icon}
      </div>

      {/* Tag */}
      <div style={{
        position: "absolute", top: "16px", right: "16px",
        fontSize: "10px", fontWeight: 700, letterSpacing: "0.05em",
        textTransform: "uppercase", color: isPlaceholder ? "#9ca3af" : tool.color,
        background: isPlaceholder ? "#f5f5f5" : tool.lightColor,
        padding: "3px 8px", borderRadius: "20px",
      }}>
        {tool.tag}
      </div>

      <div style={{ fontSize: "16px", fontWeight: 700, color: "#111827", marginBottom: "6px" }}>{tool.name}</div>
      <div style={{ fontSize: "13px", color: "#6b7280", lineHeight: "1.5", marginBottom: "16px" }}>{tool.desc}</div>

      {isLive && (
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          background: tool.color, color: "#fff",
          padding: "8px 16px", borderRadius: "10px",
          fontSize: "13px", fontWeight: 600,
        }}>
          Open tool
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 7h8M7 3l4 4-4 4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      )}
      {tool.status === "coming" && (
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          background: "#f3f4f6", color: "#9ca3af",
          padding: "8px 16px", borderRadius: "10px",
          fontSize: "13px", fontWeight: 600,
        }}>
          Coming soon
        </div>
      )}
    </div>
  );
}

export default function Portal() {
  const [showBanner, setShowBanner] = useState(false);
  const [time, setTime] = useState("");
  const [greeting, setGreeting] = useState("Good morning");

  useEffect(() => {
    // Show install banner if not already installed
    const dismissed = localStorage.getItem("install-banner-dismissed");
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
    if (!dismissed && !isStandalone) setShowBanner(true);

    // Time and greeting
    const update = () => {
      const now = new Date();
      const h = now.getHours();
      setTime(now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }));
      setGreeting(h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");
    };
    update();
    const timer = setInterval(update, 30000);
    return () => clearInterval(timer);
  }, []);

  const dismissBanner = () => {
    localStorage.setItem("install-banner-dismissed", "1");
    setShowBanner(false);
  };

  return (
    <>
      <Head>
        <title>Omsorg Staff Portal</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { min-height: 100vh; background: #F4F4F4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        body { padding-bottom: env(safe-area-inset-bottom); }
      `}</style>

      {/* Header */}
      <div style={{
        background: "#8B1A1A",
        padding: "env(safe-area-inset-top, 0) 0 0",
      }}>
        <div style={{ padding: "16px 20px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ color: "#F5C0C0", fontSize: "12px", fontWeight: 500, marginBottom: "2px" }}>{greeting}</div>
            <div style={{ color: "#fff", fontSize: "20px", fontWeight: 700 }}>Staff Portal</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#fff", fontSize: "20px", fontWeight: 700, letterSpacing: "0.02em" }}>{time}</div>
            <div style={{ color: "#F5C0C0", fontSize: "11px", marginTop: "2px" }}>
              {new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <svg viewBox="0 0 390 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: "block", width: "100%", marginBottom: "-1px" }}>
          <path d="M0 0 Q97.5 24 195 12 Q292.5 0 390 24 L390 24 L0 24 Z" fill="#F4F4F4"/>
        </svg>
      </div>

      {/* Content */}
      <div style={{ padding: "12px 16px 32px", maxWidth: "480px", margin: "0 auto" }}>

        {showBanner && <InstallBanner onDismiss={dismissBanner} />}

        {/* Omsorg wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#8B1A1A", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2C7.24 2 5 4.24 5 7c0 1.86.97 3.49 2.43 4.44L6.5 18h7l-.93-6.56A5 5 0 0015 7c0-2.76-2.24-5-5-5z" fill="#F5C0C0"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#111827" }}>Omsorg Elder Care</div>
            <div style={{ fontSize: "11px", color: "#6b7280" }}>Internal Operations Portal · v1.0</div>
          </div>
        </div>

        {/* Section label */}
        <div style={{ fontSize: "11px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>
          Your tools
        </div>

        {/* Tool cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {TOOLS.map(tool => <ToolCard key={tool.id} tool={tool} />)}
        </div>

        {/* Footer */}
        <div style={{ marginTop: "32px", textAlign: "center" }}>
          <div style={{ fontSize: "11px", color: "#c0c0c0", marginBottom: "4px" }}>
            Omsorg Elder Care · omsorg.co.in
          </div>
          <div style={{ fontSize: "11px", color: "#d0d0d0" }}>
            For support contact your operations manager
          </div>
        </div>
      </div>
    </>
  );
}
