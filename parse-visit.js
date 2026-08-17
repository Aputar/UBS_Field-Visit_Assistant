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

  // Support both Nvidia and Anthropic API keys
  const nvidiaKey = process.env.NVIDIA_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!nvidiaKey && !anthropicKey) {
    return res.status(500).json({ error: "No API key configured. Add NVIDIA_API_KEY or ANTHROPIC_API_KEY in Vercel environment variables." });
  }

  const prompt = `You are a field visit assistant for UltraTech Building Solutions (UBS) in Gujarat, India.
Extract structured data from this spoken field visit note in English or Hindi/Hinglish.
Return ONLY a valid JSON object — no explanation, no markdown, no backticks.

Spoken note: "${transcript}"

Available depots (match closest): ${DEPOTS.join(", ")}
Available categories (match closest): ${CATS.join(", ")}

Return exactly this JSON:
{
  "dealerName": "dealer or store name mentioned, or empty string",
  "depot": "closest matching depot from list, or empty string",
  "notes": "clean 1-3 sentence summary of discussion",
  "categories": ["matching categories from list"],
  "actions": [
    {
      "title": "short action title max 8 words",
      "detail": "more detail if mentioned",
      "assignedToName": "person name mentioned",
      "priority": "High or Medium or Low",
      "deadline": "YYYY-MM-DD if date mentioned else empty string",
      "category": "matching category"
    }
  ]
}`;

  try {
    let responseText = "";

    if (nvidiaKey) {
      // ── NVIDIA API ─────────────────────────────────────────
      const nvidiaModel = process.env.NVIDIA_MODEL || "meta/llama-3.3-70b-instruct";
      const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${nvidiaKey}`
        },
        body: JSON.stringify({
          model: nvidiaModel,
          messages: [
            { role: "system", content: "You are a field visit assistant for UltraTech Building Solutions India. Always respond with valid JSON only. No markdown, no explanation." },
            { role: "user", content: prompt }
          ],
          temperature: 0.2,
          top_p: 0.7,
          max_tokens: 1024,
          stream: false
        })
      });

      if (!response.ok) {
        const err = await response.text();
        console.error("Nvidia API error:", response.status, err);
        throw new Error(`Nvidia API error ${response.status}: ${err}`);
      }

      const data = await response.json();
      responseText = data.choices?.[0]?.message?.content || "{}";

    } else {
      // ── ANTHROPIC API (fallback) ────────────────────────────
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }]
        })
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Anthropic API error ${response.status}`);
      }

      const data = await response.json();
      responseText = data.content?.[0]?.text || "{}";
    }

    // Clean and parse JSON
    const cleaned = responseText
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/gi, "")
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      // Try to extract JSON from response
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        parsed = { dealerName: "", depot: "", notes: transcript, categories: [], actions: [] };
      }
    }

    // Ensure all fields exist
    parsed.dealerName = parsed.dealerName || "";
    parsed.depot = parsed.depot || "";
    parsed.notes = parsed.notes || "";
    parsed.categories = Array.isArray(parsed.categories) ? parsed.categories : [];
    parsed.actions = Array.isArray(parsed.actions) ? parsed.actions : [];

    return res.status(200).json(parsed);

  } catch (err) {
    console.error("Handler error:", err.message);
    return res.status(500).json({
      error: err.message,
      fallback: true,
      notes: transcript // return transcript so app can use it
    });
  }
}
