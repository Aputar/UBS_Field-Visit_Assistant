// Test endpoint to verify Supabase connection and users table
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return res.status(200).json({
      connected: false,
      error: "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in Vercel env vars",
      url_set: !!url,
      key_set: !!key
    });
  }

  try {
    const response = await fetch(`${url}/rest/v1/users?select=id,name,role&limit=20`, {
      headers: {
        "apikey": key,
        "Authorization": `Bearer ${key}`
      }
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(200).json({
        connected: false,
        error: `Supabase error ${response.status}: ${err}`,
        url_set: true,
        key_set: true
      });
    }

    const users = await response.json();
    return res.status(200).json({
      connected: true,
      user_count: users.length,
      users: users.map(u => ({ id: u.id, name: u.name, role: u.role }))
    });

  } catch (e) {
    return res.status(200).json({ connected: false, error: e.message });
  }
}
