import { requireAuth, createServerClient } from "../../../lib/supabase";

async function notifyFamily(supabase, clientId, clientName, updateType, publishedUpdate) {
  try {
    // Get all family members linked to this client
    const { data: access } = await supabase
      .from("family_client_access")
      .select("users!family_client_access_user_id_fkey (id, email, full_name, active)")
      .eq("client_id", clientId);

    if (!access?.length) return;

    const activeFamily = access
      .map(a => a.users)
      .filter(u => u?.active && u?.email);

    if (!activeFamily.length) return;

    const UPDATE_TYPE_LABELS = {
      daily: "Daily Update", health: "Health Update", meal: "Meal Update",
      incident: "Care Note", activity: "Activity Update", general: "Update"
    };

    const typeLabel = UPDATE_TYPE_LABELS[updateType] || "Update";
    const preview = publishedUpdate?.slice(0, 120) + (publishedUpdate?.length > 120 ? "…" : "");

    // Send notification email to each family member
    // Using Supabase's built-in auth email or a simple webhook
    // For now, log the notification (replace with your email provider)
    console.log(`NOTIFY: ${activeFamily.length} family member(s) for ${clientName} — ${typeLabel}`);

    // If you have Resend, SendGrid, or similar configured:
    // const emailPromises = activeFamily.map(user =>
    //   fetch("https://api.resend.com/emails", {
    //     method: "POST",
    //     headers: { "Authorization": `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    //     body: JSON.stringify({
    //       from: "Omsorg Care <updates@omsorg.co.in>",
    //       to: user.email,
    //       subject: `New ${typeLabel} for ${clientName} — Omsorg`,
    //       html: `<p>Dear ${user.full_name},</p>
    //              <p>A new ${typeLabel.toLowerCase()} has been published for ${clientName}.</p>
    //              <blockquote style="border-left:3px solid #8B1A1A;padding-left:12px;color:#374151;">${preview}</blockquote>
    //              <p><a href="${process.env.NEXT_PUBLIC_FAMILY_PWA_URL || "https://omsorg-family-pwa.vercel.app"}">View full update →</a></p>
    //              <p style="color:#9CA3AF;font-size:12px;">Omsorg Elder Care · omsorg.co.in · +91 84483 81360</p>`
    //     }),
    //   })
    // );
    // await Promise.allSettled(emailPromises);

    return { notified: activeFamily.length };
  } catch (e) {
    console.error("Notification error:", e);
  }
}

export default async function handler(req, res) {
  if (req.method !== "PATCH") return res.status(405).end();

  // Only supervisor and admin can approve/publish
  const auth = await requireAuth(req, ["admin", "supervisor"]);
  if (auth.error) return res.status(auth.status).json({ error: auth.error });

  const { id, action, publishedUpdate } = req.body;
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
    supervisor_id:    auth.user.id,
    supervisor_name:  auth.user.full_name,
  };

  if (action === "approve" || action === "publish") {
    updatePayload.approved_at = new Date().toISOString();
  }
  if (action === "publish") {
    if (!publishedUpdate) return res.status(400).json({ error: "Published update text is required" });
    updatePayload.published_update = publishedUpdate;
    updatePayload.published_at = new Date().toISOString();
  }

  const { data: updatedRecord, error } = await supabase
    .from("updates")
    .update(updatePayload)
    .eq("id", id)
    .select("client_id, client_name, update_type, published_update")
    .single();

  if (error) { console.error(error); return res.status(500).json({ error: error.message }); }

  // Send family notification if publishing
  let notificationResult = null;
  if (action === "publish" && updatedRecord) {
    notificationResult = await notifyFamily(
      supabase,
      updatedRecord.client_id,
      updatedRecord.client_name,
      updatedRecord.update_type,
      publishedUpdate,
    );
  }

  return res.status(200).json({
    success: true,
    status: statusMap[action],
    notification: notificationResult,
  });
}
