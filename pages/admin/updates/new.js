import { useState, useEffect, useRef } from "react";
import Head from "next/head";

const G = "#8B1A1A";

const CATEGORIES = [
  { value: "attendance", label: "Attendance" },
  { value: "personal_care", label: "Personal Care" },
  { value: "medication", label: "Medication" },
  { value: "meal_food", label: "Meal / Food Intake" },
  { value: "toileting", label: "Toileting / Urine / Bowel" },
  { value: "activity", label: "Activity" },
  { value: "health_observation", label: "Health Observation" },
  { value: "incident_concern", label: "Incident / Concern" },
  { value: "general", label: "General Update" },
];

function Card({ children }) {
  return <div style={{ background: "#fff", borderRadius: "14px", padding: "18px", border: "1px solid #f3f4f6", marginBottom: "12px" }}>{children}</div>;
}

function Label({ children }) {
  return <div style={{ fontSize: "11px", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>{children}</div>;
}

export default function NewUpdate() {
  const [clients, setClients] = useState([]);
  const [clientId, setClientId] = useState("");
  const [staffName, setStaffName] = useState("");
  const [supervisorName, setSupervisorName] = useState("");
  const [category, setCategory] = useState("general");
  const [rawMessage, setRawMessage] = useState("");
  const [familyMessage, setFamilyMessage] = useState("");
  const [source, setSource] = useState("whatsapp");
  const [images, setImages] = useState([]);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetch("/api/families/clients")
      .then(r => r.json())
      .then(d => setClients(d.clients || []));
  }, []);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    const processed = [];
    for (const file of files) {
      const base64 = await new Promise((res) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result);
        reader.readAsDataURL(file);
      });
      processed.push({
        preview: base64,
        base64,
        filename: file.name,
        content_type: file.type,
      });
    }
    setImages([...images, ...processed]);
    e.target.value = "";
  };

  const removeImage = (idx) => setImages(images.filter((_, i) => i !== idx));

  const handlePublish = async (e) => {
    e.preventDefault();
    setError(""); setSuccess(""); setPublishing(true);

    const selectedClient = clients.find(c => c.id === clientId);
    if (!selectedClient) {
      setError("Please select a client.");
      setPublishing(false);
      return;
    }

    try {
      const createRes = await fetch("/api/admin/updates/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          client_name: selectedClient.name,
          staff_name: staffName,
          supervisor_name: supervisorName,
          category,
          raw_message: rawMessage,
          family_message: familyMessage,
          source,
        }),
      });
      const createData = await createRes.json();
      if (!createRes.ok) throw new Error(createData.error || "Failed to publish");

      const updateId = createData.update.id;

      for (const img of images) {
        const uploadRes = await fetch("/api/admin/upload-media", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            update_id: updateId,
            client_id: clientId,
            filename: img.filename,
            content_type: img.content_type,
            base64_data: img.base64,
          }),
        });
        if (!uploadRes.ok) console.error("Image upload failed:", await uploadRes.json());
      }

      setSuccess(`Update published${images.length ? ` with ${images.length} photo(s)` : ""}!`);
      setClientId(""); setStaffName(""); setRawMessage(""); setFamilyMessage("");
      setImages([]); setCategory("general");
    } catch (e) {
      setError(e.message);
    } finally {
      setPublishing(false);
    }
  };

  const inputStyle = { width: "100%", padding: "11px 12px", borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "14px", fontFamily: "inherit", boxSizing: "border-box", background: "#fff" };
  const textareaStyle = { ...inputStyle, minHeight: "100px", resize: "vertical" };

  return (
    <>
      <Head><title>New Update — Omsorg</title></Head>
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #F4F4F4; }`}</style>

      <div style={{ background: G, padding: "14px 16px 18px" }}>
        <a href="/" style={{ color: "#F5C0C0", fontSize: "12px", textDecoration: "none" }}>← Back to Portal</a>
        <div style={{ color: "#fff", fontSize: "19px", fontWeight: 700, marginTop: "8px" }}>New Care Update</div>
        <div style={{ color: "#F5C0C0", fontSize: "12px" }}>Paste a WhatsApp message, polish for family, publish</div>
      </div>

      <div style={{ padding: "16px", maxWidth: "560px", margin: "0 auto", paddingBottom: "60px" }}>
        <form onSubmit={handlePublish}>
          <Card>
            <div style={{ fontWeight: 700, color: "#111827", marginBottom: "14px", fontSize: "15px" }}>Update Details</div>
            <div style={{ marginBottom: "12px" }}>
              <Label>Client / Resident *</Label>
              <select value={clientId} onChange={e => setClientId(e.target.value)} required style={inputStyle}>
                <option value="">Select client…</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: "12px" }}>
              <Label>Category *</Label>
              <select value={category} onChange={e => setCategory(e.target.value)} required style={inputStyle}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: "12px" }}>
              <Label>Staff Name (GDA / Attendant) *</Label>
              <input type="text" value={staffName} onChange={e => setStaffName(e.target.value)} required placeholder="e.g. Priya Devi" style={inputStyle} />
            </div>
            <div>
              <Label>Supervisor Name</Label>
              <input type="text" value={supervisorName} onChange={e => setSupervisorName(e.target.value)} placeholder="Your name (optional)" style={inputStyle} />
            </div>
          </Card>

          <Card>
            <div style={{ fontWeight: 700, color: "#111827", marginBottom: "14px", fontSize: "15px" }}>Content</div>
            <div style={{ marginBottom: "12px" }}>
              <Label>Source</Label>
              <select value={source} onChange={e => setSource(e.target.value)} style={inputStyle}>
                <option value="whatsapp">WhatsApp paste</option>
                <option value="manual">Manual entry</option>
                <option value="app">From app</option>
              </select>
            </div>
            <div style={{ marginBottom: "12px" }}>
              <Label>Raw WhatsApp message {source === "whatsapp" ? "*" : ""}</Label>
              <textarea value={rawMessage} onChange={e => setRawMessage(e.target.value)} placeholder="Paste the original WhatsApp message here…" style={textareaStyle} required={source === "whatsapp"} />
              <div style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "4px" }}>Kept for internal records. Family won't see this.</div>
            </div>
            <div>
              <Label>Family-facing message *</Label>
              <textarea value={familyMessage} onChange={e => setFamilyMessage(e.target.value)} placeholder="Write the polished, warm message the family will see…" style={textareaStyle} required />
              <div style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "4px" }}>This appears on the family's timeline.</div>
            </div>
          </Card>

          <Card>
            <div style={{ fontWeight: 700, color: "#111827", marginBottom: "14px", fontSize: "15px" }}>Photos (optional)</div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileSelect} style={{ display: "none" }} />
            <button type="button" onClick={() => fileInputRef.current?.click()} style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "2px dashed #d1d5db", background: "#fafafa", color: "#6b7280", fontSize: "13px", cursor: "pointer", fontFamily: "inherit" }}>
              📷 Add photo(s)
            </button>
            {images.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginTop: "12px" }}>
                {images.map((img, idx) => (
                  <div key={idx} style={{ position: "relative", aspectRatio: "1", borderRadius: "8px", overflow: "hidden", background: "#f3f4f6" }}>
                    <img src={img.preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <button type="button" onClick={() => removeImage(idx)} style={{ position: "absolute", top: "4px", right: "4px", background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", borderRadius: "12px", width: "22px", height: "22px", fontSize: "12px", cursor: "pointer", lineHeight: "1" }}>×</button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {error && <div style={{ background: "#FEE2E2", color: "#991B1B", padding: "10px 12px", borderRadius: "8px", fontSize: "13px", marginBottom: "12px" }}>{error}</div>}
          {success && <div style={{ background: "#D1FAE5", color: "#065F46", padding: "10px 12px", borderRadius: "8px", fontSize: "13px", marginBottom: "12px" }}>✅ {success}</div>}

          <button type="submit" disabled={publishing} style={{ width: "100%", padding: "14px", borderRadius: "10px", border: "none", background: publishing ? "#f3f4f6" : G, color: publishing ? "#9CA3AF" : "#fff", fontSize: "15px", fontWeight: 700, cursor: publishing ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
            {publishing ? "Publishing…" : "Publish Update →"}
          </button>
        </form>
      </div>
    </>
  );
}
