export default function TopBar({ user, onLogout }) {
  return (
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
          <div className="topbar-logout" onClick={onLogout}>Sign out</div>
        </div>
      </div>
    </div>
  );
}
