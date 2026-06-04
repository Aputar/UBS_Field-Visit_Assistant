import { useState } from "react";

export default function Login({ onLogin, loginFn, supabaseOk }) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!name.trim()) return setError("Please enter your name.");
    if (!password.trim()) return setError("Please enter your password.");
    setLoading(true);
    setError("");
    try {
      const user = await loginFn(name, password);
      if (user) { onLogin(user); }
      else { setError("Name or password is incorrect. Please try again."); }
    } catch (e) {
      setError("Login failed. Please check your connection and try again.");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center", background:"#ffffff", padding:"32px 24px" }}>

      {/* UltraTech Logo */}
      <div style={{ marginBottom:32, textAlign:"center" }}>
        <div style={{ display:"inline-flex", borderRadius:8, overflow:"hidden", boxShadow:"0 2px 12px rgba(0,0,0,0.12)" }}>
          <div style={{ background:"#FFD700", padding:"14px 18px", display:"flex", alignItems:"center" }}>
            <span style={{ fontFamily:"'Arial Black',Arial,sans-serif", fontWeight:900, fontSize:22, color:"#000", fontStyle:"italic" }}>UltraTech</span>
          </div>
          <div style={{ background:"#111", padding:"10px 14px", display:"flex", flexDirection:"column", justifyContent:"center" }}>
            <span style={{ fontFamily:"'Arial Black',Arial,sans-serif", fontWeight:900, fontSize:14, color:"#FFD700", lineHeight:1.2 }}>Building</span>
            <span style={{ fontFamily:"'Arial Black',Arial,sans-serif", fontWeight:900, fontSize:14, color:"#FFD700", lineHeight:1.2 }}>Solutions</span>
          </div>
        </div>
        <div style={{ marginTop:20, fontSize:11, fontWeight:600, color:"#0f2744", letterSpacing:2, fontFamily:"monospace" }}>UBS FIELDOS</div>
        <div style={{ fontSize:22, fontWeight:700, color:"#0f2744", marginTop:4 }}>Field Execution OS</div>
        <div style={{ fontSize:12, color:"#9ca3af", marginTop:2 }}>Gujarat + Mumbai · West Region</div>
        {supabaseOk && (
          <div style={{ marginTop:8, fontSize:11, color:"#1a7a4a", background:"#edfaf3", padding:"4px 12px", borderRadius:99, display:"inline-block" }}>
            ✓ Connected — data syncs across all devices
          </div>
        )}
      </div>

      {/* Login Card */}
      <div style={{ background:"#fff", borderRadius:16, padding:28, width:"100%", maxWidth:360, border:"1px solid #e2e5ea", boxShadow:"0 4px 24px rgba(15,39,68,0.10)" }}>
        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:11, fontWeight:600, color:"#4b5563", textTransform:"uppercase", letterSpacing:0.5, display:"block", marginBottom:5 }}>Your Name</label>
          <input
            style={{ width:"100%", padding:"11px 14px", borderRadius:8, border:"1px solid #d0d4db", fontSize:14, fontFamily:"inherit", color:"#111827", outline:"none" }}
            placeholder="Enter your full name"
            value={name}
            autoCapitalize="words"
            autoCorrect="off"
            onChange={e => { setName(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
          />
        </div>
        <div style={{ marginBottom:16 }}>
          <label style={{ fontSize:11, fontWeight:600, color:"#4b5563", textTransform:"uppercase", letterSpacing:0.5, display:"block", marginBottom:5 }}>Password</label>
          <input
            style={{ width:"100%", padding:"11px 14px", borderRadius:8, border:"1px solid #d0d4db", fontSize:14, fontFamily:"inherit", color:"#111827", outline:"none" }}
            type="password"
            placeholder="Password"
            value={password}
            autoCapitalize="none"
            autoCorrect="off"
            onChange={e => { setPassword(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
          />
        </div>

        {error && (
          <div style={{ color:"#d63230", fontSize:13, marginBottom:12, padding:"9px 12px", background:"#fdf0f0", borderRadius:8, lineHeight:1.5 }}>
            ⚠ {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{ width:"100%", padding:13, background: loading ? "#9ca3af" : "#0f2744", color:"#fff", border:"none", borderRadius:8, fontSize:15, fontWeight:600, fontFamily:"inherit", cursor: loading ? "not-allowed" : "pointer" }}
        >
          {loading ? "Signing in…" : "Sign In →"}
        </button>

        <div style={{ marginTop:14, fontSize:11, color:"#9ca3af", textAlign:"center", lineHeight:1.6 }}>
          Contact your admin if you forgot your password
        </div>
      </div>
    </div>
  );
}
