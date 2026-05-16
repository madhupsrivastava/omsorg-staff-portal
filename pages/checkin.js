import { useState, useEffect } from "react";
import Head from "next/head";

const G = "#8B1A1A";
const GL = "#FFF0F0";

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = x => x * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function formatDuration(startIso, endIso) {
  const mins = Math.round((new Date(endIso) - new Date(startIso)) / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m} mins`;
}

// ─── SMALL COMPONENTS ────────────────────────────────────────────────────────
function Header() {
  return (
    <div style={{ background: G, padding: "14px 16px 18px", color: "#fff" }}>
      <a href="/" style={{ color: "#F5C0C0", fontSize: "12px", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px", marginBottom: "8px" }}>
        ← Back to Portal
      </a>
      <div style={{ fontSize: "20px", fontWeight: 700 }}>Staff Check-in</div>
      <div style={{ fontSize: "12px", color: "#F5C0C0", marginTop: "2px" }}>GPS-verified attendance — Omsorg Elder Care</div>
    </div>
  );
}

function Card({ children, style }) {
  return (
    <div style={{ background: "#fff", borderRadius: "14px", padding: "20px", border: "1px solid #f3f4f6", marginBottom: "12px", ...style }}>
      {children}
    </div>
  );
}

function BigButton({ label, onClick, disabled, color, loading }) {
  return (
    <button onClick={onClick} disabled={disabled || loading} style={{
      width: "100%", padding: "16px", borderRadius: "12px", border: "none",
      background: disabled || loading ? "#f3f4f6" : (color || G),
      color: disabled || loading ? "#9ca3af" : "#fff",
      fontSize: "16px", fontWeight: 700, cursor: disabled || loading ? "not-allowed" : "pointer",
      display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
    }}>
      {loading ? "Please wait…" : label}
    </button>
  );
}

function ZoneBadge({ within, distance }) {
  return within
    ? <span style={{ background: "#D1FAE5", color: "#065F46", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 600 }}>✅ Within zone ({distance}m away)</span>
    : <span style={{ background: "#FEE2E2", color: "#991B1B", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 600 }}>⚠️ Outside zone ({distance}m away)</span>;
}

// ─── SCREENS ─────────────────────────────────────────────────────────────────
function PrivacyScreen({ onAccept }) {
  return (
    <Card>
      <div style={{ fontSize: "28px", marginBottom: "12px", textAlign: "center" }}>🔒</div>
      <div style={{ fontSize: "16px", fontWeight: 700, color: "#111827", marginBottom: "8px", textAlign: "center" }}>Location Privacy Notice</div>
      <div style={{ fontSize: "13px", color: "#6b7280", lineHeight: "1.7", marginBottom: "16px" }}>
        Before using the check-in system, please understand how your location is used:
      </div>
      <ul style={{ paddingLeft: "18px", margin: "0 0 16px", fontSize: "13px", color: "#374151", lineHeight: "1.8" }}>
        <li>Your GPS location is captured <strong>only</strong> at check-in and check-out</li>
        <li>Location is <strong>not</strong> tracked continuously during your shift</li>
        <li>Coordinates are compared with the client's registered address</li>
        <li>Data is stored securely and used only for attendance verification</li>
        <li>Records are accessible to Omsorg operations staff only</li>
      </ul>
      <div style={{ background: "#F9FAFB", borderRadius: "8px", padding: "12px", fontSize: "12px", color: "#6b7280", marginBottom: "20px", lineHeight: "1.6" }}>
        By continuing you agree to one-time location capture at check-in and check-out for the purpose of attendance verification.
      </div>
      <BigButton label="I Understand — Continue" onClick={onAccept} color={G} />
    </Card>
  );
}

function SelectionScreen({ staffName, setStaffName, clientId, setClientId, clients, onCheckIn, loading }) {
  const valid = staffName.trim().length > 1 && clientId;
  return (
    <Card>
      <div style={{ fontSize: "15px", fontWeight: 700, color: "#111827", marginBottom: "16px" }}>Start your shift</div>

      <div style={{ marginBottom: "14px" }}>
        <label style={{ fontSize: "12px", fontWeight: 600, color: "#6b7280", display: "block", marginBottom: "6px" }}>YOUR NAME *</label>
        <input
          value={staffName}
          onChange={e => setStaffName(e.target.value)}
          placeholder="Enter your full name"
          style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #e5e7eb", fontSize: "15px", boxSizing: "border-box", fontFamily: "inherit" }}
        />
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label style={{ fontSize: "12px", fontWeight: 600, color: "#6b7280", display: "block", marginBottom: "6px" }}>CLIENT / FACILITY *</label>
        <select
          value={clientId}
          onChange={e => setClientId(e.target.value)}
          style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #e5e7eb", fontSize: "15px", boxSizing: "border-box", fontFamily: "inherit", background: "#fff" }}
        >
          <option value="">Select client or facility…</option>
          {CLIENTS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div style={{ background: "#FFF9F0", borderRadius: "8px", padding: "10px 12px", fontSize: "12px", color: "#92400E", marginBottom: "16px" }}>
        📍 Tapping Check In will request your device location once. Please allow location access when prompted.
      </div>

      <BigButton label="📍 Check In" onClick={onCheckIn} disabled={!valid} loading={loading} />
    </Card>
  );
}

function CheckedInScreen({ checkin, clients, onCheckOut, loading }) {
  const client = clients.find(c => c.id === checkin.clientId);
  const [elapsed, setElapsed] = useState("");

  useEffect(() => {
    const tick = () => {
      const mins = Math.round((Date.now() - new Date(checkin.time)) / 60000);
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      setElapsed(h > 0 ? `${h}h ${m}m` : `${m} mins`);
    };
    tick();
    const t = setInterval(tick, 60000);
    return () => clearInterval(t);
  }, [checkin.time]);

  return (
    <>
      <Card style={{ borderLeft: `4px solid #059669` }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
          <div style={{ fontSize: "24px" }}>✅</div>
          <div>
            <div style={{ fontSize: "15px", fontWeight: 700, color: "#065F46" }}>Checked In</div>
            <div style={{ fontSize: "12px", color: "#6b7280" }}>{formatDate(checkin.time)}</div>
          </div>
        </div>
        <div style={{ fontSize: "13px", color: "#374151", marginBottom: "8px" }}>
          <strong>{checkin.staffName}</strong> at <strong>{client?.name}</strong>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "8px" }}>
          <span style={{ background: "#F3F4F6", padding: "4px 10px", borderRadius: "20px", fontSize: "12px" }}>⏱ In: {formatTime(checkin.time)}</span>
          <span style={{ background: "#F3F4F6", padding: "4px 10px", borderRadius: "20px", fontSize: "12px" }}>⏳ {elapsed} elapsed</span>
        </div>
        <ZoneBadge within={checkin.withinZone} distance={checkin.distance} />
      </Card>

      <Card>
        <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "16px" }}>
          Ready to end your shift? Tap below to record your check-out location and time.
        </div>
        <BigButton label="📍 Check Out" onClick={onCheckOut} loading={loading} />
      </Card>
    </>
  );
}

