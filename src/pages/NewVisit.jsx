import { useState, useRef } from "react";
import { useApp } from "../context/AppContext";
import { useToast, Toast } from "../components/Toast";

const DEPOTS = ["Ahmedabad","Mehsana","Palanpur","Kutchh","Junagadh","Surendranagar","Rajkot","Jamnagar","Bharuch","Valsad","Surat","Gandhinagar","Dahod","Anand","Vadodara","Bhavnagar","Greater Mumbai","Thane","Dahanu"];
const CATS = ["Cement","Paints","PVC","Sanitary","Tiles","Waterproofing","Displays & Branding","Credit/Outstanding","New Product","Competition","Team Issue","Store Experience","Inventory","Influencer/Contractor","Others"];

function uid() { return "id_" + Math.random().toString(36).slice(2, 10); }

function buildWhatsAppMessage(dealerName, depot, notes, actions, visitorName) {
  const date = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  let msg = `🏪 *UBS FieldOS — Visit Report*\n`;
  msg += `📅 ${date} | 👤 By: ${visitorName}\n`;
  msg += `🏬 Dealer: *${dealerName}* | 📍 ${depot}\n\n`;
  if (notes) msg += `📝 *Discussion Notes:*\n${notes}\n\n`;
  if (actions.length > 0) {
    msg += `✅ *Action Points:*\n`;
    actions.forEach((a, i) => {
      msg += `\n${i+1}. *${a.title}*\n`;
      if (a.detail) msg += `   Details: ${a.detail}\n`;
      msg += `   Assigned to: ${a.assignedToName || "—"}\n`;
      msg += `   Priority: ${a.priority} | Deadline: ${a.deadline || "—"}\n`;
    });
  }
  msg += `\n_Sent via UBS FieldOS_`;
  return encodeURIComponent(msg);
}

