import { useState, useEffect } from "react";
import Head from "next/head";
import { createBrowserClient } from "../lib/supabase";

const G = "#8B1A1A";

export default function StaffLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [magicEmail, setMagicEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);
  const [magicSent, setMagicSent] = useState(false);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);

  const supabase = createBrowserClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) window.location.href = "/";
      else setChecking(false);
    });
  }, []);

  const handleMagicLink = async (e) => {
    e.preventDefault();
    setMagicLoading(true); setError("");
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: magicEmail,
      options: { emailRedirectTo: window.location.origin + "/auth/callback" },
    });
    if (otpError) { setError(otpError.message); setMagicLoading(false); return; }
    setMagicSent(true);
    setMagicLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) { setError("Incorrect email or password."); setLoading(false); return; }
    window.location.href = "/";
  };

  if (checking) return null;

  return (
    <>
      <Head><title>Omsorg Staff Login</title><meta name="viewport" content="width=device-width, initial-scale=1" /></Head>
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #F4F4F4; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; } input:focus { outline: 2px solid ${G}; border-color: ${G}; }`}</style>
      <div style={{ width: "100%", maxWidth: "380px" }}>
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{ width: "60px", height: "60px", borderRadius: "16px", background: G, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><circle cx="14" cy="10" r="5" fill="#F5C0C0"/><path d="M4 24c0-5.5 4.5-10 10-10s10 4.5 10 10" stroke="#F5C0C0" strokeWidth="2" strokeLinecap="round"/></svg>
          </div>
          <div style={{ fontSize: "20px", fontWeight: 800, color: G }}>Omsorg Staff Portal</div>
          <div style={{ fontSize: "13px", color: "#9CA3AF", marginTop: "4px" }}>Sign in to access operational tools</div>
        </div>
        <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
          {magicSent ? (
            <div style={{ textAlign: "center", padding: "10px 0" }}>
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>📧</div>
              <div style={{ fontWeight: 700, color: "#111827", marginBottom: "8px" }}>Check your email!</div>
              <div style={{ fontSize: "13px", color: "#6B7280", marginBottom: "16px" }}>We sent a login link to <strong>{magicEmail}</strong></div>
              <button onClick={() => setMagicSent(false)} style={{ background: "none", border: "none", color: G, fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Try again</button>
            </div>
          ) : (
            <>
              <form onSubmit={handleMagicLink} style={{ marginBottom: "20px" }}>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "10px" }}>Sign in with a one-tap link</div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input type="email" value={magicEmail} onChange={e => setMagicEmail(e.target.value)} placeholder="your@email.com" required style={{ flex: 1, padding: "11px 12px", borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "14px" }} />
                  <button type="submit" disabled={magicLoading} style={{ padding: "11px 14px", borderRadius: "8px", border: "none", background: G, color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>{magicLoading ? "…" : "Send link"}</button>
                </div>
              </form>
              <div style={{ textAlign: "center", color: "#9CA3AF", fontSize: "12px", margin: "16px 0" }}>— or sign in with password —</div>
              <form onSubmit={handleLogin}>
                <div style={{ marginBottom: "12px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#6B7280", display: "block", marginBottom: "6px" }}>EMAIL</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@omsorg.co.in" required style={{ width: "100%", padding: "11px 12px", borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "14px" }} />
                </div>
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#6B7280", display: "block", marginBottom: "6px" }}>PASSWORD</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required style={{ width: "100%", padding: "11px 12px", borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "14px" }} />
                </div>
                {error && <div style={{ background: "#FEE2E2", color: "#991B1B", padding: "10px 12px", borderRadius: "8px", fontSize: "13px", marginBottom: "12px" }}>{error}</div>}
                <button type="submit" disabled={loading} style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "none", background: loading ? "#f3f4f6" : G, color: loading ? "#9CA3AF" : "#fff", fontSize: "15px", fontWeight: 700, cursor: "pointer" }}>{loading ? "Signing in…" : "Sign In"}</button>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
}
