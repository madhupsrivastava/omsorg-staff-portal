import { createServerClient } from "../../../lib/supabase";

export default async function handler(req, res) {
  if (req.method !== "POST" && req.method !== "PATCH") return res.status(405).end();


  const supabase = createServerClient();
  const {
    id, clientId, clientName, date, updateType,
    mealsTaken, medicationStatus, moodBehaviour,
    mobilityActivity, sleepRest, healthObservations,
    concernFlag, concernDetails, roughNotes,
    language, tone,
    shortUpdate, standardUpdate, detailedUpdate,
    publishedUpdate, approvalStatus,
    supervisorReviewRequired, reviewReason,
  } = req.body;

  const payload = {
    client_id:            clientId,
    client_name:          clientName,
    date:                 date || new Date().toISOString().split("T")[0],
    update_type:          updateType,
    staff_id:             "staff",
    staff_name:           "Staff Member",
    rough_notes:          roughNotes,
    meals_taken:          mealsTaken,
    medication_status:    medicationStatus,
    mood_behaviour:       moodBehaviour,
    mobility_activity:    mobilityActivity,
    sleep_rest:           sleepRest,
    health_observations:  healthObservations,
    concern_flag:         concernFlag || false,
    concern_details:      concernDetails,
    serious_concern:      supervisorReviewRequired || false,
    serious_concern_reason: reviewReason,
    language:             language || "english",
    tone:                 tone || "warm",
    short_update:         shortUpdate,
    standard_update:      standardUpdate,
    detailed_update:      detailedUpdate,
    published_update:     publishedUpdate,
    approval_status:      approvalStatus || "draft",
  };

  let result;
  if (req.method === "POST") {
    // Create new update
    const { data, error } = await supabase
      .from("updates")
      .insert(payload)
      .select("id")
      .single();
    if (error) { console.error(error); return res.status(500).json({ error: error.message }); }
    result = data;
  } else {
    // Update existing
    if (!id) return res.status(400).json({ error: "Missing update ID" });
    const { data, error } = await supabase
      .from("updates")
      .update(payload)
      .eq("id", id)
      .select("id")
      .single();
    if (error) { console.error(error); return res.status(500).json({ error: error.message }); }
    result = data;
  }

  return res.status(200).json({ id: result.id });
}
