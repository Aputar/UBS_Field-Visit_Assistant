import { useState, useRef } from "react";
import { useApp } from "../context/AppContext";
import { useToast, Toast } from "../components/Toast";

const DEPOTS = ["Ahmedabad","Mehsana","Palanpur","Kutchh","Junagadh","Surendranagar","Rajkot","Jamnagar","Bharuch","Valsad","Surat","Gandhinagar","Dahod","Anand","Vadodara","Bhavnagar","Greater Mumbai","Thane","Dahanu"];

function uid() { return "id_" + Math.random().toString(36).slice(2, 10); }

// iOS-compatible WhatsApp opener
function openWhatsApp(phone, message) {
  const encoded = encodeURIComponent(message);
  const num = (phone || "").replace(/\D/g, "");
  // Try wa.me first (works on Android), fallback to whatsapp:// deep link for iOS
  const waUrl = num
    ? `https://wa.me/91${num}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;
  const iosUrl = num
    ? `whatsapp://send?phone=91${num}&text=${encoded}`
    : `whatsapp://send?text=${encoded}`;

  // Detect iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  if (isIOS) {
    // iOS: try deep link first, fallback to wa.me
    window.location.href = iosUrl;
    setTimeout(() => { window.open(waUrl, "_blank"); }, 1500);
  } else {
    window.open(waUrl, "_blank");
  }
}

function buildWhatsAppMessage(dealerName, depot, notes, actions, visitorName, categories) {
  const date = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  let msg = `🏪 *UBS FieldOS — Visit Report*\n`;
  msg += `📅 ${date} | 👤 By: ${visitorName}\n`;
  msg += `🏬 Dealer: *${dealerName}* | 📍 ${depot}\n`;
  if (categories?.length) msg += `🏷 ${categories.join(", ")}\n`;
  if (notes) msg += `\n📝 *Discussion:*\n${notes}\n`;
  if (actions?.length) {
    msg += `\n✅ *Action Points:*\n`;
    actions.forEach((a, i) => {
      msg += `\n${i + 1}. Assigned to: *${a.assignedToName || "—"}*`;
      msg += `\n   Priority: ${a.priority} | Deadline: ${a.deadline || "—"}\n`;
    });
  }
  msg += `\n_Sent via UBS FieldOS_`;
  return msg;
}