function ExceptionScreen({ distance, reason, setReason, onSubmit, loading }) {
  const valid = reason.trim().length > 5;
  return (
    <Card style={{ borderLeft: "4px solid #DC2626" }}>
      <div style={{ fontSize: "22px", marginBottom: "10px" }}>⚠️</div>
      <div style={{ fontSize: "15px", fontWeight: 700, color: "#991B1B", marginBottom: "6px" }}>Outside Expected Zone</div>
      <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "16px", lineHeight: "1.6" }}>
        Your check-out location is <strong>{distance} metres</strong> from the client's registered address. Please provide a reason before submitting.
      </div>
      <label style={{ fontSize: "12px", fontWeight: 600, color: "#6b7280", display: "block", marginBottom: "6px" }}>REASON FOR LOCATION EXCEPTION *</label>
      <textarea
        value={reason}
        onChange={e => setReason(e.target.value)}
        placeholder="e.g. Client moved temporarily to relative's home, or I checked out from nearby pharmacy…"
        rows={4}
        style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #e5e7eb", fontSize: "14px", boxSizing: "border-box", fontFamily: "inherit", resize: "vertical", marginBottom: "16px" }}
      />
      <BigButton label="Submit Check-out" onClick={onSubmit} disabled={!valid} loading={loading} />
    </Card>
  );
}

