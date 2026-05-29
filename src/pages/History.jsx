import { useState } from "react";
import { useApp } from "../context/AppContext";

function isOverdue(d) { return new Date(d) < new Date() && d; }

export default function History() {
  const { data } = useApp();
  const { dealers, visits, actions } = data;
  const [selectedId, setSelectedId] = useState(dealers[0]?.id || "");
  const [search, setSearch] = useState("");

  const filteredDealers = dealers.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    (d.depot || "").toLowerCase().includes(search.toLowerCase())
  );

  const dealer = dealers.find(d => d.id === selectedId);
  const dealerVisits = visits.filter(v => v.dealerId === selectedId).sort((a, b) => new Date(b.date) - new Date(a.date));
  const dealerActions = actions.filter(a => a.dealerId === selectedId);
  const openActions = dealerActions.filter(a => a.status !== "Closed");
  const overdueActions = dealerActions.filter(a => isOverdue(a.deadline) && a.status !== "Closed");

  return (
    <div className="page">
      <div className="page-title">Dealer History</div>
      <div className="page-sub">Full visit & action timeline per dealer</div>

      <div className="search-wrap" style={{ marginBottom: 8 }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input className="search-input" placeholder="Search dealer or depot…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="form-group">
        <select className="form-select" value={selectedId} onChange={e => setSelectedId(e.target.value)}>
          <option value="">Select dealer…</option>
          {filteredDealers.map(d => (
            <option key={d.id} value={d.id}>{d.name} — {d.depot}</option>
          ))}
        </select>
      </div>

      {!dealer && (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          <p>Select a dealer to view their history</p>
        </div>
      )}

      {dealer && (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: "var(--navy)" }}>{dealer.name}</div>
            <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 4 }}>
              {dealer.depot} · Code: {dealer.code || "—"} · {dealer.city || ""}
            </div>
            {dealer.contact && <div style={{ fontSize: 12, color: "var(--text3)" }}>📞 {dealer.contact}</div>}
            {(dealer.trhName || dealer.reName) && (
              <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 4 }}>
                {dealer.trhName && `TRH: ${dealer.trhName}`} {dealer.reName && `· RE: ${dealer.reName}`}
              </div>
            )}
            <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
              <span className="badge badge-navy">{dealerVisits.length} Visit{dealerVisits.length !== 1 ? "s" : ""}</span>
              <span className="badge badge-blue">{openActions.length} Open</span>
              {overdueActions.length > 0 && <span className="badge badge-red">{overdueActions.length} Overdue</span>}
              <span className="badge badge-green">{dealerActions.filter(a => a.status === "Closed").length} Closed</span>
            </div>
          </div>

          {openActions.length > 0 && (
            <>
              <div className="section-label">Open / Pending Actions</div>
              {openActions.map(a => (
                <div key={a.id} className="action-card" style={{ marginBottom: 8, borderLeft: isOverdue(a.deadline) ? "3px solid var(--red)" : "3px solid var(--accent)" }}>
                  <div className="action-title">{a.title}</div>
                  <div className="action-meta">
                    <span>👤 {a.assignedTo || "—"}</span>
                    <span>🏷 {a.category}</span>
                    {a.deadline && <span className={isOverdue(a.deadline) ? "action-due overdue" : "action-due"}>
                      {isOverdue(a.deadline) ? "⚠ Overdue · " : "Due "}
                      {new Date(a.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </span>}
                  </div>
                  {a.detail && <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 6 }}>{a.detail}</div>}
                </div>
              ))}
            </>
          )}

          <div className="section-label">Visit Timeline</div>
          {dealerVisits.length === 0 && (
            <div className="empty-state" style={{ padding: "24px 0" }}>
              <p>No visits recorded yet for this dealer</p>
            </div>
          )}
          <div className="timeline">
            {dealerVisits.map((v, i) => {
              const va = actions.filter(a => a.visitId === v.id);
              return (
                <div key={v.id} className="tl-item">
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <div className="tl-dot" />
                    {i < dealerVisits.length - 1 && <div className="tl-line" />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="tl-date">{new Date(v.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>
                    <div className="tl-text">{v.notes || "Visit recorded (no notes)"}</div>
                    {v.categories?.length > 0 && (
                      <div className="tl-tags">
                        {v.categories.map(c => <span key={c} className="badge badge-blue">{c}</span>)}
                      </div>
                    )}
                    {va.length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        {va.map(a => (
                          <div key={a.id} style={{ fontSize: 11, color: "var(--text2)", padding: "3px 0", display: "flex", gap: 6, alignItems: "center" }}>
                            <span style={{ color: a.status === "Closed" ? "var(--green)" : "var(--amber)" }}>
                              {a.status === "Closed" ? "✓" : "→"}
                            </span>
                            {a.title}
                            <span className={`badge ${a.status === "Closed" ? "badge-green" : "badge-amber"}`} style={{ fontSize: 9 }}>{a.status}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
