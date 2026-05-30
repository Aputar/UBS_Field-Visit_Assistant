import { useState } from "react";

export default function Login({ users, onLogin }) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    const trimmedName = name.trim().toLowerCase();
    const trimmedPass = password.trim();

    // Match: password must match exactly, name just needs to be contained
    const user = users.find(u =>
      u.password === trimmedPass &&
      u.name.toLowerCase().includes(trimmedName)
    );

    if (user) {
      onLogin(user);
    } else {
      setError("Invalid credentials. Check your name and password.");
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      justifyContent: "center", alignItems: "center",
      background: "#ffffff", padding: "32px 24px"
    }}>
      {/* UltraTech Building Solutions Logo */}
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <div style={{
          display: "inline-flex", borderRadius: 8, overflow: "hidden",
          boxShadow: "0 2px 12px rgba(0,0,0,0.12)"
        }}>
          <div style={{ background: "#FFD700", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: "'Arial Black', Arial, sans-serif", fontWeight: 900, fontSize: 22, color: "#000", fontStyle: "italic" }}>UltraTech</span>
          </div>
          <div style={{ background: "#111111", padding: "10px 14px", display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "center" }}>
            <span style={{ fontFamily: "'Arial Black', Arial, sans-serif", fontWeight: 900, fontSize: 14, color: "#FFD700", lineHeight: 1.2 }}>Building</span>
            <span style={{ fontFamily: "'Arial Black', Arial, sans-serif", fontWeight: 900, fontSize: 14, color: "#FFD700", lineHeight: 1.2 }}>Solutions</span>
          </div>
        </div>
        <div style={{ marginTop: 20, fontSize: 11, fontWeight: 600, color: "#0f2744", letterSpacing: 2, fontFamily: "monospace" }}>UBS FIELDOS</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: "#0f2744", marginTop: 4 }}>Field Execution OS</div>
        <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>Gujarat + Mumbai · West Region</div>
      </div>

      {/* Login Card */}
      <div style={{
        background: "#fff", borderRadius: 16, padding: 28,
        width: "100%", maxWidth: 360,
        border: "1px solid #e2e5ea",
        boxShadow: "0 4px 24px rgba(15,39,68,0.10)"
      }}>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#4b5563", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 5 }}>Your Name</label>
          <input
            style={{ width: "100%", padding: "11px 14px", borderRadius: 8, border: "1px solid #d0d4db", fontSize: 14, fontFamily: "inherit", color: "#111827", outline: "none", WebkitAppearance: "none" }}
            placeholder="e.g. Naveen Ahuja"
            value={name}
            autoCapitalize="words"
            autoCorrect="off"
            onChange={e => { setName(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#4b5563", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 5 }}>Password</label>
          <input
            style={{ width: "100%", padding: "11px 14px", borderRadius: 8, border: "1px solid #d0d4db", fontSize: 14, fontFamily: "inherit", color: "#111827", outline: "none", WebkitAppearance: "none" }}
            type="password"
            placeholder="Password"
            value={password}
            autoCapitalize="none"
            autoCorrect="off"
            onChange={e => { setPassword(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
          />
        </div>
        {error && <div style={{ color: "#d63230", fontSize: 12, marginBottom: 12, padding: "8px 10px", background: "#fdf0f0", borderRadius: 6 }}>{error}</div>}
        <button
          onClick={handleLogin}
          style={{
            width: "100%", padding: 13, background: "#0f2744", color: "#fff",
            border: "none", borderRadius: 8, fontSize: 15, fontWeight: 600,
            fontFamily: "inherit", cursor: "pointer"
          }}
        >Sign In →</button>

        <div style={{ marginTop: 16, padding: "12px 14px", background: "#f4f5f7", borderRadius: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#4b5563", marginBottom: 6 }}>DEMO LOGINS</div>
          {[
            { name: "Rajesh Mehta", pass: "admin123", role: "ZRH" },
            { name: "Vikram Shah", pass: "trh123", role: "TRH" },
            { name: "Priya Desai", pass: "re123", role: "RE" },
          ].map(u => (
            <div
              key={u.name}
              onClick={() => { setName(u.name); setPassword(u.pass); setError(""); }}
              style={{ fontSize: 12, color: "#0f2744", padding: "5px 0", cursor: "pointer", borderBottom: "1px solid #e2e5ea", display: "flex", justifyContent: "space-between" }}
            >
              <span>{u.name}</span>
              <span style={{ color: "#9ca3af" }}>{u.role} · {u.pass}</span>
            </div>
          ))}
          <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 6 }}>Tap any row to auto-fill</div>
        </div>
      </div>
    </div>
  );
}
