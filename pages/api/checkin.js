export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { staffName, clientName, clientId, time, lat, lng, accuracy, distance, withinZone } = req.body;

  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${encodeURIComponent(process.env.AIRTABLE_TABLE_NAME || "Check-ins")}`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.AIRTABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: {
            "Staff Name":           staffName,
            "Client":               clientName,
            "Client ID":            clientId,
            "Check-in Time":        time,
            "Check-in Latitude":    lat,
            "Check-in Longitude":   lng,
            "Check-in Accuracy (m)": accuracy,
            "Check-in Distance (m)": distance,
            "Check-in Within Zone": withinZone,
            "Status":               "Checked In",
            "Date":                 time.split("T")[0],
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error("Airtable error:", err);
      return res.status(500).json({ error: "Failed to save check-in" });
    }

    const data = await response.json();
    return res.status(200).json({ id: data.id });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
