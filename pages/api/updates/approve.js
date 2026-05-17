import { createServerClient } from "../../../lib/supabase";

export default async function handler(req, res) {
  if (req.method !== "PATCH") return res.status(405).end();

  // Only supervisor and admin can approve/publish

  const { id, action, publishedUpdate } = req.body;
  // action: "approve" | "publish" | "reject" | "archive"

  if (!id || !action) return res.status(400).json({ error: "Missing id or action" });

  const statusMap = {
    approve: "approved",
    publish: "published",
    reject:  "draft",
    archive: "archived",
  };

  if (!statusMap[action]) return res.status(400).json({ error: "Invalid action" });

  const supabase = createServerClient();

  const updatePayload = {
    approval_status:  statusMap[action],
    supervisor_id:    "staff",
    supervisor_name:  "Staff Member",
  };

  if (action === "approve" || action === "publish") {
    updatePayload.approved_at = new Date().toISOString();
  }
  if (action === "publish") {
    if (!publishedUpdate) return res.status(400).json({ error: "Published update text is required" });
    updatePayload.published_update = publishedUpdate;
    updatePayload.published_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("updates")
    .update(updatePayload)
    .eq("id", id);

  if (error) { console.error(error); return res.status(500).json({ error: error.message }); }

  return res.status(200).json({ success: true, status: statusMap[action] });
}
