import { useState, useEffect, useCallback } from "react";
import { AppContext } from "./context/AppContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Depots from "./pages/Depots";
import Actions from "./pages/Actions";
import NewVisit from "./pages/NewVisit";
import History from "./pages/History";
import Masters from "./pages/Masters";
import BottomNav from "./components/BottomNav";
import TopBar from "./components/TopBar";
import { supabase } from "./lib/supabase";
import * as db from "./lib/db";
import "./App.css";

const DEFAULT_CATS = ["Cement","Paints","PVC","Sanitary","Tiles","Waterproofing","Displays & Branding","Credit/Outstanding","New Product","Competition","Team Issue","Store Experience","Inventory","Influencer/Contractor","Payment Issue","Others"];
const DEPOTS = ["Ahmedabad","Mehsana","Palanpur","Kutchh","Junagadh","Surendranagar","Rajkot","Jamnagar","Bharuch","Valsad","Surat","Gandhinagar","Dahod","Anand","Vadodara","Bhavnagar","Greater Mumbai","Thane","Dahanu"];

const emptyData = { users: [], dealers: [], trhs: [], res: [], visits: [], actions: [], categories: DEFAULT_CATS, depots: DEPOTS };

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem("ubs_user")) } catch { return null }
  });
  const [activeTab, setActiveTab] = useState("dashboard");
  const [data, setData] = useState(emptyData);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(!supabase);

  // Load all data from Supabase
  const loadAll = useCallback(async () => {
    if (!supabase) { setOffline(true); setLoading(false); return; }
    try {
      const [users, dealers, trhs, res, visits, actions, categories] = await Promise.all([
        db.getUsers(), db.getDealers(), db.getTRHs(), db.getREs(),
        db.getVisits(), db.getActions(), db.getCategories()
      ]);
      setData({
        users: users || [],
        dealers: dealers || [],
        trhs: trhs || [],
        res: res || [],
        visits: visits || [],
        actions: actions || [],
        categories: categories?.length ? categories : DEFAULT_CATS,
        depots: DEPOTS
      });
      setOffline(false);
    } catch (err) {
      console.error("Load error:", err);
      setOffline(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Real-time updates — when anyone changes data, all devices refresh
  useEffect(() => {
    if (!supabase) return;
    const tables = ['users','dealers','trhs','res','visits','actions','categories'];
    const subs = tables.map(table =>
      supabase.channel(`${table}-changes`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, () => loadAll())
        .subscribe()
    );
    return () => subs.forEach(s => supabase.removeChannel(s));
  }, [loadAll]);

  const handleLogin = (user) => {
    setCurrentUser(user);
    sessionStorage.setItem("ubs_user", JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem("ubs_user");
  };

  // updateData — for local optimistic update + triggers real-time sync
  const updateData = (key, val) => {
    setData(prev => ({ ...prev, [key]: val }));
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#0f2744" }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#e8a020", letterSpacing: 3, fontFamily: "monospace", marginBottom: 16 }}>UBS FIELDOS</div>
      <div style={{ display: "flex", gap: 8 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: "#e8a020", animation: `bounce 0.8s ${i*0.25}s infinite ease-in-out` }} />
        ))}
      </div>
      <style>{`@keyframes bounce{0%,100%{transform:translateY(0);opacity:0.3}50%{transform:translateY(-8px);opacity:1}}`}</style>
    </div>
  );

  if (!currentUser) return (
    <Login
      offline={offline}
      onLogin={handleLogin}
      loginFn={offline ? null : db.loginUser}
      users={data.users}
    />
  );

  return (
    <AppContext.Provider value={{ data, updateData, currentUser, reload: loadAll, offline }}>
      <div className="app-shell">
        {offline && (
          <div style={{ background: "#e8a020", color: "#0f2744", fontSize: 11, fontWeight: 600, textAlign: "center", padding: "5px 12px" }}>
            ⚠ Offline mode — changes won't sync across devices
          </div>
        )}
        <TopBar user={currentUser} onLogout={handleLogout} />
        <main className="main-content">
          {activeTab === "dashboard" && <Dashboard setTab={setActiveTab} />}
          {activeTab === "depots"    && <Depots />}
          {activeTab === "actions"   && <Actions />}
          {activeTab === "visit"     && <NewVisit onDone={() => { loadAll(); setActiveTab("actions"); }} />}
          {activeTab === "history"   && <History />}
          {activeTab === "masters"   && <Masters />}
        </main>
        <BottomNav active={activeTab} setActive={setActiveTab} role={currentUser.role} />
      </div>
    </AppContext.Provider>
  );
}
