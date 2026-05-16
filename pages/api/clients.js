export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Clients?filterByFormula={Active}=1&sort[0][field]=Name&sort[0][direction]=asc`,
      {
        headers: {
          "Authorization": `Bearer ${process.env.AIRTABLE_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error("Airtable error:", err);
      return res.status(500).json({ error: "Failed to fetch clients" });
    }

    const data = await response.json();

    const clients = data.records.map(record => ({
      id: record.id,
      name: record.fields["Name"] || "",
      address: record.fields["Address"] || "",
      lat: parseFloat(record.fields["Latitude"]) || 0,
      lng: parseFloat(record.fields["Longitude"]) || 0,
      radius: parseInt(record.fields["Radius (m)"]) || 200,
    })).filter(c => c.name && c.lat && c.lng);

    // Cache for 5 minutes
    res.setHeader("Cache-Control", "s-maxage=300");
    return res.status(200).json({ clients });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
