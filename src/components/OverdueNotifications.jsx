import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";

function isOverdue(deadline) {
  return deadline && new Date(deadline) < new Date();
}

function isDueSoon(deadline) {
  if (!deadline) return false;
  const d = new Date(deadline);
  const now = new Date();
  const diff = (d - now) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= 2; // due within 2 days
}

export default function OverdueNotifications({ onViewAction }) {
  const { data, currentUser } = useApp();
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try { return JSON.parse(localStorage.getItem("ubs_dismissed_notifs") || "[]"); } catch { return []; }
  });

  const myActions = ["FH","ZRH"].includes(currentUser.role)
    ? (data.actions || [])
    : (data.actions || []).filter(a =>
        a.assigned_to === currentUser.name ||
        a.assignedTo === currentUser.name ||
        a.assignedToName === currentUser.name
      );

  const overdue = myActions.filter(a => a.status !== "Closed" && isOverdue(a.deadline) && !dismissed.includes(a.id));
  const dueSoon = myActions.filter(a => a.status !== "Closed" && isDueSoon(a.deadline) && !isOverdue(a.deadline) && !dismissed.includes(a.id));
  const total = overdue.length + dueSoon.length;

  // Browser push notification on load
  useEffect(() => {
    if (overdue.length === 0) return;
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") {
      new Notification("UBS FieldOS — Overdue Actions", {
        body: `${overdue.length} action${overdue.length > 1 ? "s are" : " is"} overdue. Tap to review.`,
        icon: "/manifest.json"
      });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then(p => {
        if (p === "granted" && overdue.length > 0) {
          new Notification("UBS FieldOS — Overdue Actions", {
            body: `${overdue.length} action${overdue.length > 1 ? "s are" : " is"} overdue.`,
          });
        }
      });
    }
  }, [overdue.length]);

  const dismiss = (id) => {
    const updated = [...dismissed, id];
    setDismissed(updated);
    localStorage.setItem("ubs_dismissed_notifs", JSON.stringify(updated));
  };

  const dismissAll = () => {
    const ids = [...overdue, ...dueSoon].map(a => a.id);
    const updated = [...dismissed, ...ids];
    setDismissed(updated);
    localStorage.setItem("ubs_dismissed_notifs", JSON.stringify(updated));
    setOpen(false);
  };

  if (total === 0) return null;

  return (
    <>
      {/* Bell icon in topbar — shown from TopBar */}
      <div
        onClick={() => setOpen(true)}
        style={{
          position: "relative", cursor: "pointer",
          display: "flex", alignItems: "center"
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 01-3.46 0"/>
        </svg>
        <div style={{
          position: "absolute", top: -6, right: -6,
          width: 18, height: 18, borderRadius: "50%",
          background: "#d63230", color: "#fff",
          fontSize: 10, fontWeight: 700,
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>{total}</div>
      </div>

      {/* Notification panel */}
      {open && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setOpen(false)}>
          <div className="modal-sheet" style={{ maxHeight: "80vh", overflowY: "auto" }}>
            <div className="modal-handle" />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div className="modal-title" style={{ margin: 0 }}>🔔 Notifications</div>
              <button
                onClick={dismissAll}
                style={{ fontSize: 12, color: "var(--text3)", background: "none", border: "none", cursor: "pointer" }}
              >Clear all</button>
            </div>

            {overdue.length > 0 && (
              <>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--red)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
                  ⚠ Overdue — {overdue.length} action{overdue.length > 1 ? "s" : ""}
                </div>
                {overdue.map(a => (
                  <div key={a.id} style={{
                    background: "#fdf0f0", border: "1px solid #f5c6c6",
                    borderRadius: 10, padding: "10px 12px", marginBottom: 8,
                    display: "flex", justifyContent: "space-between", alignItems: "flex-start"
                  }}>
                    <div style={{ flex: 1 }} onClick={() => { onViewAction && onViewAction(); setOpen(false); }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--red)" }}>{a.title}</div>
                      <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 3 }}>
                        {a.depot || "—"} · {a.assigned_to || a.assignedTo || "—"} · Due {a.deadline ? new Date(a.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}
                      </div>
                      <span className="badge badge-red" style={{ marginTop: 4 }}>{a.priority} Priority</span>
                    </div>
                    <button onClick={() => dismiss(a.id)}
                      style={{ fontSize: 16, color: "var(--text3)", background: "none", border: "none", cursor: "pointer", marginLeft: 8, lineHeight: 1 }}>✕</button>
                  </div>
                ))}
              </>
            )}

            {dueSoon.length > 0 && (
              <>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--amber)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8, marginTop: 12 }}>
                  🕐 Due Soon (within 2 days) — {dueSoon.length} action{dueSoon.length > 1 ? "s" : ""}
                </div>
                {dueSoon.map(a => (
                  <div key={a.id} style={{
                    background: "var(--amber-bg)", border: "1px solid #ffd580",
                    borderRadius: 10, padding: "10px 12px", marginBottom: 8,
                    display: "flex", justifyContent: "space-between", alignItems: "flex-start"
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--amber)" }}>{a.title}</div>
                      <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 3 }}>
                        {a.depot || "—"} · {a.assigned_to || a.assignedTo || "—"} · Due {a.deadline ? new Date(a.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}
                      </div>
                      <span className="badge badge-amber" style={{ marginTop: 4 }}>{a.priority} Priority</span>
                    </div>
                    <button onClick={() => dismiss(a.id)}
                      style={{ fontSize: 16, color: "var(--text3)", background: "none", border: "none", cursor: "pointer", marginLeft: 8, lineHeight: 1 }}>✕</button>
                  </div>
                ))}
              </>
            )}

            <button className="btn-primary" style={{ marginTop: 8 }} onClick={() => setOpen(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
