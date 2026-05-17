import { useEffect } from "react";
import { createBrowserClient } from "../../lib/supabase";

export default function AuthCallback() {
  useEffect(() => {
    const supabase = createBrowserClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) window.location.href = "/";
      else window.location.href = "/login";
    });
  }, []);

  return (
    <div style={{ fontFamily: "-apple-system, sans-serif", background: "#F4F4F4", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "16px" }}>
      <div style={{ width: "36px", height: "36px", border: "3px solid #8B1A1A", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <div style={{ color: "#8B1A1A", fontWeight: 600 }}>Signing you in…</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
