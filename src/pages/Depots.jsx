import { useApp } from "../context/AppContext";
import { useState } from "react";

function isOverdue(d) { return new Date(d) < new Date() && d; }

export default function Depots() {
  const { data } = useApp();
  const { depots, actions, visits, dealers } = data;
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const guj = ["Ahmedabad","Mehsana","Palanpur","Kutchh","Junagadh","Surendranagar","Rajkot","Jamnagar","Bharuch","Valsad","Surat","Gandhinagar","Dahod","Anand","Vadodara","Bhavnagar"];
  const mum = ["Greater Mumbai","Thane","Dahanu"];

  const depotStats = (depot) => {
    const da = actions.filter(a => a.depot === depot);
    const dv = visits.filter(v => dealers.find(d => d.id === v.dealerId)?.depot === depot);
    const dd = dealers.filter(d => d.depot === depot);
    const overdueCount = da.filter(a => isOverdue(a.deadline) && a.status !== "Closed").length;
    const closed = da.filter(a => a.status === "Closed").length;
    const closurePct = da.length ? Math.round((closed / da.length) * 100) : 100;
    return { open: da.filter(a => a.status !== "Closed").length, overdue: overdueCount, visits: dv.length, dealers: dd.length, closurePct, actions: da };
  };

  const filtered = depots.filter(d => d.toLowerCase().includes(search.toLowerCase()));
  const filtGuj = filtered.filter(d => guj.includes(d));
  const filtMum = filtered.filter(d => mum.includes(d));

  const DepotCard = ({ depot }) => {
    const s = depotStats(depot);
    const badge = s.overdue >= 2
      ? <span className="badge badge-red">⚠ {s.overdue} overdue</span>
      : s.overdue === 1
        ? <span className="badge badge-amber">1 overdue</span>
        : s.open > 5
          ? <span className="badge badge-blue">{s.open} open</span>
          : <span className="badge badge-green">On track</span>;
    return (
      <div className="depot-card" onClick={() => setSelected(selected === depot ? null : depot)}>
        <div className="depot-header">
          <span className="depot-name">{depot}</span>
          {badge}
        </div>
        <div className="depot-meta">
          {s.dealers} dealer{s.dealers !== 1 ? "s" : ""} · {s.open} open actions · {s.visits} visit{s.visits !== 1 ? "s" : ""}
        </div>
        <div className="progress-row">
          <div className="progress-bar"><div className="progress-fill" style={{ width: `${s.closurePct}%` }} /></div>
          <span className="progress-pct">{s.closurePct}%</span>
        </div>
        {selected === depot && s.actions.length > 0 && (
          <div style={{ marginTop: 12, borderTop: "1px solid var(--border)", paddingTop: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text3)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Open Actions</div>
            {s.actions.filter(a => a.status !== "Closed").slice(0, 4).map(a => (
              <div key={a.id} style={{ fontSize: 12, padding: "5px 0", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text)" }}>{a.title}</span>
                {isOverdue(a.deadline) && <span style={{ color: "var(--red)", fontSize: 10, fontWeight: 600 }}>OVERDUE</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="page">
      <div className="page-title">Depots</div>
      <div className="page-sub">{depots.length} depots · Gujarat + Mumbai</div>
      <div className="search-wrap">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input className="search-input" placeholder="Search depot…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      {filtGuj.length > 0 && <>
        <div className="section-label">Gujarat — {filtGuj.length} Depots</div>
        {filtGuj.map(d => <DepotCard key={d} depot={d} />)}
      </>}
      {filtMum.length > 0 && <>
        <div className="section-label">Mumbai Region — {filtMum.length} Depots</div>
        {filtMum.map(d => <DepotCard key={d} depot={d} />)}
      </>}
      {filtered.length === 0 && (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
          <p>No depots matching "{search}"</p>
        </div>
      )}
    </div>
  );
}
