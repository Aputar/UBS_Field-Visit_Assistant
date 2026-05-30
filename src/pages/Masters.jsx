import { useState } from "react";
import { useApp } from "../context/AppContext";
import { useToast, Toast } from "../components/Toast";

const DEPOTS = ["Ahmedabad","Mehsana","Palanpur","Kutchh","Junagadh","Surendranagar","Rajkot","Jamnagar","Bharuch","Valsad","Surat","Gandhinagar","Dahod","Anand","Vadodara","Bhavnagar","Greater Mumbai","Thane","Dahanu"];
const DEFAULT_CATS = ["Cement","Paints","PVC","Sanitary","Tiles","Waterproofing","Displays & Branding","Credit/Outstanding","New Product","Competition","Team Issue","Store Experience","Inventory","Influencer/Contractor","Payment Issue","Others"];

function uid() { return "id_" + Math.random().toString(36).slice(2, 10); }

export default function Masters() {
  const { data, updateData, currentUser } = useApp();
  const { toast, showToast } = useToast();
  const [tab, setTab] = useState("dealers");
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({});
  const [newCat, setNewCat] = useState("");

  const categories = data.categories || DEFAULT_CATS;
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const canEdit = currentUser.role === "ZRH" || currentUser.role === "TRH";

  const addCategory = () => {
    const trimmed = newCat.trim();
    if (!trimmed) return showToast("Enter a category name");
    if (categories.map(c=>c.toLowerCase()).includes(trimmed.toLowerCase())) return showToast("Category already exists");
    updateData("categories", [...categories, trimmed]);
    setNewCat("");
    showToast("✓ Category added");
  };

  const deleteCategory = (cat) => {
    if (DEFAULT_CATS.includes(cat)) return showToast("Default categories cannot be deleted");
    updateData("categories", categories.filter(c => c !== cat));
    showToast("Category removed");
  };

  const saveDealer = () => {
    if (!form.name) return showToast("Dealer name required");
    const d = { id: uid(), name: form.name, code: form.code || "", depot: form.depot || "", city: form.city || "", contact: form.contact || "", trhName: form.trhName || "", reName: form.reName || "" };
    updateData("dealers", [...data.dealers, d]);
    setForm({}); setShowForm(false); showToast("✓ Dealer added");
  };

  const saveTRH = () => {
    if (!form.name) return showToast("TRH name required");
    const t = { id: uid(), name: form.name, phone: form.phone || "", region: form.region || "", depots: [] };
    updateData("trhs", [...data.trhs, t]);
    setForm({}); setShowForm(false); showToast("✓ TRH added");
  };

  const saveRE = () => {
    if (!form.name) return showToast("RE name required");
    const r = { id: uid(), name: form.name, phone: form.phone || "", depot: form.depot || "" };
    updateData("res", [...data.res, r]);
    setForm({}); setShowForm(false); showToast("✓ RE added");
  };

  const saveUser = () => {
    if (!form.name || !form.password) return showToast("Name and password required");
    const u = { id: uid(), name: form.name, role: form.role || "TRH", region: form.region || "", password: form.password };
    updateData("users", [...data.users, u]);
    setForm({}); setShowForm(false); showToast("✓ User added");
  };

  const deleteItem = (key, id) => {
    updateData(key, data[key].filter(x => x.id !== id));
    showToast("Deleted");
  };

  const filterBy = (arr, keys) => arr.filter(x =>
    !search || keys.some(k => (x[k] || "").toLowerCase().includes(search.toLowerCase()))
  );

  const TABS = ["dealers","trhs","res","users","categories"];
  const TAB_LABELS = { dealers: "Dealers", trhs: "TRH", res: "RE", users: "Users", categories: "Categories" };

  return (
    <div className="page">
      <div className="page-title">Masters</div>
      <div className="page-sub">Manage dealers, TRH, RE, users & categories</div>

      <div className="master-tabs">
        {TABS.map(t => (
          <button key={t} className={`master-tab${tab === t ? " active" : ""}`}
            onClick={() => { setTab(t); setShowForm(false); setForm({}); setSearch(""); }}>
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Search — not for categories */}
      {tab !== "categories" && (
        <div className="search-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input className="search-input" placeholder={`Search ${TAB_LABELS[tab]}…`} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      )}

      {/* Add buttons */}
      {canEdit && tab !== "categories" && (
        <button className="btn-secondary" style={{ width: "100%", marginBottom: 14 }}
          onClick={() => { setShowForm(!showForm); setForm({}); }}>
          {showForm ? "✕ Cancel" : `+ Add ${TAB_LABELS[tab].slice(0,-1) || TAB_LABELS[tab]}`}
        </button>
      )}

      {/* ── CATEGORIES TAB ── */}
      {tab === "categories" && (
        <>
          <div className="alert alert-info" style={{ marginBottom: 14 }}>
            <span>ℹ</span>
            <span>Add custom discussion categories here. They'll appear in <b>New Visit</b> automatically.</span>
          </div>

          {canEdit && (
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <input
                className="form-input"
                placeholder="New category name… e.g. Adhesive"
                value={newCat}
                onChange={e => setNewCat(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addCategory()}
                style={{ flex: 1 }}
              />
              <button className="btn-primary" style={{ width: "auto", padding: "10px 18px" }} onClick={addCategory}>
                + Add
              </button>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {categories.map(cat => {
              const isDefault = DEFAULT_CATS.includes(cat);
              return (
                <div key={cat} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  background: "var(--surface)", border: "1px solid var(--border)",
                  borderRadius: 10, padding: "10px 14px"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14, color: "var(--text)" }}>{cat}</span>
                    {isDefault && <span className="badge badge-blue" style={{ fontSize: 9 }}>Default</span>}
                  </div>
                  {canEdit && !isDefault && (
                    <button className="btn-danger" onClick={() => deleteCategory(cat)}>Remove</button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── ADD FORMS ── */}
      {showForm && tab === "dealers" && (
        <div className="card" style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 600, marginBottom: 12, color: "var(--navy)" }}>New Dealer</div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Name *</label><input className="form-input" value={form.name||""} onChange={e=>set("name",e.target.value)}/></div>
            <div className="form-group"><label className="form-label">Code</label><input className="form-input" placeholder="GJ-001" value={form.code||""} onChange={e=>set("code",e.target.value)}/></div>
          </div>
          <div className="form-group"><label className="form-label">Depot</label>
            <select className="form-select" value={form.depot||""} onChange={e=>set("depot",e.target.value)}>
              <option value="">Select…</option>{DEPOTS.map(d=><option key={d}>{d}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">City</label><input className="form-input" value={form.city||""} onChange={e=>set("city",e.target.value)}/></div>
            <div className="form-group"><label className="form-label">Contact</label><input className="form-input" value={form.contact||""} onChange={e=>set("contact",e.target.value)}/></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">TRH Name</label><input className="form-input" value={form.trhName||""} onChange={e=>set("trhName",e.target.value)}/></div>
            <div className="form-group"><label className="form-label">RE Name</label><input className="form-input" value={form.reName||""} onChange={e=>set("reName",e.target.value)}/></div>
          </div>
          <button className="btn-primary" onClick={saveDealer}>Save Dealer</button>
        </div>
      )}

      {showForm && tab === "trhs" && (
        <div className="card" style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 600, marginBottom: 12, color: "var(--navy)" }}>New TRH</div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Name *</label><input className="form-input" value={form.name||""} onChange={e=>set("name",e.target.value)}/></div>
            <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={form.phone||""} onChange={e=>set("phone",e.target.value)}/></div>
          </div>
          <div className="form-group"><label className="form-label">Region</label><input className="form-input" placeholder="e.g. Gujarat North" value={form.region||""} onChange={e=>set("region",e.target.value)}/></div>
          <button className="btn-primary" onClick={saveTRH}>Save TRH</button>
        </div>
      )}

      {showForm && tab === "res" && (
        <div className="card" style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 600, marginBottom: 12, color: "var(--navy)" }}>New RE</div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Name *</label><input className="form-input" value={form.name||""} onChange={e=>set("name",e.target.value)}/></div>
            <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={form.phone||""} onChange={e=>set("phone",e.target.value)}/></div>
          </div>
          <div className="form-group"><label className="form-label">Depot</label>
            <select className="form-select" value={form.depot||""} onChange={e=>set("depot",e.target.value)}>
              <option value="">Select…</option>{DEPOTS.map(d=><option key={d}>{d}</option>)}
            </select>
          </div>
          <button className="btn-primary" onClick={saveRE}>Save RE</button>
        </div>
      )}

      {showForm && tab === "users" && (
        <div className="card" style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 600, marginBottom: 12, color: "var(--navy)" }}>New User</div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Full Name *</label><input className="form-input" value={form.name||""} onChange={e=>set("name",e.target.value)}/></div>
            <div className="form-group"><label className="form-label">Password *</label><input className="form-input" type="password" value={form.password||""} onChange={e=>set("password",e.target.value)}/></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Role</label>
              <select className="form-select" value={form.role||"TRH"} onChange={e=>set("role",e.target.value)}>
                <option>ZRH</option><option>TRH</option><option>RE</option><option>TSH</option>
              </select>
            </div>
            <div className="form-group"><label className="form-label">Region</label><input className="form-input" placeholder="Region / Depot" value={form.region||""} onChange={e=>set("region",e.target.value)}/></div>
          </div>
          <button className="btn-primary" onClick={saveUser}>Save User</button>
        </div>
      )}

      {/* ── LISTS ── */}
      {tab === "dealers" && filterBy(data.dealers, ["name","depot","city","code"]).map(d => (
        <div key={d.id} className="card" style={{ marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--navy)" }}>{d.name}</div>
              <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 3 }}>
                {d.depot}{d.code ? ` · ${d.code}` : ""}{d.city ? ` · ${d.city}` : ""}
              </div>
              {d.contact && <div style={{ fontSize: 11, color: "var(--text3)" }}>📞 {d.contact}</div>}
              {(d.trhName || d.reName) && <div style={{ fontSize: 11, color: "var(--text3)" }}>TRH: {d.trhName||"—"} · RE: {d.reName||"—"}</div>}
            </div>
            {canEdit && <button className="btn-danger" onClick={() => deleteItem("dealers", d.id)}>Delete</button>}
          </div>
        </div>
      ))}

      {tab === "trhs" && filterBy(data.trhs, ["name","region","phone"]).map(t => (
        <div key={t.id} className="card" style={{ marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--navy)" }}>{t.name}</div>
              <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 3 }}>{t.region}{t.phone ? ` · 📞 ${t.phone}` : ""}</div>
            </div>
            {canEdit && <button className="btn-danger" onClick={() => deleteItem("trhs", t.id)}>Delete</button>}
          </div>
        </div>
      ))}

      {tab === "res" && filterBy(data.res, ["name","depot","phone"]).map(r => (
        <div key={r.id} className="card" style={{ marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--navy)" }}>{r.name}</div>
              <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 3 }}>{r.depot}{r.phone ? ` · 📞 ${r.phone}` : ""}</div>
            </div>
            {canEdit && <button className="btn-danger" onClick={() => deleteItem("res", r.id)}>Delete</button>}
          </div>
        </div>
      ))}

      {tab === "users" && filterBy(data.users, ["name","role","region"]).map(u => (
        <div key={u.id} className="card" style={{ marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--navy)" }}>{u.name}</div>
              <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 3 }}>
                <span className="badge badge-navy" style={{ fontSize: 9 }}>{u.role}</span> {u.region}
              </div>
            </div>
            {canEdit && u.id !== currentUser.id && <button className="btn-danger" onClick={() => deleteItem("users", u.id)}>Delete</button>}
          </div>
        </div>
      ))}

      <Toast message={toast} />
    </div>
  );
}
