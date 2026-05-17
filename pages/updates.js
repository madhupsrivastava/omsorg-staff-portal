import { useState, useEffect, useRef } from "react";
import Head from "next/head";
import { createBrowserClient } from "../lib/supabase";

const G = "#8B1A1A";
const GL = "#FFF0F0";

const UPDATE_TYPES = [
  { value: "daily",    label: "Daily Update",   emoji: "📋" },
  { value: "health",   label: "Health Update",  emoji: "🏥" },
  { value: "meal",     label: "Meal Update",    emoji: "🍽️" },
  { value: "incident", label: "Incident",       emoji: "⚠️" },
  { value: "activity", label: "Activity",       emoji: "🎯" },
  { value: "general",  label: "General",        emoji: "💬" },
];

const MEAL_OPTIONS   = ["Good", "Partial", "Poor", "Refused", "N/A"];
const MED_OPTIONS    = ["Taken", "Partial", "Missed", "N/A"];
const SLEEP_OPTIONS  = ["Good", "Fair", "Poor", "N/A"];
const MOOD_OPTIONS   = ["Calm", "Cheerful", "Anxious", "Confused", "Upset", "Sleeping", "Other"];
const LANG_OPTIONS   = [{ v: "english", l: "English" }, { v: "hindi", l: "हिन्दी" }, { v: "hinglish", l: "Hinglish" }];
const TONE_OPTIONS   = [
  { v: "professional", l: "Professional" },
  { v: "warm",         l: "Warm & Reassuring" },
  { v: "short",        l: "Short WhatsApp" },
  { v: "detailed",     l: "Detailed" },
];

const STATUS_COLOURS = {
  draft:        { bg: "#F3F4F6", text: "#6B7280" },
  generated:    { bg: "#DBEAFE", text: "#1D4ED8" },
  needs_review: { bg: "#FEF3C7", text: "#92400E" },
  approved:     { bg: "#D1FAE5", text: "#065F46" },
  published:    { bg: "#8B1A1A", text: "#FFFFFF" },
  archived:     { bg: "#F3F4F6", text: "#9CA3AF" },
};

function BtnGrid({ options, value, onChange, emoji }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
      {options.map(o => {
        const v = typeof o === "string" ? o : o.v || o.value;
        const l = typeof o === "string" ? o : o.l || o.label;
        const em = typeof o === "object" ? (o.emoji || "") : "";
        const sel = value === v;
        return (
          <button key={v} onClick={() => onChange(v)} style={{
            padding: "8px 14px", borderRadius: "20px", fontSize: "13px", fontWeight: 600,
            cursor: "pointer", border: sel ? "none" : "1px solid #e5e7eb",
            background: sel ? G : "#fff", color: sel ? "#fff" : "#374151",
          }}>
            {em}{em ? " " : ""}{l}
          </button>
        );
      })}
    </div>
  );
}

function Field({ label, children, hint }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <div style={{ fontSize: "12px", fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>{label}</div>
      {children}
      {hint && <div style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "4px" }}>{hint}</div>}
    </div>
  );
}

function BigTA({ value, onChange, placeholder, rows = 4 }) {
  return (
    <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
      style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #e5e7eb", fontSize: "15px", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box", lineHeight: "1.6" }} />
  );
}

