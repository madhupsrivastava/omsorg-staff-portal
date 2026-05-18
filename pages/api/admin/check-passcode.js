export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { passcode } = req.body || {};
  if (!passcode) return res.status(400).json({ error: "Missing passcode" });
  if (passcode !== process.env.ADMIN_PASSCODE) {
    return res.status(401).json({ error: "Incorrect passcode" });
  }
  return res.status(200).json({ ok: true });
}
