import { createServerClient } from "../../../lib/supabase";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();


  const supabase = createServerClient();
  const { status, clientId, limit = 50 } = req.query;

  let query = supabase
    .from("updates")
    .select(`
      id, client_id, client_name, date, update_type,
      staff_name, concern_flag, serious_concern,
      approval_status, supervisor_name, published_at, created_at,
      short_update, standard_update, detailed_update, published_update,
      language, tone, supervisor_review_required: serious_concern,
      meals_taken, medication_status, mood_behaviour,
      mobility_activity, sleep_rest, health_observations,
      concern_details, rough_notes, review_reason: serious_concern_reason
    `)
    .order("created_at", { ascending: false })
    .limit(Number(limit));

  if (status) query = query.eq("approval_status", status);
  if (clientId) query = query.eq("client_id", clientId);

  const { data, error } = await query;
  if (error) { console.error(error); return res.status(500).json({ error: error.message }); }

  return res.status(200).json({ updates: data || [] });
}