function StatusBadge({ status }) {
  const s = STATUS_COLOURS[status] || STATUS_COLOURS.draft;
  return (
    <span style={{ background: s.bg, color: s.text, padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
      {status?.replace("_", " ")}
    </span>
  );
}

function UpdateCard({ update, onSelect }) {
  return (
    <div onClick={() => onSelect(update)} style={{
      background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px",
      padding: "14px 16px", marginBottom: "10px", cursor: "pointer",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
        <div style={{ fontWeight: 700, fontSize: "14px", color: "#111827" }}>{update.client_name}</div>
        <StatusBadge status={update.approval_status} />
      </div>
      <div style={{ fontSize: "12px", color: "#6B7280" }}>
        {UPDATE_TYPES.find(t => t.value === update.update_type)?.emoji} {update.update_type} · {update.date} · {update.staff_name}
      </div>
      {update.serious_concern && (
        <div style={{ marginTop: "6px", fontSize: "11px", color: "#991B1B", fontWeight: 600 }}>⚠️ Supervisor review required</div>
      )}
    </div>
  );
}

export default function Updates() {
  const [view, setView]     = useState("list");
  const [updates, setUpdates] = useState([]);
  const [clients, setClients] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");
  const [activeTab, setActiveTab] = useState("standard");

  // Form state
  const [clientId,      setClientId]      = useState("");
  const [clientName,    setClientName]    = useState("");
  const [staffName,     setStaffName]     = useState("");
  const [updateDate,    setUpdateDate]    = useState(new Date().toISOString().split("T")[0]);
  const [updateType,    setUpdateType]    = useState("daily");
  const [meals,         setMeals]         = useState("");
  const [medication,    setMedication]    = useState("");
  const [mood,          setMood]          = useState("");
  const [mobility,      setMobility]      = useState("");
  const [sleep,         setSleep]         = useState("");
  const [healthObs,     setHealthObs]     = useState("");
  const [hasConcern,    setHasConcern]    = useState(false);
  const [concernDetails,setConcernDetails]= useState("");
  const [roughNotes,    setRoughNotes]    = useState("");
  const [language,      setLanguage]      = useState("english");
  const [tone,          setTone]          = useState("warm");
  const [generated,     setGenerated]     = useState(null);
  const [editedUpdate,  setEditedUpdate]  = useState("");
  const [savedId,       setSavedId]       = useState(null);

  useEffect(() => {
    loadUpdates();
    fetch("/api/clients").then(r => r.json()).then(d => setClients(d.clients || []));
  }, []);

  const loadUpdates = async () => {
    const res = await fetch("/api/updates/list");
    const data = await res.json();
    setUpdates(data.updates || []);
  };

  const token = () => null;

  const handleGenerate = async () => {
    if (!clientName || !updateType) return setError("Client name and update type are required");
    setGenerating(true); setError(""); setGenerated(null);
    const res = await fetch("/api/updates/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientName, clientId, date: updateDate, updateType,
        mealsTaken: meals, medicationStatus: medication,
        moodBehaviour: mood, mobilityActivity: mobility,
        sleepRest: sleep, healthObservations: healthObs,
        concernFlag: hasConcern, concernDetails, roughNotes, language, tone,
      }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setGenerating(false); return; }
    setGenerated(data);
    setEditedUpdate(data.standard_update);
    setGenerating(false);
  };

  const handleSave = async (status = "generated") => {
    setSaving(true); setError("");
    const payload = {
      id: savedId, clientId, clientName, staffName, date: updateDate, updateType,
      mealsTaken: meals, medicationStatus: medication, moodBehaviour: mood,
      mobilityActivity: mobility, sleepRest: sleep, healthObservations: healthObs,
      concernFlag: hasConcern, concernDetails, roughNotes, language, tone,
      shortUpdate: generated?.short_update,
      standardUpdate: generated?.standard_update,
      detailedUpdate: generated?.detailed_update,
      publishedUpdate: editedUpdate,
      approvalStatus: status,
      supervisorReviewRequired: generated?.supervisor_review_required,
      reviewReason: generated?.review_reason,
    };
    const res = await fetch("/api/updates/save", {
      method: savedId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setSaving(false); return; }
    setSavedId(data.id);
    setSaving(false);
    // Refresh list
    if (status === "needs_review" || status === "generated") {
      alert(status === "needs_review" ? "Sent for supervisor review!" : "Saved as draft.");
    }
  };

  const handleApprove = async (action) => {
    if (!selected) return;
    const publishedUpdate = action === "publish" ? (selected.published_update || selected.standard_update) : undefined;
    const res = await fetch("/api/updates/approve", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selected.id, action, publishedUpdate }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error);
    setView("list");
    setSelected(null);
  };

  const resetForm = () => {
    setClientId(""); setClientName(""); setUpdateType("daily");
    setMeals(""); setMedication(""); setMood(""); setMobility("");
    setSleep(""); setHealthObs(""); setHasConcern(false);
    setConcernDetails(""); setRoughNotes(""); setGenerated(null);
    setEditedUpdate(""); setSavedId(null); setError("");
  };


  const role = "supervisor"; // All staff have supervisor access for MVP // will use DB role in production
  const isSupervisor = ["admin", "supervisor"].includes(role);
  const pendingReview = updates.filter(u => u.approval_status === "needs_review");

  return (
    <>
      <Head><title>Family Update Generator — Omsorg</title></Head>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #F4F4F4; }
        input, textarea, select { font-family: inherit; }
        input:focus, textarea:focus, select:focus { outline: 2px solid ${G}; border-color: ${G}; }
      `}</style>

      {/* Header */}
      <div style={{ background: G, padding: "14px 16px 18px" }}>
        <a href="/" style={{ color: "#F5C0C0", fontSize: "12px", textDecoration: "none" }}>← Back to Portal</a>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
          <div>
            <div style={{ color: "#fff", fontSize: "19px", fontWeight: 700 }}>Family Update Generator</div>
            <div style={{ color: "#F5C0C0", fontSize: "12px" }}>Create & publish care updates for families</div>
          </div>
          {isSupervisor && pendingReview.length > 0 && (
            <div style={{ background: "#FEF3C7", color: "#92400E", padding: "6px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: 700 }}>
              ⏳ {pendingReview.length} pending review
            </div>
          )}
        </div>
        {/* Tab bar */}
        <div style={{ display: "flex", gap: "4px", marginTop: "14px" }}>
          {[["list","📋 Updates"], ["create","✏️ New Update"]].map(([v, l]) => (
            <button key={v} onClick={() => { setView(v); if (v === "create") resetForm(); }}
              style={{ padding: "7px 14px", borderRadius: "8px", border: "none", fontSize: "13px", fontWeight: 600,
                background: view === v ? "#fff" : "rgba(255,255,255,0.15)", color: view === v ? G : "#fff", cursor: "pointer" }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "16px", maxWidth: "560px", margin: "0 auto", paddingBottom: "40px" }}>

        {error && <div style={{ background: "#FEE2E2", color: "#991B1B", padding: "12px 14px", borderRadius: "10px", fontSize: "13px", marginBottom: "12px" }}>⚠️ {error}</div>}

        {/* ── LIST VIEW ── */}
        {view === "list" && (
          <div>
            {isSupervisor && pendingReview.length > 0 && (
              <div style={{ background: "#FEF3C7", borderRadius: "12px", padding: "14px", marginBottom: "16px" }}>
                <div style={{ fontWeight: 700, color: "#92400E", marginBottom: "8px" }}>⏳ Awaiting Supervisor Review</div>
                {pendingReview.map(u => <UpdateCard key={u.id} update={u} onSelect={u => { setSelected(u); setView("review"); }} />)}
              </div>
            )}
            <div style={{ fontSize: "12px", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "10px" }}>All Updates</div>
            {updates.length === 0 && <div style={{ textAlign: "center", color: "#9CA3AF", padding: "40px 0", fontSize: "14px" }}>No updates yet. Tap ✏️ New Update to get started.</div>}
            {updates.map(u => <UpdateCard key={u.id} update={u} onSelect={u => { setSelected(u); setView("review"); }} />)}
          </div>
        )}

        {/* ── CREATE VIEW ── */}
        {view === "create" && (
          <div>
            {/* Client & Date */}
            <div style={{ background: "#fff", borderRadius: "14px", padding: "16px", marginBottom: "12px" }}>
              <Field label="Your Name *">
                <input value={staffName} onChange={e => setStaffName(e.target.value)} placeholder="Enter your name" style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #e5e7eb", fontSize: "15px", boxSizing: "border-box" }} />
              </Field>
              <Field label="Client / Resident *">
                <select value={clientId} onChange={e => { setClientId(e.target.value); setClientName(clients.find(c=>c.id===e.target.value)?.name || ""); }}
                  style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #e5e7eb", fontSize: "15px", background: "#fff" }}>
                  <option value="">Select client…</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {!clients.length && <input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Or type client name" style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #e5e7eb", fontSize: "15px", marginTop: "8px" }} />}
              </Field>
              <Field label="Date">
                <input type="date" value={updateDate} onChange={e => setUpdateDate(e.target.value)}
                  style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #e5e7eb", fontSize: "15px" }} />
              </Field>
              <Field label="Update Type">
                <BtnGrid options={UPDATE_TYPES} value={updateType} onChange={setUpdateType} />
              </Field>
            </div>

            {/* Care Details */}
            <div style={{ background: "#fff", borderRadius: "14px", padding: "16px", marginBottom: "12px" }}>
              <div style={{ fontWeight: 700, color: "#111827", marginBottom: "14px" }}>Care Observations</div>
              <Field label="Meals Taken"><BtnGrid options={MEAL_OPTIONS} value={meals} onChange={setMeals} /></Field>
              <Field label="Medication"><BtnGrid options={MED_OPTIONS} value={medication} onChange={setMedication} /></Field>
              <Field label="Mood / Behaviour"><BtnGrid options={MOOD_OPTIONS} value={mood} onChange={setMood} /></Field>
              <Field label="Sleep / Rest"><BtnGrid options={SLEEP_OPTIONS} value={sleep} onChange={setSleep} /></Field>
              <Field label="Mobility / Activity">
                <input value={mobility} onChange={e => setMobility(e.target.value)} placeholder="e.g. Short walk in garden, seated exercises"
                  style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #e5e7eb", fontSize: "15px" }} />
              </Field>
              <Field label="Health Observations" hint="Observations only — do not diagnose">
                <BigTA value={healthObs} onChange={setHealthObs} placeholder="Any health observations during the shift…" rows={3} />
              </Field>
            </div>

            {/* Concerns */}
            <div style={{ background: hasConcern ? "#FFF5F5" : "#fff", border: hasConcern ? `1px solid ${G}` : "1px solid #e5e7eb", borderRadius: "14px", padding: "16px", marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: hasConcern ? "14px" : "0" }}>
                <div style={{ fontWeight: 700, color: "#111827" }}>Any concern to report?</div>
                <button onClick={() => setHasConcern(h => !h)} style={{
                  padding: "7px 16px", borderRadius: "20px", border: "none", fontWeight: 700, fontSize: "13px", cursor: "pointer",
                  background: hasConcern ? G : "#f3f4f6", color: hasConcern ? "#fff" : "#374151",
                }}>
                  {hasConcern ? "Yes ✓" : "No"}
                </button>
              </div>
              {hasConcern && (
                <Field label="Concern Details (Internal — not shared with family)" hint="Be specific. This is for internal records only.">
                  <BigTA value={concernDetails} onChange={setConcernDetails} placeholder="Describe what happened or what you observed…" rows={3} />
                </Field>
              )}
            </div>

            {/* Rough Notes */}
            <div style={{ background: "#fff", borderRadius: "14px", padding: "16px", marginBottom: "12px" }}>
              <Field label="Rough Notes" hint="Type anything — the AI will convert it into a professional update. Voice-to-text works well here.">
                <BigTA value={roughNotes} onChange={setRoughNotes} placeholder="e.g. Mrs sharma khana thoda khaya, mood theek tha, thodi walk karayi bahar, koi problem nahi…" rows={5} />
              </Field>
              <Field label="Language"><BtnGrid options={LANG_OPTIONS} value={language} onChange={setLanguage} /></Field>
              <Field label="Tone"><BtnGrid options={TONE_OPTIONS} value={tone} onChange={setTone} /></Field>
            </div>

            <button onClick={handleGenerate} disabled={generating || !clientName}
              style={{ width: "100%", padding: "16px", borderRadius: "12px", border: "none", fontSize: "16px", fontWeight: 700,
                background: generating || !clientName ? "#f3f4f6" : G, color: generating || !clientName ? "#9CA3AF" : "#fff", cursor: generating || !clientName ? "not-allowed" : "pointer" }}>
              {generating ? "✨ Generating update…" : "✨ Generate Family Update"}
            </button>

            {/* Generated Output */}
            {generated && (
              <div style={{ background: "#fff", borderRadius: "14px", padding: "16px", marginTop: "12px" }}>
                {generated.supervisor_review_required && (
                  <div style={{ background: "#FEF3C7", borderRadius: "10px", padding: "12px 14px", marginBottom: "14px" }}>
                    <div style={{ fontWeight: 700, color: "#92400E", marginBottom: "4px" }}>⚠️ Supervisor Review Recommended</div>
                    <div style={{ fontSize: "12px", color: "#92400E" }}>{generated.review_reason}</div>
                    <div style={{ fontSize: "12px", color: "#92400E", marginTop: "6px" }}>This update should be reviewed by a supervisor before being published to the family.</div>
                  </div>
                )}

                {/* Version tabs */}
                <div style={{ display: "flex", gap: "4px", marginBottom: "12px" }}>
                  {[["short","Short"], ["standard","Standard"], ["detailed","Detailed"]].map(([v, l]) => (
                    <button key={v} onClick={() => { setActiveTab(v); setEditedUpdate(generated[`${v}_update`]); }}
                      style={{ flex: 1, padding: "8px", borderRadius: "8px", border: "none", fontSize: "13px", fontWeight: 600,
                        background: activeTab === v ? G : "#f3f4f6", color: activeTab === v ? "#fff" : "#374151", cursor: "pointer" }}>
                      {l}
                    </button>
                  ))}
                </div>

                <Field label="Edit before saving" hint="Make any changes. This is what will be shown to the family after approval.">
                  <BigTA value={editedUpdate} onChange={setEditedUpdate} rows={6} />
                </Field>

                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button onClick={() => handleSave("draft")} disabled={saving}
                    style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "1px solid #e5e7eb", background: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", color: "#374151" }}>
                    💾 Save Draft
                  </button>
                  {generated.supervisor_review_required || !isSupervisor ? (
                    <button onClick={() => handleSave("needs_review")} disabled={saving}
                      style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "none", background: "#F59E0B", fontSize: "13px", fontWeight: 600, cursor: "pointer", color: "#fff" }}>
                      📨 Send for Review
                    </button>
                  ) : (
                    <button onClick={() => handleSave("published")} disabled={saving}
                      style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "none", background: G, fontSize: "13px", fontWeight: 600, cursor: "pointer", color: "#fff" }}>
                      ✅ Approve & Publish
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── REVIEW VIEW ── */}
        {view === "review" && selected && (
          <div>
            <button onClick={() => { setView("list"); setSelected(null); }}
              style={{ background: "none", border: "none", color: G, fontSize: "13px", fontWeight: 600, cursor: "pointer", marginBottom: "12px" }}>
              ← Back to list
            </button>
            <div style={{ background: "#fff", borderRadius: "14px", padding: "16px", marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <div style={{ fontWeight: 700, fontSize: "16px" }}>{selected.client_name}</div>
                <StatusBadge status={selected.approval_status} />
              </div>
              <div style={{ fontSize: "13px", color: "#6B7280", marginBottom: "12px" }}>
                {UPDATE_TYPES.find(t => t.value === selected.update_type)?.emoji} {selected.update_type} · {selected.date}<br/>
                Staff: {selected.staff_name}
              </div>
              {selected.serious_concern && (
                <div style={{ background: "#FEF3C7", borderRadius: "8px", padding: "10px 12px", marginBottom: "12px", fontSize: "13px", color: "#92400E", fontWeight: 600 }}>
                  ⚠️ {selected.serious_concern_reason || "Supervisor review recommended"}
                </div>
              )}
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", marginBottom: "6px" }}>Published Update (what family sees)</div>
              <div style={{ background: "#F9FAFB", borderRadius: "8px", padding: "12px", fontSize: "14px", lineHeight: "1.7", color: "#374151", marginBottom: "14px" }}>
                {selected.published_update || selected.standard_update || "Not yet generated"}
              </div>
              {isSupervisor && (
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {selected.approval_status !== "published" && (
                    <button onClick={() => handleApprove("publish")}
                      style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "none", background: G, fontSize: "13px", fontWeight: 600, cursor: "pointer", color: "#fff" }}>
                      ✅ Approve & Publish
                    </button>
                  )}
                  {selected.approval_status === "published" && (
                    <button onClick={() => handleApprove("archive")}
                      style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "1px solid #e5e7eb", background: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", color: "#6B7280" }}>
                      Archive
                    </button>
                  )}
                  <button onClick={() => handleApprove("reject")}
                    style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "1px solid #e5e7eb", background: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", color: "#991B1B" }}>
                    Return to Draft
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export const getServerSideProps = () => ({ props: {} });
