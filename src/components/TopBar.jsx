import { useState } from "react";
import ChangePassword from "./ChangePassword";

export default function TopBar({ user, onLogout }) {
  const [showCP, setShowCP] = useState(false);

  return (
    <>
      <div className="topbar">
        <div className="topbar-inner">
          <div>
            <div className="topbar-logo">UBS FieldOS</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
              {new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
            </div>
          </div>
          <div className="topbar-user">
            <div className="topbar-name">{user.name}</div>
            <div className="topbar-role">{user.role} · {user.region}</div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 3 }}>
              <span
                style={{ fontSize: 10, color: "#aac4e0", cursor: "pointer", textDecoration: "underline" }}
                onClick={() => setShowCP(true)}
              >Change password</span>
              <span className="topbar-logout" onClick={onLogout}>Sign out</span>
            </div>
          </div>
        </div>
      </div>
      {showCP && <ChangePassword onClose={() => setShowCP(false)} />}
    </>
  );
}
