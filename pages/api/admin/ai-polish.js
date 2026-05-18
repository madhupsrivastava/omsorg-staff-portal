// Passcode-protected. Takes raw WhatsApp message + optional structured care details,
// returns a warm family-facing message in the chosen language.

function checkPasscode(req) {
  const pass = req.headers["x-admin-pass"];
  return pass && pass === process.env.ADMIN_PASSCODE;
}

const CATEGORY_LABELS = {
  attendance: "Attendance",
  personal_care: "Personal Care",
  medication: "Medication",
  meal_food: "Meal / Food Intake",
  toileting: "Toileting / Urine / Bowel",
  activity: "Activity",
  health_observation: "Health Observation",
  incident_concern: "Incident / Concern",
  general: "General Update",
};

const LANGUAGE_INSTRUCTIONS = {
  english: "Write in clear, warm English suitable for an Indian family audience.",
  hindi: "Write in natural Hindi using Devanagari script. Use a warm, respectful tone.",
  hinglish: "Write in Hinglish (Hindi-English mix in Roman script) — natural and conversational, as Indian families speak in WhatsApp.",
};

function buildPrompt(input) {
  const {
    raw_message, client_name, category, staff_name, language,
    meals_taken, medication_status, mood_behaviour, mobility_activity,
    sleep_rest, health_observations, concern_flag, concern_details,
  } = input;

  const categoryLabel = CATEGORY_LABELS[category] || "General Update";
  const langInstruction = LANGUAGE_INSTRUCTIONS[language] || LANGUAGE_INSTRUCTIONS.english;

  const filledStructured = [];
  if (meals_taken && meals_taken.trim()) filledStructured.push("- Meals: " + meals_taken.trim());
  if (medication_status && medication_status.trim()) filledStructured.push("- Medication: " + medication_status.trim());
  if (mood_behaviour && mood_behaviour.trim()) filledStructured.push("- Mood / Behaviour: " + mood_behaviour.trim());
  if (mobility_activity && mobility_activity.trim()) filledStructured.push("- Mobility / Activity: " + mobility_activity.trim());
  if (sleep_rest && sleep_rest.trim()) filledStructured.push("- Sleep / Rest: " + sleep_rest.trim());
  if (health_observations && health_observations.trim()) filledStructured.push("- Health observations: " + health_observations.trim());
  if (concern_flag && concern_details && concern_details.trim()) {
    filledStructured.push("- Concern flagged by supervisor: " + concern_details.trim());
  }

  let extraContext = "";
  if (filledStructured.length > 0) {
    extraContext = "\nADDITIONAL CARE DETAILS THE SUPERVISOR NOTED:\n" + filledStructured.join("\n") + "\n";
  }

  let rawSection = "";
  if (raw_message && raw_message.trim()) {
    rawSection = '\nRAW MESSAGE FROM FIELD (may be English, Hindi, or Hinglish):\n"""\n' + raw_message.trim() + '\n"""\n';
  }

  const staffLine = staff_name ? "STAFF MEMBER PROVIDING CARE: " + staff_name : "";

  return [
    "You are writing a warm, family-facing care update for an elderly client in India. The family member will read this on a mobile app and wants reassurance that their loved one is being well cared for.",
    "",
    "CLIENT: " + (client_name || "the client"),
    "UPDATE CATEGORY: " + categoryLabel,
    staffLine,
    rawSection,
    extraContext,
    "LANGUAGE: " + langInstruction,
    "",
    "GUIDELINES:",
    "- Warm, caring, professional tone — like a trusted nurse or care coordinator updating the family.",
    "- Be faithful to the facts above. Do NOT invent details, times, names, or medical claims that aren't in the source.",
    "- Keep it tight: 2-4 sentences typically; occasionally 5 for serious updates.",
    "- Refer to the client respectfully (first name, or 'Mr./Mrs. [Surname]').",
    "- No clinical jargon. No medical advice.",
    "- Do NOT include the staff or supervisor name in the message body.",
    "- Do NOT add greetings, sign-offs, or quotation marks around the message.",
    "- If a concern is flagged, acknowledge it calmly and reassure that the team is monitoring — don't alarm the family.",
    "- Return ONLY the rewritten family-facing message. No preamble, no explanations, no labels.",
  ].filter(Boolean).join("\n");
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  if (!checkPasscode(req)) return res.status(401).json({ error: "Unauthorized" });

  const body = req.body || {};
  const { raw_message } = body;

  const hasRaw = raw_message && raw_message.trim().length >= 3;
  const hasStructured = !!(
    (body.meals_taken && body.meals_taken.trim()) ||
    (body.medication_status && body.medication_status.trim()) ||
    (body.mood_behaviour && body.mood_behaviour.trim()) ||
    (body.mobility_activity && body.mobility_activity.trim()) ||
    (body.sleep_rest && body.sleep_rest.trim()) ||
    (body.health_observations && body.health_observations.trim()) ||
    (body.concern_flag && body.concern_details && body.concern_details.trim())
  );

  if (!hasRaw && !hasStructured) {
    return res.status(400).json({ error: "Please paste a WhatsApp message or fill at least one care detail before using AI Polish." });
  }

  const prompt = buildPrompt({
    raw_message: body.raw_message,
    client_name: body.client_name,
    category: body.category,
    staff_name: body.staff_name,
    language: body.language || "english",
    meals_taken: body.meals_taken,
    medication_status: body.medication_status,
    mood_behaviour: body.mood_behaviour,
    mobility_activity: body.mobility_activity,
    sleep_rest: body.sleep_rest,
    health_observations: body.health_observations,
    concern_flag: body.concern_flag,
    concern_details: body.concern_details,
  });

  try {
    const apiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 800,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      console.error("Anthropic API error:", apiRes.status, errText);
      return res.status(500).json({ error: "AI service error. Please try again." });
    }

    const data = await apiRes.json();
    const polished = (data.content && data.content[0] && data.content[0].text) ? data.content[0].text.trim() : "";

    if (!polished) {
      return res.status(500).json({ error: "AI returned an empty response. Please try again." });
    }

    return res.status(200).json({ polished });
  } catch (e) {
    console.error("AI polish error:", e);
    return res.status(500).json({ error: e.message || "AI service error" });
  }
}
