import { useApp } from "../context/AppContext";
import { useState } from "react";

function isOverdue(deadline) {
  return new Date(deadline) < new Date() && deadline;
}

export default function Dashboard({ setTab }) {
  const { data, currentUser } = useApp();
  const { actions, visits, dealers, depots, trhs } = data;

  const myActions = ["FH","ZRH"].includes(currentUser.role)
    ? actions
    : actions.filter(a => a.assignedTo === currentUser.id);

  const open = myActions.filter(a => a.status !== "Closed").length;
  const overdue = myActions.filter(a => a.status !== "Closed" && isOverdue(a.deadline)).length;
  const dueSoon = myActions.filter(a => {
    if (!a.deadline || a.status === "Closed" || isOverdue(a.deadline)) return false;
    const diff = (new Date(a.deadline) - new Date()) / (1000*60*60*24);
    return diff >= 0 && diff <= 2;
  }).length;
  const closed = myActions.filter(a => a.status === "Closed").length;
  const total = myActions.length;
  const closureRate = total ? Math.round((closed / total) * 100) : 0;
  const thisMonthVisits = visits.filter(v => {
    const d = new Date(v.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  // TRH closure rates
  const trhStats = trhs.map(t => {
    const ta = actions.filter(a => a.assignedTo === t.id);
    const tc = ta.filter(a => a.status === "Closed").length;
    return { name: t.name.split(" ")[0], pct: ta.length ? Math.round((tc / ta.length) * 100) : 0 };
  }).sort((a, b) => b.pct - a.pct);

  // Category breakdown
  const catMap = {};
  actions.forEach(a => { catMap[a.category] = (catMap[a.category] || 0) + 1; });
  const catData = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxCat = Math.max(...catData.map(c => c[1]), 1);

  // Depot overdue
  const depotOverdue = depots.filter(d => actions.some(a => a.depot === d && isOverdue(a.deadline) && a.status !== "Closed"));

  return (
    <div className="page">
      {overdue > 0 && (
        <div className="alert alert-warn">
          <span>⚠</span>
          <span><b>{overdue} action{overdue > 1 ? "s" : ""} overdue</b> — {depotOverdue.slice(0, 3).join(", ")} need attention</span>
        </div>
      )}
      {dueSoon > 0 && (
        <div className="alert" style={{ background: "var(--amber-bg)", border: "1px solid #ffd580", color: "#7c4f00", marginBottom: 12 }}>
          <span>🕐</span>
          <span><b>{dueSoon} action{dueSoon > 1 ? "s" : ""} due within 2 days</b> — review and follow up</span>
        </div>
      )}

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-val">{open}</div>
          <div className="metric-label">Open Actions</div>
          <div className={`metric-change ${overdue > 0 ? "dn" : "up"}`}>{overdue} overdue</div>
        </div>
        <div className="metric-card">
          <div className="metric-val">{closureRate}%</div>
          <div className="metric-label">Closure Rate</div>
          <div className={`metric-change ${closureRate >= 80 ? "up" : "dn"}`}>{closed} of {total} closed</div>
        </div>
        <div className="metric-card">
          <div className="metric-val">{thisMonthVisits}</div>
          <div className="metric-label">Visits This Month</div>
          <div className="metric-change up">+{thisMonthVisits} recorded</div>
        </div>
        <div className="metric-card">
          <div className="metric-val">{dealers.length}</div>
          <div className="metric-label">Active Dealers</div>
          <div className="metric-change up">across {depots.length} depots</div>
        </div>
      </div>

      {currentUser.role === "ZRH" && trhStats.length > 0 && (
        <>
          <div className="section-label">TRH Closure Rate</div>
          <div className="card">
            {trhStats.map(t => (
              <div key={t.name} className="bar-row">
                <span className="bar-label">{t.name}</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${t.pct || 0}%` }}>
                    <span>{t.pct}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {catData.length > 0 && (
        <>
          <div className="section-label">Actions by Category</div>
          <div className="card">
            {catData.map(([cat, n]) => (
              <div key={cat} className="bar-row">
                <span className="bar-label">{cat}</span>
                <div className="bar-track">
                  <div className="bar-fill accent" style={{ width: `${Math.round((n / maxCat) * 100)}%` }}>
                    <span className="dark">{n}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="section-label">Recent Overdue</div>
      {actions.filter(a => isOverdue(a.deadline) && a.status !== "Closed").slice(0, 3).map(a => (
        <div key={a.id} className="card" style={{ marginBottom: 8, borderLeft: "3px solid #d63230" }}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>{a.title}</div>
          <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 3 }}>
            {a.depot} · {a.category} · Due {new Date(a.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
          </div>
          <div style={{ fontSize: 11, color: "var(--red)", marginTop: 4, fontWeight: 600 }}>⚠ Overdue</div>
        </div>
      ))}
      {actions.filter(a => isOverdue(a.deadline) && a.status !== "Closed").length === 0 && (
        <div className="card" style={{ textAlign: "center", color: "var(--green)", fontSize: 13 }}>✓ No overdue actions</div>
      )}

      <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
        <button className="btn-primary" style={{ flex: 1 }} onClick={() => setTab("visit")}>+ New Visit</button>
        <button className="btn-secondary" onClick={() => setTab("actions")}>View All Actions</button>
      </div>
    </div>
  );
}