export default function NewVisit({ onDone }) {
  const { data, updateData, currentUser } = useApp();
  const { toast, showToast } = useToast();

  // MODE: 'voice' or 'manual'
  const [mode, setMode] = useState("voice");

  // Voice state
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [aiParsed, setAiParsed] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [voicePhase, setVoicePhase] = useState("idle"); // idle, recording, processing, review
  const recognitionRef = useRef(null);

  // Manual form state
  const [step, setStep] = useState(1);
  const [newDealer, setNewDealer] = useState(false);
  const [form, setForm] = useState({
    dealerId: "", depot: "", dealerName: "", dealerCode: "",
    dealerCity: "", dealerContact: "", trhName: "", reName: "",
    date: new Date().toISOString().slice(0, 10),
    categories: [], notes: "",
  });
  const [actions, setActions] = useState([{ id: uid(), title: "", detail: "", assignedToName: "", priority: "High", deadline: "", category: "", status: "Open" }]);

  // Photos
  const [photos, setPhotos] = useState([]);
  const photoInputRef = useRef(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleCat = c => set("categories", form.categories.includes(c) ? form.categories.filter(x => x !== c) : [...form.categories, c]);
  const addAction = () => setActions(a => [...a, { id: uid(), title: "", detail: "", assignedToName: "", priority: "Medium", deadline: "", category: "", status: "Open" }]);
  const setAction = (id, k, v) => setActions(a => a.map(x => x.id === id ? { ...x, [k]: v } : x));
  const removeAction = (id) => setActions(a => a.filter(x => x.id !== id));

  // Photo handler
  const handlePhoto = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => setPhotos(p => [...p, { id: uid(), url: ev.target.result, name: file.name }]);
      reader.readAsDataURL(file);
    });
  };

  // Voice recording
  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { showToast("Voice not supported on this browser. Use Chrome."); return; }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-IN";
    let finalText = "";
    recognition.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalText += e.results[i][0].transcript + " ";
        else interim += e.results[i][0].transcript;
      }
      setTranscript(finalText + interim);
    };
    recognition.onerror = () => showToast("Mic error. Please allow microphone access.");
    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
    setVoicePhase("recording");
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    setIsRecording(false);
    setVoicePhase("processing");
    setTimeout(() => parseWithAI(transcript), 300);
  };

  const parseWithAI = async (text) => {
    if (!text.trim()) { showToast("No speech detected. Please try again."); setVoicePhase("idle"); return; }
    setAiLoading(true);
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `You are a field visit assistant for UltraTech Building Solutions (UBS). Extract structured data from this spoken field visit note. Return ONLY valid JSON, nothing else.

Spoken note: "${text}"

Available depots: ${DEPOTS.join(", ")}
Available categories: ${CATS.join(", ")}

Return this exact JSON structure:
{
  "dealerName": "extracted dealer/store name or empty string",
  "depot": "closest matching depot from list or empty",
  "notes": "summary of discussion points",
  "categories": ["array of matching categories from list"],
  "actions": [
    {
      "title": "action title",
      "detail": "action details",
      "assignedToName": "person name mentioned",
      "priority": "High or Medium or Low",
      "deadline": "YYYY-MM-DD format or empty",
      "category": "matching category"
    }
  ]
}`
          }]
        })
      });
      const data = await response.json();
      const raw = data.content?.[0]?.text || "{}";
      const clean = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setAiParsed(parsed);
      setVoicePhase("review");
    } catch (e) {
      showToast("AI parsing failed. Please fill manually.");
      setMode("manual");
      setVoicePhase("idle");
    }
    setAiLoading(false);
  };

  const applyAIParsed = () => {
    if (!aiParsed) return;
    setForm(f => ({
      ...f,
      dealerName: aiParsed.dealerName || f.dealerName,
      depot: aiParsed.depot || f.depot,
      notes: aiParsed.notes || f.notes,
      categories: aiParsed.categories || f.categories,
    }));
    if (aiParsed.actions?.length) {
      setActions(aiParsed.actions.map(a => ({ ...a, id: uid(), status: "Open" })));
    }
    setMode("manual");
    setStep(3);
  };

  // WhatsApp send
  const sendWhatsApp = (dealerName, depot, notes, acts, phone) => {
    const msg = buildWhatsAppMessage(dealerName, depot, notes, acts, currentUser.name);
    const num = phone ? phone.replace(/\D/g, "") : "";
    const url = num
      ? `https://wa.me/91${num}?text=${msg}`
      : `https://wa.me/?text=${msg}`;
    window.open(url, "_blank");
  };

  const handleSubmit = () => {
    const dealerName = newDealer ? form.dealerName : (data.dealers.find(d => d.id === form.dealerId)?.name || "");
    if (!form.depot && !aiParsed?.depot) return showToast("Please select a depot");
    if (!dealerName) return showToast("Please enter dealer name");

    let dealerId = form.dealerId;
    let newDealers = [...data.dealers];
    let trhPhone = "";

    if (newDealer && form.dealerName) {
      const d = { id: uid(), name: form.dealerName, code: form.dealerCode, depot: form.depot, city: form.dealerCity, contact: form.dealerContact, trhName: form.trhName, reName: form.reName };
      newDealers = [...data.dealers, d];
      dealerId = d.id;
      updateData("dealers", newDealers);
    }

    // Find TRH phone
    const trh = data.trhs?.find(t => t.name === form.trhName || t.name === aiParsed?.assignedTo);
    trhPhone = trh?.phone || "";

    const visit = { id: uid(), dealerId, date: form.date, categories: form.categories, notes: form.notes, photos: photos.map(p => p.url), createdBy: currentUser.id, depot: form.depot };
    updateData("visits", [...data.visits, visit]);

    const validActions = actions.filter(a => a.title?.trim());
    const newActions = validActions.map(a => ({
      ...a, id: uid(), visitId: visit.id, dealerId, depot: form.depot,
      createdBy: currentUser.id, assignedTo: a.assignedToName,
      category: a.category || form.categories[0] || "Others"
    }));
    if (newActions.length) updateData("actions", [...data.actions, ...newActions]);

    showToast(`✓ Visit saved! ${newActions.length} action(s) created.`);

    // Auto WhatsApp
    setTimeout(() => {
      const finalDealer = newDealers.find(d => d.id === dealerId);
      sendWhatsApp(finalDealer?.name || form.dealerName, form.depot, form.notes, validActions, trhPhone);
    }, 800);

    setTimeout(() => onDone(), 1800);
  };

  const dealer = data.dealers.find(d => d.id === form.dealerId);

  // ─── VOICE MODE UI ───────────────────────────────────────
  if (mode === "voice" && voicePhase !== "review") {
    return (
      <div className="page">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <div className="page-title">Voice Visit Entry</div>
          <button className="btn-secondary" style={{ fontSize: 12, padding: "6px 12px" }} onClick={() => { setMode("manual"); setVoicePhase("idle"); }}>Manual →</button>
        </div>
        <div className="page-sub">Speak your full visit — dealer, discussion & action plan</div>

        <div className="card" style={{ textAlign: "center", padding: "32px 20px", marginBottom: 16 }}>
          {voicePhase === "idle" && (
            <>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎙️</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--navy)", marginBottom: 8 }}>Tap to start speaking</div>
              <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 24, lineHeight: 1.7 }}>
                Say everything at once — dealer name, depot, what was discussed, action points, who to assign, priority and deadline.<br/><br/>
                <b>Example:</b> <i>"Visited ABC UBS in Ahmedabad. Discussed paint display issue. Action — arrange Opus branding, assign to Vikram Shah, high priority, deadline 5th June."</i>
              </div>
              <button
                onClick={startRecording}
                style={{
                  width: 80, height: 80, borderRadius: "50%",
                  background: "var(--navy)", border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto", fontSize: 32, color: "#fff",
                  boxShadow: "0 4px 20px rgba(15,39,68,0.3)"
                }}
              >🎙</button>
            </>
          )}

          {voicePhase === "recording" && (
            <>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--red)", marginBottom: 16, animation: "pulse 1s infinite" }}>● Recording…</div>
              <div style={{
                background: "var(--bg)", borderRadius: 10, padding: 14, minHeight: 80,
                fontSize: 13, color: "var(--text)", textAlign: "left", marginBottom: 20, lineHeight: 1.6
              }}>
                {transcript || <span style={{ color: "var(--text3)" }}>Listening… speak clearly</span>}
              </div>
              <button
                onClick={stopRecording}
                style={{
                  width: 80, height: 80, borderRadius: "50%",
                  background: "var(--red)", border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto", fontSize: 28, color: "#fff",
                  boxShadow: "0 4px 20px rgba(214,50,48,0.4)"
                }}
              >⏹</button>
              <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 12 }}>Tap to stop & process</div>
            </>
          )}

          {voicePhase === "processing" && (
            <>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✨</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--navy)", marginBottom: 8 }}>AI is processing…</div>
              <div style={{ fontSize: 12, color: "var(--text3)" }}>Extracting dealer, actions, assignees & deadlines</div>
              <div style={{ marginTop: 20, display: "flex", justifyContent: "center", gap: 6 }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--navy)", opacity: 0.4, animation: `bounce 0.8s ${i*0.2}s infinite` }} />
                ))}
              </div>
            </>
          )}
        </div>

        <div style={{ textAlign: "center", marginTop: 8 }}>
          <button className="btn-secondary" onClick={() => { setMode("manual"); setVoicePhase("idle"); }}>Switch to manual form instead</button>
        </div>
        <Toast message={toast} />
        <style>{`
          @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
          @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        `}</style>
      </div>
    );
  }

  // ─── AI REVIEW SCREEN ─────────────────────────────────────
  if (voicePhase === "review" && aiParsed) {
    return (
      <div className="page">
        <div className="page-title">Review & Confirm</div>
        <div className="page-sub">AI extracted the following — review before submitting</div>

        <div className="alert alert-info" style={{ marginBottom: 12 }}>
          <span>✨</span>
          <span>AI parsed your voice note. Review and edit if needed, then confirm.</span>
        </div>

        <div className="card" style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text3)", textTransform: "uppercase", marginBottom: 10 }}>Dealer & Depot</div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Dealer Name</label>
              <input className="form-input" value={aiParsed.dealerName || ""} onChange={e => setAiParsed(p => ({ ...p, dealerName: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Depot</label>
              <select className="form-select" value={aiParsed.depot || ""} onChange={e => setAiParsed(p => ({ ...p, depot: e.target.value }))}>
                <option value="">Select…</option>
                {DEPOTS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Discussion Notes</label>
            <textarea className="form-textarea" rows={3} value={aiParsed.notes || ""} onChange={e => setAiParsed(p => ({ ...p, notes: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Categories</label>
            <div className="tag-grid">
              {CATS.map(c => (
                <span key={c} className={`tag-pill${(aiParsed.categories || []).includes(c) ? " selected" : ""}`}
                  onClick={() => setAiParsed(p => ({ ...p, categories: (p.categories||[]).includes(c) ? (p.categories||[]).filter(x=>x!==c) : [...(p.categories||[]), c] }))}>
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>

        {(aiParsed.actions || []).map((a, i) => (
          <div key={i} className="card" style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text3)", textTransform: "uppercase", marginBottom: 8 }}>Action #{i+1}</div>
            <div className="form-group"><label className="form-label">Title</label>
              <input className="form-input" value={a.title} onChange={e => setAiParsed(p => { const acts=[...p.actions]; acts[i]={...acts[i],title:e.target.value}; return {...p,actions:acts}; })} />
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Assign To</label>
                <input className="form-input" value={a.assignedToName} onChange={e => setAiParsed(p => { const acts=[...p.actions]; acts[i]={...acts[i],assignedToName:e.target.value}; return {...p,actions:acts}; })} />
              </div>
              <div className="form-group"><label className="form-label">Priority</label>
                <select className="form-select" value={a.priority} onChange={e => setAiParsed(p => { const acts=[...p.actions]; acts[i]={...acts[i],priority:e.target.value}; return {...p,actions:acts}; })}>
                  <option>High</option><option>Medium</option><option>Low</option>
                </select>
              </div>
            </div>
            <div className="form-group"><label className="form-label">Deadline</label>
              <input className="form-input" type="date" value={a.deadline||""} onChange={e => setAiParsed(p => { const acts=[...p.actions]; acts[i]={...acts[i],deadline:e.target.value}; return {...p,actions:acts}; })} />
            </div>
          </div>
        ))}

        {/* Photos */}
        <div className="card" style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text3)", textTransform: "uppercase", marginBottom: 10 }}>📷 Photos</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {photos.map(p => (
              <div key={p.id} style={{ position: "relative" }}>
                <img src={p.url} alt="" style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 8, border: "1px solid var(--border)" }} />
                <button onClick={() => setPhotos(ps => ps.filter(x => x.id !== p.id))}
                  style={{ position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: "50%", background: "var(--red)", color: "#fff", border: "none", fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
              </div>
            ))}
            <button onClick={() => photoInputRef.current?.click()}
              style={{ width: 72, height: 72, borderRadius: 8, border: "2px dashed var(--border2)", background: "var(--surface2)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text3)", fontSize: 11 }}>
              📷<span>Add</span>
            </button>
            <input ref={photoInputRef} type="file" accept="image/*" multiple capture="environment" style={{ display: "none" }} onChange={handlePhoto} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <button className="btn-secondary" onClick={() => { setVoicePhase("idle"); setTranscript(""); setAiParsed(null); }}>← Re-record</button>
          <button className="btn-primary" style={{ flex: 1 }} onClick={() => {
            // Apply parsed to form and submit
            const dp = aiParsed.depot || "";
            const dn = aiParsed.dealerName || "";
            if (!dp) return showToast("Please select a depot");
            if (!dn) return showToast("Please enter dealer name");

            // Save new dealer
            const existingDealer = data.dealers.find(d => d.name.toLowerCase() === dn.toLowerCase() && d.depot === dp);
            let dealerId = existingDealer?.id;
            if (!dealerId) {
              const d = { id: uid(), name: dn, depot: dp, code: "", city: dp, contact: "" };
              updateData("dealers", [...data.dealers, d]);
              dealerId = d.id;
            }
            const visit = { id: uid(), dealerId, date: new Date().toISOString().slice(0,10), categories: aiParsed.categories||[], notes: aiParsed.notes||"", photos: photos.map(p=>p.url), createdBy: currentUser.id, depot: dp };
            updateData("visits", [...data.visits, visit]);
            const validActions = (aiParsed.actions||[]).filter(a=>a.title?.trim());
            const newActions = validActions.map(a => ({ ...a, id: uid(), visitId: visit.id, dealerId, depot: dp, status: "Open", createdBy: currentUser.id, assignedTo: a.assignedToName, category: a.category || (aiParsed.categories||[])[0] || "Others" }));
            if (newActions.length) updateData("actions", [...data.actions, ...newActions]);
            showToast(`✓ Visit saved! ${newActions.length} action(s) created.`);

            // Find TRH phone
            const trh = data.trhs?.find(t => validActions.some(a => a.assignedToName && t.name.toLowerCase().includes(a.assignedToName.toLowerCase())));

            setTimeout(() => {
              const msg = buildWhatsAppMessage(dn, dp, aiParsed.notes||"", validActions, currentUser.name);
              const num = trh?.phone ? trh.phone.replace(/\D/g,"") : "";
              const url = num ? `https://wa.me/91${num}?text=${msg}` : `https://wa.me/?text=${msg}`;
              window.open(url, "_blank");
            }, 600);
            setTimeout(() => onDone(), 1400);
          }}>✓ Confirm & Send WhatsApp</button>
        </div>
        <Toast message={toast} />
      </div>
    );
  }

  // ─── MANUAL MODE ──────────────────────────────────────────
  return (
    <div className="page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <div className="page-title">New Market Visit</div>
        <button className="btn-secondary" style={{ fontSize: 12, padding: "6px 12px" }} onClick={() => { setMode("voice"); setVoicePhase("idle"); setTranscript(""); }}>🎙 Voice</button>
      </div>
      <div className="page-sub">Step {step} of 3 · {["Dealer Info","Discussion","Actions & Submit"][step-1]}</div>

      <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        {[1,2,3].map(s => (
          <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: s <= step ? "var(--navy)" : "var(--border)" }} />
        ))}
      </div>

      {/* STEP 1 */}
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
              {dealer && <div className="alert alert-info" style={{ marginTop: 10 }}><span>ℹ</span><span><b>{dealer.name}</b> · {dealer.depot}</span></div>}
            </div>
          ) : (
            <>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Dealer Name *</label><input className="form-input" placeholder="Name" value={form.dealerName} onChange={e => set("dealerName", e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Store Code</label><input className="form-input" placeholder="GJ-001" value={form.dealerCode} onChange={e => set("dealerCode", e.target.value)} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">City</label><input className="form-input" value={form.dealerCity} onChange={e => set("dealerCity", e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Contact</label><input className="form-input" value={form.dealerContact} onChange={e => set("dealerContact", e.target.value)} /></div>
              </div>
            </>
          )}
          <div className="form-row">
            <div className="form-group"><label className="form-label">TRH Name</label><input className="form-input" value={form.trhName} onChange={e => set("trhName", e.target.value)} /></div>
            <div className="form-group"><label className="form-label">RE Name</label><input className="form-input" value={form.reName} onChange={e => set("reName", e.target.value)} /></div>
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

      {/* STEP 2 */}
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
            <textarea className="form-textarea" placeholder="What was discussed?" value={form.notes} onChange={e => set("notes", e.target.value)} rows={4} />
          </div>

          {/* Photos in step 2 */}
          <div className="form-group">
            <label className="form-label">📷 Photos (optional)</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
              {photos.map(p => (
                <div key={p.id} style={{ position: "relative" }}>
                  <img src={p.url} alt="" style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 8, border: "1px solid var(--border)" }} />
                  <button onClick={() => setPhotos(ps => ps.filter(x => x.id !== p.id))}
                    style={{ position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: "50%", background: "var(--red)", color: "#fff", border: "none", fontSize: 10, cursor: "pointer", display:"flex",alignItems:"center",justifyContent:"center" }}>✕</button>
                </div>
              ))}
              <button onClick={() => photoInputRef.current?.click()}
                style={{ width: 72, height: 72, borderRadius: 8, border: "2px dashed var(--border2)", background: "var(--surface2)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text3)", fontSize: 11, gap: 2 }}>
                📷<span>Add</span>
              </button>
              <input ref={photoInputRef} type="file" accept="image/*" multiple capture="environment" style={{ display: "none" }} onChange={handlePhoto} />
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn-secondary" onClick={() => setStep(1)}>← Back</button>
            <button className="btn-primary" style={{ flex: 1 }} onClick={() => setStep(3)}>Next: Actions →</button>
          </div>
        </>
      )}

      {/* STEP 3 */}
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
                <div className="form-group"><label className="form-label">Assign To</label><input className="form-input" placeholder="TRH / RE name" value={a.assignedToName} onChange={e => setAction(a.id, "assignedToName", e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Priority</label>
                  <select className="form-select" value={a.priority} onChange={e => setAction(a.id, "priority", e.target.value)}>
                    <option>High</option><option>Medium</option><option>Low</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Category</label>
                  <select className="form-select" value={a.category} onChange={e => setAction(a.id, "category", e.target.value)}>
                    <option value="">Select…</option>{CATS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Deadline</label><input className="form-input" type="date" value={a.deadline} onChange={e => setAction(a.id, "deadline", e.target.value)} /></div>
              </div>
            </div>
          ))}
          <button className="btn-secondary" style={{ width: "100%", marginBottom: 12 }} onClick={addAction}>+ Add Another Action</button>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn-secondary" onClick={() => setStep(2)}>← Back</button>
            <button className="btn-primary" style={{ flex: 1 }} onClick={handleSubmit}>✓ Submit & Send WhatsApp</button>
          </div>
        </>
      )}
      <Toast message={toast} />
    </div>
  );
}
