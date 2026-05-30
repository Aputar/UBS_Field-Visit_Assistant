import { useState } from "react";

export default function Login({ users, onLogin }) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    const user = users.find(u => u.password === password && u.name.toLowerCase().includes(name.toLowerCase()));
    if (user) { onLogin(user); }
    else { setError("Invalid credentials. Please check your name and password."); }
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
          {/* Yellow panel - UltraTech */}
          <div style={{
            background: "#FFD700", padding: "14px 18px",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <span style={{
              fontFamily: "'Arial Black', Arial, sans-serif",
              fontWeight: 900, fontSize: 22, color: "#000",
              fontStyle: "italic", letterSpacing: "-0.5px"
            }}>UltraTech</span>
          </div>
          {/* Black panel - Building Solutions */}
          <div style={{
            background: "#111111", padding: "10px 14px",
            display: "flex", flexDirection: "column",
            alignItems: "flex-start", justifyContent: "center"
          }}>
            <span style={{
              fontFamily: "'Arial Black', Arial, sans-serif",
              fontWeight: 900, fontSize: 14, color: "#FFD700",
              lineHeight: 1.2, letterSpacing: "0.5px"
            }}>Building</span>
            <span style={{
              fontFamily: "'Arial Black', Arial, sans-serif",
              fontWeight: 900, fontSize: 14, color: "#FFD700",
              lineHeight: 1.2, letterSpacing: "0.5px"
            }}>Solutions</span>
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
            style={{ width: "100%", padding: "11px 14px", borderRadius: 8, border: "1px solid #d0d4db", fontSize: 14, fontFamily: "inherit", color: "#111827", outline: "none" }}
            placeholder="e.g. Naveen Ahuja"
            value={name}
            onChange={e => { setName(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#4b5563", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 5 }}>Password</label>
          <input
            style={{ width: "100%", padding: "11px 14px", borderRadius: 8, border: "1px solid #d0d4db", fontSize: 14, fontFamily: "inherit", color: "#111827", outline: "none" }}
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
          />
        </div>
        {error && <div style={{ color: "#d63230", fontSize: 12, marginBottom: 12 }}>{error}</div>}
        <button
          onClick={handleLogin}
          style={{
            width: "100%", padding: 13, background: "#0f2744", color: "#fff",
            border: "none", borderRadius: 8, fontSize: 15, fontWeight: 600,
            fontFamily: "inherit", cursor: "pointer"
          }}
        >Sign In →</button>
        <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 14, textAlign: "center", lineHeight: 1.6 }}>
          Demo: "Rajesh Mehta" / admin123 · "Vikram Shah" / trh123
        </div>
      </div>
    </div>
  );
}
