import { createClient } from "@supabase/supabase-js";

function checkPasscode(req) {
  const pass = req.headers["x-admin-pass"];
  return pass && pass === process.env.ADMIN_PASSCODE;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  if (!checkPasscode(req)) return res.status(401).json({ error: "Unauthorized" });

  try {
    const {
      client_id, client_name, staff_name, supervisor_name,
      category, raw_message, family_message, source,
    } = req.body;

    if (!client_id || !client_name || !staff_name || !category || !family_message) {
      return res.status(400).json({
        error: "Missing required fields: client_id, client_name, staff_name, category, family_message"
      });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabase
      .from("updates")
      .insert({
        client_id,
        client_name,
        staff_name,
        supervisor_name: supervisor_name || null,
        category,
        raw_message: raw_message || null,
        published_update: family_message,
        source: source || "manual",
        approval_status: "published",
        published_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Insert error:", error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ update: data });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
