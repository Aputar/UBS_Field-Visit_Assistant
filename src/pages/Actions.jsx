import { useState } from "react";
import { useApp } from "../context/AppContext";
import * as db from "../lib/db";
import { useToast, Toast } from "../components/Toast";

function isOverdue(d) { return new Date(d) < new Date() && d; }

const CATS = ["All","Cement","Paints","PVC","Sanitary","Tiles","Waterproofing","Displays & Branding","Credit/Outstanding","New Product","Competition","Team Issue","Store Experience","Inventory","Influencer","Others"];

export default function Actions() {
  const { data, updateData, currentUser, reload, offline } = useApp();
  const { actions, dealers, users, trhs, res } = data;
  const { toast, showToast } = useToast();
  const [filter, setFilter] = useState("All");
  const [catFilter, setCatFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState(null);
  const [remarks, setRemarks] = useState({});

  const getName = (id) => {
    const u = users?.find(u => u.id === id);
    if (u) return u.name;
    const t = trhs?.find(t => t.id === id);
    if (t) return t.name;
    const r = res?.find(r => r.id === id);
    if (r) return r.name;
    return id || "—";
  };

  const getDealerName = (id) => dealers.find(d => d.id === id)?.name || "—";

  const myActions = currentUser.role === "ZRH"
    ? actions
    : actions.filter(a => a.assignedTo === currentUser.id || a.createdBy === currentUser.id);

  const filtered = myActions.filter(a => {
    const dueSoon = (d) => { if(!d) return false; const diff=(new Date(d)-new Date())/(1000*60*60*24); return diff>=0&&diff<=2; };
    const statusMatch = filter === "All"
      || (filter === "Open" && a.status === "Open")
      || (filter === "In Progress" && a.status === "In Progress")
      || (filter === "Closed" && a.status === "Closed")
      || (filter === "Overdue" && isOverdue(a.deadline) && a.status !== "Closed")
      || (filter === "Due Soon" && dueSoon(a.deadline) && !isOverdue(a.deadline) && a.status !== "Closed");
    const catMatch = catFilter === "All" || a.category === catFilter;
    const searchMatch = !search || a.title.toLowerCase().includes(search.toLowerCase()) || getDealerName(a.dealerId).toLowerCase().includes(search.toLowerCase()) || (a.depot || "").toLowerCase().includes(search.toLowerCase());
    return statusMatch && catMatch && searchMatch;
  });

  const updateStatus = async (id, status) => {
    try {
      if (!offline) {
        await db.updateAction(id, { status, remarks: remarks[id] || "" });
        await reload();
      } else {
        const updated = actions.map(a => a.id === id ? { ...a, status, remarks: remarks[id] || a.remarks } : a);
        updateData("actions", updated);
      }
      showToast(`Status updated to ${status}`);
    } catch(e) { showToast("Error: " + e.message); }
  };

  const deleteAction = async (id) => {
    try {
      if (!offline) { await db.deleteAction(id); await reload(); }
      else { updateData("actions", actions.filter(a => a.id !== id)); }
      showToast("Action deleted");
    } catch(e) { showToast("Error: " + e.message); }
  };

  const priorityColor = p => p === "High" ? "badge-red" : p === "Medium" ? "badge-amber" : "badge-blue";

  return (
    <div className="page">
      <div className="page-title">Action Board</div>
      <div className="page-sub">{filtered.length} of {myActions.length} actions shown</div>

      <div className="search-wrap">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input className="search-input" placeholder="Search actions, dealer, depot…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="filter-row">
        {[
          { label: "All", key: "All" },
          { label: "Open", key: "Open" },
          { label: "In Progress", key: "In Progress" },
          { label: `Overdue${myActions.filter(a=>a.status!=="Closed"&&isOverdue(a.deadline)).length>0?" ("+myActions.filter(a=>a.status!=="Closed"&&isOverdue(a.deadline)).length+")":""}`, key: "Overdue" },
          { label: "Due Soon", key: "Due Soon" },
          { label: "Closed", key: "Closed" },
        ].map(f => (
          <button key={f.key} className={`filter-pill${filter === f.key ? " active" : ""}`} onClick={() => setFilter(f.key)}>{f.label}</button>
        ))}
      </div>

      <div className="filter-row" style={{ marginBottom: 16 }}>
        {["All","Paints","PVC","Sanitary","Waterproofing","Displays & Branding","Credit/Outstanding"].map(c => (
          <button key={c} className={`filter-pill${catFilter === c ? " active" : ""}`} onClick={() => setCatFilter(c)}>{c}</button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
          <p>No actions matching your filters</p>
        </div>
      )}

      {filtered.map(a => (
        <div key={a.id} className="action-card" style={{ borderLeft: isOverdue(a.deadline) && a.status !== "Closed" ? "3px solid var(--red)" : "3px solid transparent" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
            <div className="action-title">{a.title}</div>
            <span className={`badge ${priorityColor(a.priority)}`}>{a.priority}</span>
          </div>
          <div className="action-meta">
            <span>📍 {a.depot || "—"}</span>
            <span>👤 {getName(a.assignedTo)}</span>
            <span>🏷 {a.category}</span>
          </div>
          {a.detail && <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 6, lineHeight: 1.5 }}>{a.detail}</div>}

          {editId === a.id && (
            <div style={{ marginTop: 8 }}>
              <input
                className="form-input"
                placeholder="Update remarks…"
                value={remarks[a.id] || a.remarks || ""}
                onChange={e => setRemarks(r => ({ ...r, [a.id]: e.target.value }))}
                style={{ fontSize: 12, padding: "6px 10px", marginBottom: 6 }}
              />
            </div>
          )}

          <div className="action-footer">
            <div>
              <div className={`action-due${isOverdue(a.deadline) && a.status !== "Closed" ? " overdue" : ""}`}>
                {isOverdue(a.deadline) && a.status !== "Closed" ? "⚠ Overdue · " : "Due "}
                {a.deadline ? new Date(a.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}
              </div>
              {a.remarks && <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 2 }}>💬 {a.remarks}</div>}
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <button className="btn-icon" title="Edit remarks" onClick={() => setEditId(editId === a.id ? null : a.id)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <select
                className="status-select"
                value={a.status}
                onChange={e => updateStatus(a.id, e.target.value)}
              >
                <option>Open</option>
                <option>In Progress</option>
                <option>Closed</option>
              </select>
            </div>
          </div>
        </div>
      ))}
      <Toast message={toast} />
    </div>
  );
}
