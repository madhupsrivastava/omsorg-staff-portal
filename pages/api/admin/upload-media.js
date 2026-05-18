import { createClient } from "@supabase/supabase-js";

export const config = {
  api: {
    bodyParser: { sizeLimit: "12mb" },
  },
};

function checkPasscode(req) {
  const pass = req.headers["x-admin-pass"];
  return pass && pass === process.env.ADMIN_PASSCODE;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  if (!checkPasscode(req)) return res.status(401).json({ error: "Unauthorized" });

  try {
    const { update_id, client_id, filename, content_type, base64_data, caption } = req.body;

    if (!update_id || !client_id || !filename || !content_type || !base64_data) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const base64 = base64_data.includes(",") ? base64_data.split(",")[1] : base64_data;
    const buffer = Buffer.from(base64, "base64");

    const ext = (filename.split(".").pop() || "jpg").toLowerCase();
    const safeFilename = Date.now() + "-" + Math.random().toString(36).slice(2, 8) + "." + ext;
    const path = client_id + "/" + update_id + "/" + safeFilename;

    const { error: uploadError } = await supabase.storage
      .from("update-media")
      .upload(path, buffer, {
        contentType: content_type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return res.status(500).json({ error: uploadError.message });
    }

    const { data: mediaRow, error: dbError } = await supabase
      .from("update_media")
      .insert({
        update_id,
        client_id,
        media_url: path,
        media_type: "image",
        caption: caption || null,
      })
      .select()
      .single();

    if (dbError) {
      console.error("DB error:", dbError);
      await supabase.storage.from("update-media").remove([path]);
      return res.status(500).json({ error: dbError.message });
    }

    return res.status(200).json({ media: mediaRow });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
