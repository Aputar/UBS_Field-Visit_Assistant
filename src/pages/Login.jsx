import { useState } from "react";

export default function Login({ users, onLogin }) {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    const user = users.find(u => u.password === password && (u.name.toLowerCase().includes(phone.toLowerCase()) || phone === u.id));
    if (user) { onLogin(user); }
    else { setError("Invalid credentials. Try name + password."); }
  };

  return (
    <div className="login-screen">
      <div className="login-logo">UBS FIELDOS</div>
      <div className="login-title">Field Execution OS</div>
      <div className="login-sub">Gujarat + Mumbai · West Region</div>
      <div className="login-card">
        <div className="form-group">
          <label className="form-label">Your Name</label>
          <input className="form-input" placeholder="e.g. Rajesh Mehta" value={phone} onChange={e => { setPhone(e.target.value); setError(""); }} />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <input className="form-input" type="password" placeholder="Password" value={password} onChange={e => { setPassword(e.target.value); setError(""); }} onKeyDown={e => e.key === "Enter" && handleLogin()} />
        </div>
        {error && <div style={{ color: "#d63230", fontSize: 12, marginBottom: 12 }}>{error}</div>}
        <button className="btn-primary" onClick={handleLogin}>Sign In →</button>
        <div className="login-hint">Demo: "Rajesh Mehta" / admin123 · "Vikram Shah" / trh123 · "Priya Desai" / re123</div>
      </div>
    </div>
  );
}
