import { useState } from "react";
import { useApp } from "../context/AppContext";
import * as XLSX from "xlsx";
import { OFFLINE_TRHS } from "../data/masterData";

function isOverdue(deadline) {
  return deadline && new Date(deadline) < new Date();
}

export default function Export() {
  const { data } = useApp();
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);

  // Build full TRH list from all sources
  const allTRHs = [
    ...OFFLINE_TRHS,
    ...(data.trhs || []).filter(t => !OFFLINE_TRHS.find(o => o.name === t.name))
  ];

  // Stats per TRH for preview
  const trhStats = allTRHs.map(trh => {
    const trhActions = (data.actions || []).filter(a =>
      a.assigned_to === trh.name || a.assignedTo === trh.name || a.assignedToName === trh.name
    );
    return {
      ...trh,
      open: trhActions.filter(a => a.status === "Open").length,
      inProgress: trhActions.filter(a => a.status === "In Progress").length,
      closed: trhActions.filter(a => a.status === "Closed").length,
      high: trhActions.filter(a => a.priority === "High" && a.status !== "Closed").length,
      medium: trhActions.filter(a => a.priority === "Medium" && a.status !== "Closed").length,
      overdue: trhActions.filter(a => isOverdue(a.deadline) && a.status !== "Closed").length,
      total: trhActions.length
    };
  }).filter(t => t.total > 0 || true); // show all TRHs

  const getDealerName = (id) => (data.dealers || []).find(d => d.id === id)?.name || "—";

  const exportToExcel = () => {
    setExporting(true);
    try {
      const wb = XLSX.utils.book_new();
      const today = new Date().toLocaleDateString("en-IN");

      // ── SHEET 1: Summary ──────────────────────────────────
      const summaryRows = [
        ["UBS FieldOS — TRH Action Summary"],
        [`Generated: ${today}`],
        [],
        ["TRH Name", "Phone", "Open", "In Progress", "Closed", "High Priority", "Medium Priority", "Overdue", "Total"],
      ];
      trhStats.forEach(t => {
        summaryRows.push([t.name, t.phone || "—", t.open, t.inProgress, t.closed, t.high, t.medium, t.overdue, t.total]);
      });

      // Totals row
      summaryRows.push([]);
      summaryRows.push([
        "TOTAL", "",
        trhStats.reduce((s, t) => s + t.open, 0),
        trhStats.reduce((s, t) => s + t.inProgress, 0),
        trhStats.reduce((s, t) => s + t.closed, 0),
        trhStats.reduce((s, t) => s + t.high, 0),
        trhStats.reduce((s, t) => s + t.medium, 0),
        trhStats.reduce((s, t) => s + t.overdue, 0),
        trhStats.reduce((s, t) => s + t.total, 0),
      ]);

      const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
      // Column widths
      wsSummary["!cols"] = [{ wch: 25 }, { wch: 14 }, { wch: 8 }, { wch: 12 }, { wch: 8 }, { wch: 14 }, { wch: 16 }, { wch: 10 }, { wch: 8 }];
      XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

      // ── SHEET 2: Open Actions ─────────────────────────────
      const openRows = [
        ["UBS FieldOS — Open & In-Progress Actions"],
        [`Generated: ${today}`],
        [],
        ["#", "TRH Name", "Action Title", "Dealer", "Depot", "Category", "Priority", "Status", "Deadline", "Overdue?", "Remarks"]
      ];
      let rowNum = 1;
      allTRHs.forEach(trh => {
        const trhActions = (data.actions || []).filter(a =>
          (a.assigned_to === trh.name || a.assignedTo === trh.name || a.assignedToName === trh.name)
          && a.status !== "Closed"
        );
        if (trhActions.length === 0) return;
        // TRH header row
        openRows.push(["", `── ${trh.name} (${trhActions.length} open) ──`, "", "", "", "", "", "", "", "", ""]);
        trhActions
          .sort((a, b) => {
            const pri = { High: 0, Medium: 1, Low: 2 };
            return (pri[a.priority] || 1) - (pri[b.priority] || 1);
          })
          .forEach(a => {
            const deadline = a.deadline ? new Date(a.deadline).toLocaleDateString("en-IN") : "—";
            openRows.push([
              rowNum++,
              trh.name,
              a.title || "—",
              getDealerName(a.dealer_id || a.dealerId),
              a.depot || "—",
              a.category || "—",
              a.priority || "—",
              a.status || "—",
              deadline,
              isOverdue(a.deadline) ? "YES ⚠" : "No",
              a.remarks || ""
            ]);
          });
        openRows.push([]); // spacer
      });

      const wsOpen = XLSX.utils.aoa_to_sheet(openRows);
      wsOpen["!cols"] = [
        { wch: 5 }, { wch: 22 }, { wch: 35 }, { wch: 28 }, { wch: 14 },
        { wch: 20 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 25 }
      ];
      XLSX.utils.book_append_sheet(wb, wsOpen, "Open Actions");

      // ── SHEET 3: High Priority ────────────────────────────
      const highRows = [
        ["UBS FieldOS — High Priority Actions (Open + In Progress)"],
        [`Generated: ${today}`],
        [],
        ["#", "TRH Name", "Action Title", "Dealer", "Depot", "Category", "Status", "Deadline", "Overdue?"]
      ];
      let hNum = 1;
      (data.actions || [])
        .filter(a => a.priority === "High" && a.status !== "Closed")
        .sort((a, b) => {
          if (isOverdue(a.deadline) && !isOverdue(b.deadline)) return -1;
          if (!isOverdue(a.deadline) && isOverdue(b.deadline)) return 1;
          return (a.deadline || "").localeCompare(b.deadline || "");
        })
        .forEach(a => {
          const assignee = a.assigned_to || a.assignedTo || a.assignedToName || "—";
          const deadline = a.deadline ? new Date(a.deadline).toLocaleDateString("en-IN") : "—";
          highRows.push([
            hNum++, assignee, a.title || "—",
            getDealerName(a.dealer_id || a.dealerId),
            a.depot || "—", a.category || "—",
            a.status || "—", deadline,
            isOverdue(a.deadline) ? "YES ⚠" : "No"
          ]);
        });

      const wsHigh = XLSX.utils.aoa_to_sheet(highRows);
      wsHigh["!cols"] = [
        { wch: 5 }, { wch: 22 }, { wch: 35 }, { wch: 28 },
        { wch: 14 }, { wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 10 }
      ];
      XLSX.utils.book_append_sheet(wb, wsHigh, "High Priority");

      // ── SHEET 4: Per-TRH Detail ───────────────────────────
      allTRHs.forEach(trh => {
        const trhActions = (data.actions || []).filter(a =>
          a.assigned_to === trh.name || a.assignedTo === trh.name || a.assignedToName === trh.name
        );
        if (trhActions.length === 0) return;

        const rows = [
          [`Action Report — ${trh.name}`],
          [`Phone: ${trh.phone || "—"} | Region: ${trh.region || "—"} | Generated: ${today}`],
          [],
          ["#", "Title", "Dealer", "Depot", "Category", "Priority", "Status", "Deadline", "Overdue?", "Remarks"]
        ];

        const sorted = [...trhActions].sort((a, b) => {
          const sOrd = { "Open": 0, "In Progress": 1, "Closed": 2 };
          const pOrd = { "High": 0, "Medium": 1, "Low": 2 };
          if (sOrd[a.status] !== sOrd[b.status]) return (sOrd[a.status] || 0) - (sOrd[b.status] || 0);
          return (pOrd[a.priority] || 1) - (pOrd[b.priority] || 1);
        });

        sorted.forEach((a, i) => {
          const deadline = a.deadline ? new Date(a.deadline).toLocaleDateString("en-IN") : "—";
          rows.push([
            i + 1,
            a.title || "—",
            getDealerName(a.dealer_id || a.dealerId),
            a.depot || "—",
            a.category || "—",
            a.priority || "—",
            a.status || "—",
            deadline,
            isOverdue(a.deadline) && a.status !== "Closed" ? "YES ⚠" : "No",
            a.remarks || ""
          ]);
        });

        const ws = XLSX.utils.aoa_to_sheet(rows);
        ws["!cols"] = [
          { wch: 5 }, { wch: 30 }, { wch: 25 }, { wch: 14 },
          { wch: 18 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 25 }
        ];
        // Sheet name max 31 chars
        const sheetName = trh.name.slice(0, 28).replace(/[:/\\?*[\]]/g, "");
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      });

      // Download
      const filename = `UBS_Actions_${today.replace(/\//g, "-")}.xlsx`;
      XLSX.writeFile(wb, filename);
      setExported(true);
      setTimeout(() => setExported(false), 3000);
    } catch (e) {
      console.error("Export error:", e);
      alert("Export failed: " + e.message);
    }
    setExporting(false);
  };

  const totalOpen = (data.actions || []).filter(a => a.status === "Open").length;
  const totalIP   = (data.actions || []).filter(a => a.status === "In Progress").length;
  const totalHigh = (data.actions || []).filter(a => a.priority === "High" && a.status !== "Closed").length;
  const totalOver = (data.actions || []).filter(a => isOverdue(a.deadline) && a.status !== "Closed").length;

  return (
    <div className="page">
      <div className="page-title">Export Actions</div>
      <div className="page-sub">TRH-wise action report — Excel format</div>

      {/* Summary cards */}
      <div className="metrics-grid" style={{ marginBottom: 16 }}>
        <div className="metric-card">
          <div className="metric-val">{totalOpen}</div>
          <div className="metric-label">Open Actions</div>
        </div>
        <div className="metric-card">
          <div className="metric-val">{totalIP}</div>
          <div className="metric-label">In Progress</div>
        </div>
        <div className="metric-card">
          <div className="metric-val" style={{ color: "var(--red)" }}>{totalHigh}</div>
          <div className="metric-label">High Priority</div>
        </div>
        <div className="metric-card">
          <div className="metric-val" style={{ color: "var(--red)" }}>{totalOver}</div>
          <div className="metric-label">Overdue</div>
        </div>
      </div>

      {/* What's included */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--navy)", marginBottom: 10 }}>📊 Export includes 4 sheets:</div>
        {[
          { icon: "📋", title: "Summary", desc: "All TRHs — Open, In Progress, Closed, High, Medium, Overdue counts" },
          { icon: "📌", title: "Open Actions", desc: "All open & in-progress actions grouped by TRH, sorted by priority" },
          { icon: "🔴", title: "High Priority", desc: "All high priority open actions across all TRHs, overdue first" },
          { icon: "👤", title: "Per-TRH Sheets", desc: "One dedicated sheet per TRH with their complete action list" },
        ].map(s => (
          <div key={s.title} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
            <span style={{ fontSize: 18 }}>{s.icon}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{s.title}</div>
              <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>{s.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* TRH preview */}
      <div className="section-label">TRH-wise Preview</div>
      {trhStats.filter(t => t.total > 0).length === 0 && (
        <div className="alert alert-info">
          <span>ℹ</span>
          <span>No actions recorded yet. Add visits with action points to see data here.</span>
        </div>
      )}
      {trhStats.filter(t => t.total > 0).map(t => (
        <div key={t.id} className="card" style={{ marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--navy)" }}>{t.name}</div>
              <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>{t.phone || "—"}</div>
            </div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", justifyContent: "flex-end" }}>
              {t.open > 0 && <span className="badge badge-blue">{t.open} Open</span>}
              {t.inProgress > 0 && <span className="badge badge-amber">{t.inProgress} In Progress</span>}
              {t.overdue > 0 && <span className="badge badge-red">{t.overdue} Overdue</span>}
              {t.closed > 0 && <span className="badge badge-green">{t.closed} Closed</span>}
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 8, fontSize: 11, color: "var(--text3)" }}>
            <span>🔴 High: {t.high}</span>
            <span>🟡 Medium: {t.medium}</span>
            <span>Total: {t.total}</span>
          </div>
        </div>
      ))}

      <button
        className="btn-primary"
        style={{ marginTop: 16, fontSize: 16, padding: 14 }}
        onClick={exportToExcel}
        disabled={exporting}
      >
        {exporting ? "Generating Excel…" : exported ? "✓ Downloaded!" : "⬇ Download Excel Report"}
      </button>

      <div style={{ fontSize: 11, color: "var(--text3)", textAlign: "center", marginTop: 10, lineHeight: 1.6 }}>
        Downloads to your phone/laptop as<br/>
        <b>UBS_Actions_{new Date().toLocaleDateString("en-IN").replace(/\//g,"-")}.xlsx</b>
      </div>
    </div>
  );
}
