export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { inputs, parameters } = req.body;
  if (!inputs) return res.status(400).json({ error: "Missing inputs" });

  const HF_TOKEN = process.env.HF_TOKEN;
  const CFM_ENDPOINT = "https://nng2sj7h3gew0pfq.us-east4.gcp.endpoints.huggingface.cloud";

  try {
    const response = await fetch(CFM_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${HF_TOKEN}`,
      },
      body: JSON.stringify({ inputs, parameters }),
    });

    if (!response.ok) {
      const error = await response.text();
      return res.status(response.status).json({ error });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    console.error("CFM proxy error:", err);
    return res.status(503).json({ error: "CFM endpoint unreachable" });
  }
}
