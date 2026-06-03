const tabs = [
  { id: "dashboard", label: "Home",    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
  { id: "actions",   label: "Actions", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg> },
  { id: "visit",     label: "Visit",   special: true, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg> },
  { id: "export",    label: "Export",  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> },
  { id: "masters",   label: "Masters", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg> },
];

export default function BottomNav({ active, setActive }) {
  return (
    <div className="bottom-nav">
      {tabs.map(t => (
        <button
          key={t.id}
          className={`nav-btn${t.special ? " new-visit" : ""}${active === t.id ? " active" : ""}`}
          onClick={() => setActive(t.id)}
        >
          {t.icon}
          {t.label}
        </button>
      ))}
    </div>
  );
}
