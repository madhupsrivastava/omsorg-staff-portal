export default async function handler(req, res) {
  if (req.method !== "PATCH") return res.status(405).end();

  const { recordId, checkout, exceptionReason, checkin } = req.body;
  if (!recordId) return res.status(400).json({ error: "Missing record ID" });

  const durationMins = Math.round((new Date(checkout.time) - new Date(checkin.time)) / 60000);

  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${encodeURIComponent(process.env.AIRTABLE_TABLE_NAME || "Check-ins")}/${recordId}`,
      {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${process.env.AIRTABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: {
            "Check-out Time":        checkout.time,
            "Check-out Latitude":    checkout.lat,
            "Check-out Longitude":   checkout.lng,
            "Check-out Accuracy (m)": checkout.accuracy,
            "Check-out Distance (m)": checkout.distance,
            "Check-out Within Zone": checkout.withinZone,
            "Exception Reason":      exceptionReason || "",
            "Duration (mins)":       durationMins,
            "Status":                "Completed",
            "Location Exception":    !checkin.withinZone || !checkout.withinZone,
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error("Airtable error:", err);
      return res.status(500).json({ error: "Failed to save check-out" });
    }

    return res.status(200).json({ success: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
