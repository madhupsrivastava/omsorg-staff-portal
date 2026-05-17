import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabase
      .from("clients")
      .select("id, name, care_type")
      .order("name", { ascending: true });

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ clients: data });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
