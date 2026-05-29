import { useState } from "react";
import { useApp } from "../context/AppContext";
import { useToast, Toast } from "../components/Toast";

const CATS = ["Cement","Paints","PVC","Sanitary","Tiles","Waterproofing","Displays & Branding","Credit/Outstanding","New Product","Competition","Team Issue","Store Experience","Inventory","Influencer/Contractor","Others"];
const DEPOTS = ["Ahmedabad","Mehsana","Palanpur","Kutchh","Junagadh","Surendranagar","Rajkot","Jamnagar","Bharuch","Valsad","Surat","Gandhinagar","Dahod","Anand","Vadodara","Bhavnagar","Greater Mumbai","Thane","Dahanu"];
const PRIORITIES = ["High","Medium","Low"];
const STATUSES = ["Open","In Progress","Closed"];

function uid() { return "id_" + Math.random().toString(36).slice(2, 10); }

export default function NewVisit({ onDone }) {
  const { data, updateData, currentUser } = useApp();
  const { toast, showToast } = useToast();
  const [step, setStep] = useState(1); // 1=dealer, 2=discussion, 3=actions
  const [newDealer, setNewDealer] = useState(false);
  const [form, setForm] = useState({
    dealerId: "", depot: "", dealerName: "", dealerCode: "",
    dealerCity: "", dealerContact: "", trhName: "", reName: "",
    date: new Date().toISOString().slice(0, 10),
    categories: [], notes: "",
  });
  const [actions, setActions] = useState([{ id: uid(), title: "", detail: "", assignedToName: "", priority: "High", deadline: "", category: "", status: "Open" }]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleCat = c => set("categories", form.categories.includes(c) ? form.categories.filter(x => x !== c) : [...form.categories, c]);

  const addAction = () => setActions(a => [...a, { id: uid(), title: "", detail: "", assignedToName: "", priority: "Medium", deadline: "", category: form.categories[0] || "", status: "Open" }]);
  const setAction = (id, k, v) => setActions(a => a.map(x => x.id === id ? { ...x, [k]: v } : x));
  const removeAction = (id) => setActions(a => a.filter(x => x.id !== id));

  const handleSubmit = () => {
    if (!form.date) return showToast("Please set visit date");
    if (!form.dealerId && !form.dealerName) return showToast("Select or add a dealer");

    let dealerId = form.dealerId;
    let newDealers = [...data.dealers];

    if (newDealer && form.dealerName) {
      const d = { id: uid(), name: form.dealerName, code: form.dealerCode, depot: form.depot, city: form.dealerCity, contact: form.dealerContact, trhName: form.trhName, reName: form.reName };
      newDealers = [...data.dealers, d];
      dealerId = d.id;
      updateData("dealers", newDealers);
    }

    const visit = { id: uid(), dealerId, date: form.date, categories: form.categories, notes: form.notes, createdBy: currentUser.id, depot: form.depot };
    updateData("visits", [...data.visits, visit]);

    const newActions = actions.filter(a => a.title.trim()).map(a => ({
      ...a, id: uid(), visitId: visit.id, dealerId, depot: form.depot,
      createdBy: currentUser.id,
      assignedTo: a.assignedToName,
      category: a.category || form.categories[0] || "Others"
    }));
    if (newActions.length) updateData("actions", [...data.actions, ...newActions]);

    showToast(`✓ Visit saved! ${newActions.length} action${newActions.length !== 1 ? "s" : ""} created.`);
    setTimeout(() => onDone(), 1500);
  };

  const dealer = data.dealers.find(d => d.id === form.dealerId);

  return (
    <div className="page">
      <div className="page-title">New Market Visit</div>
      <div className="page-sub">Step {step} of 3 · {["Dealer Info","Discussion","Action Points"][step-1]}</div>

      {/* Progress */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        {[1,2,3].map(s => (
          <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: s <= step ? "var(--navy)" : "var(--border)" }} />
        ))}
      </div>

      {/* STEP 1 — DEALER */}
      {step === 1 && (
        <>
          <div className="form-group">
            <label className="form-label">Depot</label>
            <select className="form-select" value={form.depot} onChange={e => set("depot", e.target.value)}>
              <option value="">Select depot…</option>
              {DEPOTS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>

          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            <button className={`filter-pill${!newDealer ? " active" : ""}`} onClick={() => setNewDealer(false)}>Existing Dealer</button>
            <button className={`filter-pill${newDealer ? " active" : ""}`} onClick={() => setNewDealer(true)}>+ New Dealer</button>
          </div>

          {!newDealer ? (
            <div className="form-group">
              <label className="form-label">Select Dealer</label>
              <select className="form-select" value={form.dealerId} onChange={e => {
                const d = data.dealers.find(x => x.id === e.target.value);
                setForm(f => ({ ...f, dealerId: e.target.value, depot: d?.depot || f.depot, trhName: d?.trhName || f.trhName, reName: d?.reName || f.reName }));
              }}>
                <option value="">Select dealer…</option>
                {data.dealers.filter(d => !form.depot || d.depot === form.depot).map(d => (
                  <option key={d.id} value={d.id}>{d.name} — {d.depot}</option>
                ))}
              </select>
              {dealer && (
                <div className="alert alert-info" style={{ marginTop: 10 }}>
                  <span>ℹ</span>
                  <span><b>{dealer.name}</b> · {dealer.depot} · Code: {dealer.code || "—"}</span>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Dealer Name *</label><input className="form-input" placeholder="e.g. Sunrise Hardware" value={form.dealerName} onChange={e => set("dealerName", e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Store Code</label><input className="form-input" placeholder="e.g. GJ-012" value={form.dealerCode} onChange={e => set("dealerCode", e.target.value)} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">City</label><input className="form-input" placeholder="City" value={form.dealerCity} onChange={e => set("dealerCity", e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Contact No.</label><input className="form-input" placeholder="9876543210" value={form.dealerContact} onChange={e => set("dealerContact", e.target.value)} /></div>
              </div>
            </>
          )}

          <div className="form-row">
            <div className="form-group"><label className="form-label">TRH Name</label><input className="form-input" placeholder="TRH Name" value={form.trhName} onChange={e => set("trhName", e.target.value)} /></div>
            <div className="form-group"><label className="form-label">RE Name</label><input className="form-input" placeholder="RE Name" value={form.reName} onChange={e => set("reName", e.target.value)} /></div>
          </div>

          <div className="form-group">
            <label className="form-label">Visit Date</label>
            <input className="form-input" type="date" value={form.date} onChange={e => set("date", e.target.value)} />
          </div>

          <button className="btn-primary" onClick={() => {
            if (!form.depot) return showToast("Please select a depot");
            if (!form.dealerId && !form.dealerName) return showToast("Select or add a dealer");
            setStep(2);
          }}>Next: Discussion →</button>
        </>
      )}

      {/* STEP 2 — DISCUSSION */}
      {step === 2 && (
        <>
          <div className="form-group">
            <label className="form-label">Discussion Categories</label>
            <div className="tag-grid">
              {CATS.map(c => (
                <span key={c} className={`tag-pill${form.categories.includes(c) ? " selected" : ""}`} onClick={() => toggleCat(c)}>{c}</span>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Discussion Notes</label>
            <textarea className="form-textarea" placeholder="What was discussed? Key observations, dealer requests, issues found…" value={form.notes} onChange={e => set("notes", e.target.value)} rows={5} />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn-secondary" onClick={() => setStep(1)}>← Back</button>
            <button className="btn-primary" style={{ flex: 1 }} onClick={() => setStep(3)}>Next: Action Points →</button>
          </div>
        </>
      )}

      {/* STEP 3 — ACTIONS */}
      {step === 3 && (
        <>
          {actions.map((a, i) => (
            <div key={a.id} className="card" style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text3)", textTransform: "uppercase" }}>Action #{i+1}</span>
                {actions.length > 1 && <button className="btn-danger" onClick={() => removeAction(a.id)}>Remove</button>}
              </div>
              <div className="form-group"><label className="form-label">Action Title *</label><input className="form-input" placeholder="e.g. Arrange Opus branding" value={a.title} onChange={e => setAction(a.id, "title", e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Details</label><textarea className="form-textarea" placeholder="More details…" value={a.detail} rows={2} onChange={e => setAction(a.id, "detail", e.target.value)} /></div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Assign To</label><input className="form-input" placeholder="TRH / RE / Team name" value={a.assignedToName} onChange={e => setAction(a.id, "assignedToName", e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Priority</label>
                  <select className="form-select" value={a.priority} onChange={e => setAction(a.id, "priority", e.target.value)}>
                    {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Category</label>
                  <select className="form-select" value={a.category} onChange={e => setAction(a.id, "category", e.target.value)}>
                    <option value="">Select…</option>
                    {CATS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Deadline</label><input className="form-input" type="date" value={a.deadline} onChange={e => setAction(a.id, "deadline", e.target.value)} /></div>
              </div>
            </div>
          ))}

          <button className="btn-secondary" style={{ width: "100%", marginBottom: 12 }} onClick={addAction}>+ Add Another Action</button>

          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn-secondary" onClick={() => setStep(2)}>← Back</button>
            <button className="btn-primary" style={{ flex: 1 }} onClick={handleSubmit}>✓ Submit Visit</button>
          </div>
        </>
      )}

      <Toast message={toast} />
    </div>
  );
}