export default function NewVisit({ onDone }) {
  const { data, updateData, currentUser } = useApp();
  const { toast, showToast } = useToast();
  const categories = data.categories || ["Cement","Paints","PVC","Sanitary","Tiles","Waterproofing","Displays & Branding","Credit/Outstanding","New Product","Competition","Team Issue","Store Experience","Inventory","Influencer/Contractor","Payment Issue","Others"];

  // Mode: voice or manual
  const [mode, setMode] = useState("voice");
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [voicePhase, setVoicePhase] = useState("idle"); // idle | recording | processing
  const recognitionRef = useRef(null);

  // Form fields — all on one page
  const [depot, setDepot] = useState("");
  const [dealerId, setDealerId] = useState("");
  const [newDealerName, setNewDealerName] = useState("");
  const [isNewDealer, setIsNewDealer] = useState(false);
  const [selectedCats, setSelectedCats] = useState([]);
  const [notes, setNotes] = useState("");
  const [assignTo, setAssignTo] = useState("");
  const [priority, setPriority] = useState("High");
  const [deadline, setDeadline] = useState("");
  const [photos, setPhotos] = useState([]);
  const photoInputRef = useRef(null);

  const toggleCat = (c) => setSelectedCats(s => s.includes(c) ? s.filter(x => x !== c) : [...s, c]);

  const allTRHRE = [
    ...( data.trhs || []).map(t => t.name),
    ...( data.res || []).map(r => r.name),
    ...( data.users || []).filter(u => u.role === "TRH" || u.role === "RE").map(u => u.name),
  ].filter((v, i, a) => v && a.indexOf(v) === i);

  // Voice recording
  const startRecording = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { showToast("Voice not supported. Use Chrome browser."); return; }
    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.lang = "en-IN";
    let final = "";
    r.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript + " ";
        else interim += e.results[i][0].transcript;
      }
      setTranscript(final + interim);
    };
    r.onerror = (e) => { showToast("Mic error: " + e.error + ". Allow microphone access."); setIsRecording(false); setVoicePhase("idle"); };
    r.onend = () => { if (isRecording) setIsRecording(false); };
    r.start();
    recognitionRef.current = r;
    setIsRecording(true);
    setVoicePhase("recording");
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    setIsRecording(false);
    setVoicePhase("processing");
    const captured = transcript;
    setTimeout(() => parseWithAI(captured), 400);
  };

  const parseWithAI = async (text) => {
    if (!text?.trim()) { showToast("No speech captured. Try again."); setVoicePhase("idle"); return; }
    try {
      const response = await fetch("/api/parse-visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: text })
      });
      if (!response.ok) throw new Error("Server error");
      const parsed = await response.json();
      // Auto-fill form fields from AI
      if (parsed.dealerName) setNewDealerName(parsed.dealerName);
      if (parsed.depot) setDepot(parsed.depot);
      if (parsed.notes) setNotes(parsed.notes);
      if (parsed.categories?.length) setSelectedCats(parsed.categories);
      if (parsed.actions?.[0]) {
        if (parsed.actions[0].assignedToName) setAssignTo(parsed.actions[0].assignedToName);
        if (parsed.actions[0].priority) setPriority(parsed.actions[0].priority);
        if (parsed.actions[0].deadline) setDeadline(parsed.actions[0].deadline);
      }
      setIsNewDealer(true);
      showToast("✨ AI filled the form — review and submit!");
    } catch (e) {
      showToast("AI failed. Form is ready — fill manually.");
    }
    setVoicePhase("idle");
    setMode("manual");
  };

  const handlePhoto = (e) => {
    Array.from(e.target.files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => setPhotos(p => [...p, { id: uid(), url: ev.target.result }]);
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = () => {
    const finalDepot = depot;
    const finalDealerName = isNewDealer
      ? newDealerName
      : data.dealers.find(d => d.id === dealerId)?.name || "";

    if (!finalDepot) return showToast("Please select a depot");
    if (!finalDealerName) return showToast("Please enter dealer name");

    let finalDealerId = dealerId;
    if (isNewDealer && newDealerName) {
      const existing = data.dealers.find(d => d.name.toLowerCase() === newDealerName.toLowerCase() && d.depot === finalDepot);
      if (existing) {
        finalDealerId = existing.id;
      } else {
        const nd = { id: uid(), name: newDealerName, code: "", depot: finalDepot, city: finalDepot, contact: "" };
        updateData("dealers", [...data.dealers, nd]);
        finalDealerId = nd.id;
      }
    }

    const visit = {
      id: uid(), dealerId: finalDealerId, date: new Date().toISOString().slice(0, 10),
      categories: selectedCats, notes, photos: photos.map(p => p.url),
      createdBy: currentUser.id, depot: finalDepot
    };
    updateData("visits", [...data.visits, visit]);

    const action = {
      id: uid(), visitId: visit.id, dealerId: finalDealerId,
      title: notes?.slice(0, 60) || "Visit action",
      detail: notes, assignedTo: assignTo, assignedToName: assignTo,
      priority, deadline, category: selectedCats[0] || "Others",
      status: "Open", remarks: "", createdBy: currentUser.id, depot: finalDepot
    };
    if (assignTo || deadline) {
      updateData("actions", [...data.actions, action]);
    }

    showToast("✓ Visit saved! Sending WhatsApp…");

    // Find TRH phone number
    const trh = (data.trhs || []).find(t => t.name === assignTo) || (data.res || []).find(r => r.name === assignTo);
    const phone = trh?.phone || "";

    const msg = buildWhatsAppMessage(finalDealerName, finalDepot, notes, assignTo ? [{ assignedToName: assignTo, priority, deadline }] : [], currentUser.name, selectedCats);

    setTimeout(() => {
      openWhatsApp(phone, msg);
    }, 700);

    setTimeout(() => onDone(), 1600);
  };

  // ── VOICE RECORDING OVERLAY ──────────────────────────────
  const VoiceOverlay = () => (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(15,39,68,0.96)",
      zIndex: 400, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: 24
    }}>
      {voicePhase === "recording" && (
        <>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#e8a020", marginBottom: 16, letterSpacing: 1 }}>● RECORDING</div>
          <div style={{
            background: "rgba(255,255,255,0.08)", borderRadius: 14, padding: 16,
            minHeight: 100, width: "100%", maxWidth: 340, fontSize: 14,
            color: "#fff", lineHeight: 1.7, marginBottom: 28, textAlign: "left"
          }}>
            {transcript || <span style={{ color: "rgba(255,255,255,0.35)" }}>Listening… speak clearly in English or Hindi</span>}
          </div>
          <button onClick={stopRecording} style={{
            width: 80, height: 80, borderRadius: "50%", background: "#d63230",
            border: "4px solid rgba(255,255,255,0.2)", cursor: "pointer",
            fontSize: 30, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center"
          }}>⏹</button>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 14 }}>Tap to stop & process</div>
        </>
      )}
      {voicePhase === "processing" && (
        <>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✨</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#fff", marginBottom: 8 }}>AI is filling the form…</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Extracting dealer, depot, actions & deadlines</div>
          <div style={{ display: "flex", gap: 8, marginTop: 24 }}>
            {[0,1,2].map(i => (
              <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: "#e8a020", animation: `bounce 0.8s ${i*0.25}s infinite ease-in-out` }} />
            ))}
          </div>
        </>
      )}
      <style>{`@keyframes bounce{0%,100%{transform:translateY(0);opacity:0.4}50%{transform:translateY(-8px);opacity:1}}`}</style>
    </div>
  );

  // ── MAIN SINGLE-PAGE FORM ────────────────────────────────
  return (
    <div className="page">
      {(voicePhase === "recording" || voicePhase === "processing") && <VoiceOverlay />}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div className="page-title">New Market Visit</div>
          <div className="page-sub">Everything on one page</div>
        </div>
        <button
          onClick={voicePhase === "idle" ? startRecording : stopRecording}
          style={{
            display: "flex", alignItems: "center", gap: 6, padding: "9px 16px",
            background: isRecording ? "#d63230" : "#0f2744",
            color: "#fff", border: "none", borderRadius: 99, fontSize: 13,
            fontWeight: 600, cursor: "pointer", fontFamily: "inherit"
          }}
        >
          {isRecording ? "⏹ Stop" : "🎙 Speak"}
        </button>
      </div>

      {/* Voice tip */}
      {!isRecording && voicePhase === "idle" && (
        <div className="alert alert-info" style={{ marginBottom: 14 }}>
          <span>🎙</span>
          <span>Tap <b>Speak</b> and say everything — dealer, depot, discussion, who to assign, priority & deadline. AI will fill the form for you.</span>
        </div>
      )}

      {/* Transcript preview */}
      {transcript && voicePhase === "idle" && (
        <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, padding: 10, marginBottom: 14, fontSize: 12, color: "var(--text2)", lineHeight: 1.6 }}>
          <span style={{ fontWeight: 600, color: "var(--text3)", fontSize: 10, textTransform: "uppercase" }}>Voice captured · </span>
          {transcript}
        </div>
      )}

      {/* ── DEPOT + DEALER ── */}
      <div className="form-group">
        <label className="form-label">Depot *</label>
        <select className="form-select" value={depot} onChange={e => { setDepot(e.target.value); setDealerId(""); }}>
          <option value="">Select depot…</option>
          {DEPOTS.map(d => <option key={d}>{d}</option>)}
        </select>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <button className={`filter-pill${!isNewDealer ? " active" : ""}`} onClick={() => setIsNewDealer(false)}>Existing Dealer</button>
        <button className={`filter-pill${isNewDealer ? " active" : ""}`} onClick={() => setIsNewDealer(true)}>+ New Dealer</button>
      </div>

      {!isNewDealer ? (
        <div className="form-group">
          <label className="form-label">Select Dealer</label>
          <select className="form-select" value={dealerId} onChange={e => {
            setDealerId(e.target.value);
            const d = data.dealers.find(x => x.id === e.target.value);
            if (d?.depot) setDepot(d.depot);
          }}>
            <option value="">Select dealer…</option>
            {data.dealers.filter(d => !depot || d.depot === depot).map(d => (
              <option key={d.id} value={d.id}>{d.name} — {d.depot}</option>
            ))}
          </select>
        </div>
      ) : (
        <div className="form-group">
          <label className="form-label">Dealer / Store Name *</label>
          <input className="form-input" placeholder="e.g. Sunrise Hardware" value={newDealerName} onChange={e => setNewDealerName(e.target.value)} />
        </div>
      )}

      {/* ── CATEGORIES ── */}
      <div className="form-group">
        <label className="form-label">Discussion Categories</label>
        <div className="tag-grid">
          {categories.map(c => (
            <span key={c} className={`tag-pill${selectedCats.includes(c) ? " selected" : ""}`} onClick={() => toggleCat(c)}>{c}</span>
          ))}
        </div>
      </div>

      {/* ── DISCUSSION NOTES ── */}
      <div className="form-group">
        <label className="form-label" style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Discussion Notes</span>
          <span style={{ fontSize: 10, color: "var(--text3)", cursor: "pointer" }} onClick={startRecording}>🎙 voice</span>
        </label>
        <textarea className="form-textarea" rows={4}
          placeholder="What was discussed? Key issues, requests, observations…"
          value={notes} onChange={e => setNotes(e.target.value)} />
      </div>

      {/* ── ACTION: ASSIGN / PRIORITY / DEADLINE ── */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>Action Plan</div>

        <div className="form-group">
          <label className="form-label">Assign To (TRH / RE)</label>
          {allTRHRE.length > 0 ? (
            <select className="form-select" value={assignTo} onChange={e => setAssignTo(e.target.value)}>
              <option value="">Select person…</option>
              {allTRHRE.map(n => <option key={n}>{n}</option>)}
            </select>
          ) : (
            <input className="form-input" placeholder="Enter TRH / RE name" value={assignTo} onChange={e => setAssignTo(e.target.value)} />
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Priority</label>
            <select className="form-select" value={priority} onChange={e => setPriority(e.target.value)}>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Deadline</label>
            <input className="form-input" type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
          </div>
        </div>
      </div>

      {/* ── PHOTOS ── */}
      <div className="form-group">
        <label className="form-label">📷 Photos (optional)</label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
          {photos.map(p => (
            <div key={p.id} style={{ position: "relative" }}>
              <img src={p.url} alt="" style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 8, border: "1px solid var(--border)" }} />
              <button onClick={() => setPhotos(ps => ps.filter(x => x.id !== p.id))}
                style={{ position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: "50%", background: "var(--red)", color: "#fff", border: "none", fontSize: 10, cursor: "pointer", lineHeight: 1 }}>✕</button>
            </div>
          ))}
          <button onClick={() => photoInputRef.current?.click()}
            style={{ width: 72, height: 72, borderRadius: 8, border: "2px dashed var(--border2)", background: "var(--surface2)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text3)", fontSize: 11, gap: 3 }}>
            📷<span>Add</span>
          </button>
          <input ref={photoInputRef} type="file" accept="image/*" multiple capture="environment" style={{ display: "none" }} onChange={handlePhoto} />
        </div>
      </div>

      {/* ── SUBMIT ── */}
      <button className="btn-primary" style={{ marginTop: 8 }} onClick={handleSubmit}>
        ✓ Submit & Send on WhatsApp
      </button>

      <Toast message={toast} />
    </div>
  );
}
