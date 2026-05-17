import { createServerClient } from "../../../lib/supabase";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("clients")
    .select("id, name, care_type")
    .eq("active", true)
    .order("name");

  if (error) {
    console.error("Clients fetch error:", error);
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({
    clients: (data || []).map(c => ({
      id: c.id,
      name: c.name,
      care_type: c.care_type,
    }))
  });
}
