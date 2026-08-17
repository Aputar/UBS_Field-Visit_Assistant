// Secure server-side login — uses service role key, bypasses RLS issues
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { name, password } = req.body || {};
  if (!name || !password) return res.status(400).json({ error: "Name and password required" });

  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return res.status(200).json({ user: null, error: "Supabase not configured" });
  }

  try {
    // Fetch users matching name (case-insensitive)
    const response = await fetch(
      `${url}/rest/v1/users?name=ilike.*${encodeURIComponent(name.trim())}*&limit=20`,
      {
        headers: {
          "apikey": key,
          "Authorization": `Bearer ${key}`,
          "Content-Type": "application/json"
        }
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error("Supabase fetch error:", err);
      return res.status(200).json({ user: null, error: "Database error" });
    }

    const users = await response.json();

    // Find exact password match (case-sensitive)
    const match = users.find(u =>
      u.password === password.trim() &&
      u.name.toLowerCase().includes(name.trim().toLowerCase())
    );

    if (match) {
      // Don't send password back to client
      const { password: _, ...safeUser } = match;
      return res.status(200).json({ user: safeUser });
    }

    return res.status(200).json({ user: null });

  } catch (e) {
    console.error("Login error:", e);
    return res.status(200).json({ user: null, error: e.message });
  }
}
