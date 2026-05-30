const DEPOTS = ["Ahmedabad","Mehsana","Palanpur","Kutchh","Junagadh","Surendranagar","Rajkot","Jamnagar","Bharuch","Valsad","Surat","Gandhinagar","Dahod","Anand","Vadodara","Bhavnagar","Greater Mumbai","Thane","Dahanu"];
const CATS = ["Cement","Paints","PVC","Sanitary","Tiles","Waterproofing","Displays & Branding","Credit/Outstanding","New Product","Competition","Team Issue","Store Experience","Inventory","Influencer/Contractor","Others"];

export default async function handler(req, res) {
  // Allow CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { transcript } = req.body;
  if (!transcript?.trim()) return res.status(400).json({ error: "No transcript provided" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key not configured" });

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
        messages: [{
          role: "user",
          content: `You are a field visit assistant for UltraTech Building Solutions (UBS). Extract structured data from this spoken field visit note. Return ONLY valid JSON, no explanation, no markdown, no backticks.

Spoken note: "${transcript}"

Available depots: ${DEPOTS.join(", ")}
Available categories: ${CATS.join(", ")}

Return exactly this JSON structure:
{
  "dealerName": "extracted dealer or store name, or empty string",
  "depot": "closest matching depot from the list, or empty string",
  "notes": "clean summary of what was discussed",
  "categories": ["array of matching categories from the list"],
  "actions": [
    {
      "title": "short action title",
      "detail": "more detail if mentioned",
      "assignedToName": "person name mentioned for this action",
      "priority": "High or Medium or Low",
      "deadline": "YYYY-MM-DD if date mentioned, else empty string",
      "category": "best matching category from list"
    }
  ]
}`
        }]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Anthropic error:", err);
      return res.status(500).json({ error: "AI service error", detail: err });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || "{}";

    let parsed;
    try {
      parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    } catch {
      return res.status(500).json({ error: "Failed to parse AI response", raw: text });
    }

    return res.status(200).json(parsed);

  } catch (err) {
    console.error("Handler error:", err);
    return res.status(500).json({ error: err.message });
  }
}
