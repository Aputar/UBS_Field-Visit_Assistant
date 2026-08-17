const DEPOTS = ["Ahmedabad","Mehsana","Palanpur","Kutchh","Junagadh","Surendranagar","Rajkot","Jamnagar","Bharuch","Valsad","Surat","Gandhinagar","Dahod","Anand","Vadodara","Bhavnagar","Greater Mumbai","Thane","Dahanu"];
const CATS = ["Cement","Paints","PVC","Sanitary","Tiles","Waterproofing","Displays & Branding","Credit/Outstanding","New Product","Competition","Team Issue","Store Experience","Inventory","Influencer/Contractor","Payment Issue","Others"];

function ruleBasedParse(transcript) {
  const text = transcript.toLowerCase();
  let depot = "";
  for (const d of DEPOTS) { if (text.includes(d.toLowerCase())) { depot = d; break; } }
  const categories = CATS.filter(c => text.includes(c.toLowerCase()));
  let priority = "Medium";
  if (text.includes("urgent")||text.includes("high priority")||text.includes("immediately")||text.includes("asap")||text.includes("critical")) priority = "High";
  if (text.includes("low priority")||text.includes("no rush")||text.includes("whenever")) priority = "Low";
  let deadline = "";
  const months = {jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12,january:1,february:2,march:3,april:4,june:6,july:7,august:8,september:9,october:10,november:11,december:12};
  const dateMatch = text.match(/(\d{1,2})(?:st|nd|rd|th)?\s+(jan\w*|feb\w*|mar\w*|apr\w*|may|jun\w*|jul\w*|aug\w*|sep\w*|oct\w*|nov\w*|dec\w*)/i);
  if (dateMatch) {
    const day = parseInt(dateMatch[1]);
    const mon = dateMatch[2].toLowerCase().slice(0,3);
    if (months[mon]) deadline = `${new Date().getFullYear()}-${String(months[mon]).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
  }
  let assignedToName = "";
  const assignMatch = transcript.match(/(?:assign(?:ed)? to|tell|ask|inform|give to|send to)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
  if (assignMatch) assignedToName = assignMatch[1];
  let dealerName = "";
  const dealerMatch = transcript.match(/(?:visit(?:ed)?|at|dealer|store|shop)\s+([A-Z][A-Za-z\s]+?)(?:\s+in|\s+at|\.|,|$)/i);
  if (dealerMatch) dealerName = dealerMatch[1].trim();
  return {
    dealerName, depot, notes: transcript,
    categories: categories.length > 0 ? categories : [],
    actions: [{ title: transcript.slice(0,60).trim(), detail: transcript, assignedToName, priority, deadline, category: categories[0]||"Others" }]
  };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { transcript } = req.body || {};
  if (!transcript?.trim()) return res.status(400).json({ error: "No transcript" });

  const nvidiaKey = process.env.NVIDIA_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  const prompt = `You are a field visit assistant for UltraTech Building Solutions India. Extract data from this spoken visit note. Return ONLY valid JSON, no markdown, no explanation.
Note: "${transcript}"
Available depots: ${DEPOTS.join(", ")}
Available categories: ${CATS.join(", ")}
Return this exact JSON structure:
{"dealerName":"","depot":"","notes":"","categories":[],"actions":[{"title":"","detail":"","assignedToName":"","priority":"Medium","deadline":"","category":""}]}`;

  // 1. Try Nvidia API
  if (nvidiaKey) {
    try {
      const r = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${nvidiaKey}` },
        body: JSON.stringify({
          model: process.env.NVIDIA_MODEL || "meta/llama-3.3-70b-instruct",
          messages: [
            { role: "system", content: "You are a JSON extraction assistant. Return only valid JSON. No markdown." },
            { role: "user", content: prompt }
          ],
          temperature: 0.1, top_p: 0.7, max_tokens: 1024, stream: false
        })
      });
      if (r.ok) {
        const d = await r.json();
        const raw = (d.choices?.[0]?.message?.content||"").replace(/```json|```/gi,"").trim();
        try {
          const p = JSON.parse(raw);
          p.notes = p.notes||transcript; p.categories = Array.isArray(p.categories)?p.categories:[];
          p.actions = Array.isArray(p.actions)?p.actions:[]; p._source="nvidia";
          console.log("Nvidia success");
          return res.status(200).json(p);
        } catch(e) {
          const m = raw.match(/\{[\s\S]*\}/);
          if (m) { const p=JSON.parse(m[0]); p._source="nvidia"; return res.status(200).json(p); }
        }
      } else {
        const errBody = await r.text().catch(()=>"");
        console.log("Nvidia failed:", r.status, errBody.slice(0,200));
      }
    } catch(e) { console.log("Nvidia error:", e.message); }
  }

  // 2. Try Anthropic as fallback
  if (anthropicKey) {
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": anthropicKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 1024, messages: [{ role: "user", content: prompt }] })
      });
      if (r.ok) {
        const d = await r.json();
        const raw = (d.content?.[0]?.text||"").replace(/```json|```/gi,"").trim();
        try { const p=JSON.parse(raw); p._source="anthropic"; console.log("Anthropic success"); return res.status(200).json(p); } catch(e){}
      }
    } catch(e) { console.log("Anthropic error:", e.message); }
  }

  // 3. Rule-based fallback — ALWAYS works, no API needed
  console.log("Using rule-based fallback");
  const fallback = ruleBasedParse(transcript);
  fallback._source = "rules";
  return res.status(200).json(fallback);
}
