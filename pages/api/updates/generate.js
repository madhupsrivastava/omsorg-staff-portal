import { requireAuth } from "../../../lib/supabase";

const SERIOUS_KEYWORDS = [
  "fall", "fell", "fallen", "injury", "injured", "hurt", "bleeding",
  "hospital", "hospitalised", "hospitalisation", "emergency", "ambulance",
  "missed medication", "refused medication", "chest pain", "breathing",
  "breathless", "unconscious", "unresponsive", "confusion", "confused",
  "seizure", "stroke", "fever", "high temperature", "aggression",
  "aggressive", "violent", "severe pain", "loss of consciousness"
];

function detectSeriousConcern(text) {
  if (!text) return { found: false, keywords: [] };
  const lower = text.toLowerCase();
  const found = SERIOUS_KEYWORDS.filter(kw => lower.includes(kw));
  return { found: found.length > 0, keywords: found };
}

function buildPrompt(data) {
  const {
    clientName, date, updateType, staffName,
    mealsTaken, medicationStatus, moodBehaviour,
    mobilityActivity, sleepRest, healthObservations,
    concernFlag, concernDetails, roughNotes, language, tone
  } = data;

  const langInstruction = language === "hindi"
    ? "Write entirely in Hindi (Devanagari script)."
    : language === "hinglish"
    ? "Write in Hinglish — a natural mix of Hindi and English as commonly used in Indian WhatsApp messages."
    : "Write in clear, warm English.";

  const toneInstruction = {
    professional: "Use a formal, professional tone suitable for official communication.",
    warm: "Use a warm, reassuring, caring tone — like a trusted friend sharing good news about a loved one.",
    short: "Write a very brief WhatsApp-style message — 2 to 3 sentences maximum.",
    detailed: "Write a comprehensive, detailed update covering all aspects of care.",
  }[tone] || "Use a warm, reassuring tone.";

  const hasConcern = concernFlag && concernDetails;

  return `You are a professional care update writer for Omsorg Elder Care, India.

Convert these staff observations into polished family updates for WhatsApp.

MANDATORY SAFETY RULES:
1. NEVER diagnose or suggest any medical diagnosis
2. NEVER write "stable" or "doing well" if concerns exist — acknowledge them honestly but gently
3. NEVER hide incidents, falls, or concerns — they must be mentioned appropriately
4. NEVER exaggerate or add medical details not provided
5. Use respectful, warm language always
6. If serious concerns exist, suggest family contact the care team directly
7. Always end with: "Please feel free to contact us if you would like any further details."
8. Do NOT give clinical advice or treatment suggestions
9. Do NOT use alarming language unless the situation is genuinely urgent

LANGUAGE: ${langInstruction}
TONE: ${toneInstruction}

CARE DETAILS FOR ${clientName.toUpperCase()} — ${date}:
- Update type: ${updateType}
- Staff: ${staffName}
- Meals: ${mealsTaken || "Not recorded"}
- Medication: ${medicationStatus || "Not recorded"}
- Mood/Behaviour: ${moodBehaviour || "Not recorded"}
- Mobility/Activity: ${mobilityActivity || "Not recorded"}
- Sleep/Rest: ${sleepRest || "Not recorded"}
- Health observations: ${healthObservations || "None noted"}
${hasConcern ? `- CONCERN NOTED: ${concernDetails}` : "- No concerns noted"}
- Staff rough notes: ${roughNotes || "None"}

Generate THREE versions of the family update:
1. SHORT: 2-3 sentences maximum
2. STANDARD: 4-6 sentences, WhatsApp-friendly
3. DETAILED: Full paragraph, comprehensive

Respond ONLY with valid JSON in this exact format:
{
  "short": "...",
  "standard": "...",
  "detailed": "...",
  "supervisor_review_required": true or false,
  "review_reason": "explain why supervisor review is needed, or empty string if not needed"
}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  // Only staff, supervisor, or admin can generate updates

  const data = req.body;
  if (!data.clientName || !data.updateType) {
    return res.status(400).json({ error: "Client name and update type are required" });
  }

  // Detect serious concerns from rough notes + concern details
  const textToCheck = `${data.roughNotes || ""} ${data.concernDetails || ""}`;
  const { found: seriousConcern, keywords } = detectSeriousConcern(textToCheck);

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        messages: [{ role: "user", content: buildPrompt(data) }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Anthropic error:", err);
      return res.status(500).json({ error: "AI generation failed. Please try again." });
    }

    const aiData = await response.json();
    const rawText = aiData.content?.[0]?.text || "";

    // Parse JSON response
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(500).json({ error: "Could not parse AI response" });

    const generated = JSON.parse(jsonMatch[0]);

    return res.status(200).json({
      short_update:    generated.short,
      standard_update: generated.standard,
      detailed_update: generated.detailed,
      supervisor_review_required: seriousConcern || generated.supervisor_review_required,
      review_reason: seriousConcern
        ? `Serious concern keywords detected: ${keywords.join(", ")}`
        : generated.review_reason || "",
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
