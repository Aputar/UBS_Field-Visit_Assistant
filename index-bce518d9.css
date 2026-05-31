const DEPOTS = ["Ahmedabad","Mehsana","Palanpur","Kutchh","Junagadh","Surendranagar","Rajkot","Jamnagar","Bharuch","Valsad","Surat","Gandhinagar","Dahod","Anand","Vadodara","Bhavnagar","Greater Mumbai","Thane","Dahanu"];
const CATS = ["Cement","Paints","PVC","Sanitary","Tiles","Waterproofing","Displays & Branding","Credit/Outstanding","New Product","Competition","Team Issue","Store Experience","Inventory","Influencer/Contractor","Payment Issue","Others"];

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { transcript } = req.body || {};
  if (!transcript?.trim()) return res.status(400).json({ error: "No transcript provided" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY not set in Vercel environment variables" });

  const prompt = `You are a field visit assistant for UltraTech Building Solutions (UBS) in Gujarat, India.
Extract structured data from this spoken field visit note in English or Hindi/Hinglish.
Return ONLY a valid JSON object — no explanation, no markdown, no backticks.

Spoken note: "${transcript}"

Available depots (match closest): ${DEPOTS.join(", ")}
Available categories (match closest): ${CATS.join(", ")}

Rules:
- dealerName: extract the store/dealer name mentioned
- depot: match to the closest depot city from the list
- notes: clean summary of the discussion in 1-3 sentences
- categories: array of matching categories (can be multiple)
- actions: array of action items. For each action:
  - title: short action title (max 8 words)
  - detail: more detail if mentioned
  - assignedToName: person's name mentioned (TRH/RE name)
  - priority: "High", "Medium", or "Low" based on urgency words
  - deadline: YYYY-MM-DD if a date is mentioned, else ""
  - category: best matching category

JSON structure to return:
{
  "dealerName": "",
  "depot": "",
  "notes": "",
  "categories": [],
  "actions": [
    {
      "title": "",
      "detail": "",
      "assignedToName": "",
      "priority": "Medium",
      "deadline": "",
      "category": ""
    }
  ]
}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic API error:", response.status, errText);
      return res.status(502).json({ error: `Anthropic API error ${response.status}`, detail: errText });
    }

    const aiData = await response.json();
    const rawText = aiData.content?.[0]?.text || "{}";

    // Strip any accidental markdown
    const cleaned = rawText.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("JSON parse error:", parseErr, "Raw:", cleaned);
      // Return a best-effort empty structure so the app doesn't crash
      parsed = { dealerName: "", depot: "", notes: transcript, categories: [], actions: [] };
    }

    // Ensure all required fields exist
    parsed.dealerName = parsed.dealerName || "";
    parsed.depot = parsed.depot || "";
    parsed.notes = parsed.notes || "";
    parsed.categories = Array.isArray(parsed.categories) ? parsed.categories : [];
    parsed.actions = Array.isArray(parsed.actions) ? parsed.actions : [];

    return res.status(200).json(parsed);

  } catch (err) {
    console.error("Handler error:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}
