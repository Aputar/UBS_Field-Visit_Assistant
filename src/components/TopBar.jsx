import { useState } from "react";
import ChangePassword from "./ChangePassword";
import OverdueNotifications from "./OverdueNotifications";

export default function TopBar({ user, onLogout, setTab }) {
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

          <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
            {/* Notification Bell */}
            <div style={{ marginTop: 4 }}>
              <OverdueNotifications onViewAction={() => setTab && setTab("actions")} />
            </div>

            {/* User info */}
            <div className="topbar-user">
              <div className="topbar-name">{user.name}</div>
              <div className="topbar-role">{user.role} · {user.region}</div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 3 }}>
                <span
                  style={{ fontSize: 10, color: "#aac4e0", cursor: "pointer", textDecoration: "underline" }}
                  onClick={() => setShowCP(true)}
                >Change pwd</span>
                <span className="topbar-logout" onClick={onLogout}>Sign out</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      {showCP && <ChangePassword onClose={() => setShowCP(false)} />}
    </>
  );
}