function CompleteScreen({ checkin, checkout, clients, onReset }) {
  const client = clients.find(c => c.id === checkin.clientId);
  return (
    <Card style={{ borderLeft: `4px solid ${G}` }}>
      <div style={{ fontSize: "32px", textAlign: "center", marginBottom: "12px" }}>🎉</div>
      <div style={{ fontSize: "17px", fontWeight: 700, color: "#111827", textAlign: "center", marginBottom: "4px" }}>Shift Complete</div>
      <div style={{ fontSize: "13px", color: "#6b7280", textAlign: "center", marginBottom: "20px" }}>Your attendance has been recorded</div>

      <div style={{ background: "#F9FAFB", borderRadius: "10px", padding: "14px", marginBottom: "16px" }}>
        <div style={{ fontSize: "12px", color: "#9ca3af", fontWeight: 600, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Shift Summary</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", color: "#374151" }}>
          <div><strong>Staff:</strong> {checkin.staffName}</div>
          <div><strong>Client:</strong> {client?.name}</div>
          <div><strong>Date:</strong> {formatDate(checkin.time)}</div>
          <div><strong>Check-in:</strong> {formatTime(checkin.time)} {checkin.withinZone ? "✅" : "⚠️"}</div>
          <div><strong>Check-out:</strong> {formatTime(checkout.time)} {checkout.withinZone ? "✅" : "⚠️"}</div>
          <div><strong>Duration:</strong> {formatDuration(checkin.time, checkout.time)}</div>
        </div>
      </div>

      {(!checkin.withinZone || !checkout.withinZone) && (
        <div style={{ background: "#FEF3C7", borderRadius: "8px", padding: "10px 12px", fontSize: "12px", color: "#92400E", marginBottom: "16px" }}>
          ⚠️ One or more location exceptions were recorded. Your coordinator has been notified.
        </div>
      )}

      <BigButton label="← Back to Portal" onClick={onReset} />
    </Card>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function CheckIn() {
  const [screen, setScreen] = useState("privacy");
  const [staffName, setStaffName] = useState("");
  const [clientId, setClientId] = useState("");
  const [checkin, setCheckin] = useState(null);
  const [checkout, setCheckout] = useState(null);
  const [exceptionReason, setExceptionReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [recordId, setRecordId] = useState(null);
  const [clients, setClients] = useState([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [clientsError, setClientsError] = useState("");

  // Load clients from Airtable
  useEffect(() => {
    fetch("/api/clients")
      .then(r => r.json())
      .then(data => {
        if (data.clients) setClients(data.clients);
        else setClientsError("Could not load client list. Please try again.");
      })
      .catch(() => setClientsError("Could not load client list. Please check your connection."))
      .finally(() => setClientsLoading(false));
  }, []);

  // Restore state from localStorage (in case page refreshes mid-shift)
  useEffect(() => {
    const saved = localStorage.getItem("omsorg_checkin");
    if (saved) {
      try {
        const { checkin: ci, recordId: rid } = JSON.parse(saved);
        if (ci) { setCheckin(ci); setRecordId(rid); setScreen("checkedin"); }
      } catch {}
    }
  }, []);

  const getLocation = () =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error("Geolocation not supported on this device"));
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: Math.round(pos.coords.accuracy) }),
        err => reject(new Error(err.code === 1 ? "Location permission denied. Please allow location access and try again." : "Could not get your location. Please try again.")),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    });

  const handleCheckIn = async () => {
    setLoading(true);
    setError("");
    try {
      const loc = await getLocation();
      const client = clients.find(c => c.id === clientId);
      const distance = haversineDistance(loc.lat, loc.lng, client.lat, client.lng);
      const withinZone = distance <= client.radius;
      const time = new Date().toISOString();
      const ci = { staffName, clientId, time, lat: loc.lat, lng: loc.lng, accuracy: loc.accuracy, distance, withinZone };
      setCheckin(ci);

      // Save to Airtable
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...ci, clientName: client.name }),
      });
      if (res.ok) {
        const data = await res.json();
        setRecordId(data.id);
        localStorage.setItem("omsorg_checkin", JSON.stringify({ checkin: ci, recordId: data.id }));
      }
      setScreen("checkedin");
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const handleCheckOut = async () => {
    setLoading(true);
    setError("");
    try {
      const loc = await getLocation();
      const client = clients.find(c => c.id === checkin.clientId);
      const distance = haversineDistance(loc.lat, loc.lng, client.lat, client.lng);
      const withinZone = distance <= client.radius;
      const time = new Date().toISOString();
      const co = { time, lat: loc.lat, lng: loc.lng, accuracy: loc.accuracy, distance, withinZone };
      setCheckout(co);
      if (!withinZone) { setScreen("exception"); }
      else { await submitCheckout(co, ""); }
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const submitCheckout = async (co, reason) => {
    setLoading(true);
    const coData = co || checkout;
    try {
      await fetch("/api/checkout", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordId, checkout: coData, exceptionReason: reason, checkin }),
      });
      setCheckout(coData);
      localStorage.removeItem("omsorg_checkin");
      setScreen("complete");
    } catch (e) {
      setError("Could not save check-out. Please try again.");
    }
    setLoading(false);
  };

  const handleExceptionSubmit = () => submitCheckout(checkout, exceptionReason);

  const reset = () => {
    setScreen("privacy"); setStaffName(""); setClientId(""); setCheckin(null);
    setCheckout(null); setExceptionReason(""); setError(""); setRecordId(null);
    localStorage.removeItem("omsorg_checkin");
    window.location.href = "/";
  };

  return (
    <>
      <Head>
        <title>Omsorg Staff Check-in</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#8B1A1A" />
      </Head>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #F4F4F4; min-height: 100vh; }
        input:focus, select:focus, textarea:focus { outline: 2px solid #8B1A1A; border-color: #8B1A1A; }
      `}</style>

      <Header />

      <div style={{ padding: "16px", maxWidth: "480px", margin: "0 auto" }}>

        {error && (
          <div style={{ background: "#FEE2E2", color: "#991B1B", padding: "12px 14px", borderRadius: "10px", fontSize: "13px", marginBottom: "12px", lineHeight: "1.5" }}>
            ⚠️ {error}
          </div>
        )}

        {screen === "privacy"    && <PrivacyScreen onAccept={() => setScreen("select")} />}
        {screen === "select"     && (
          clientsLoading
            ? <div style={{ textAlign: "center", padding: "40px 0", color: "#6b7280" }}>Loading client list…</div>
            : clientsError
            ? <div style={{ background: "#FEE2E2", color: "#991B1B", padding: "14px", borderRadius: "10px", fontSize: "13px" }}>{clientsError}</div>
            : <SelectionScreen staffName={staffName} setStaffName={setStaffName} clientId={clientId} setClientId={setClientId} clients={clients} onCheckIn={handleCheckIn} loading={loading} />
        )}
        {screen === "checkedin"  && checkin && <CheckedInScreen checkin={checkin} clients={clients} onCheckOut={handleCheckOut} loading={loading} />}
        {screen === "exception"  && <ExceptionScreen distance={checkout?.distance} reason={exceptionReason} setReason={setExceptionReason} onSubmit={handleExceptionSubmit} loading={loading} />}
        {screen === "complete"   && checkin && checkout && <CompleteScreen checkin={checkin} checkout={checkout} clients={clients} onReset={reset} />}

        {screen !== "privacy" && screen !== "complete" && (
          <div style={{ textAlign: "center", fontSize: "11px", color: "#9ca3af", marginTop: "8px" }}>
            Location is captured only at check-in and check-out · Not tracked continuously
          </div>
        )}
      </div>
    </>
  );
}
