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

// These users ALWAYS work — even without Supabase
const HARDCODED_USERS = [
  { id: "u1", name: "Rajesh Mehta",  role: "ZRH", region: "West (Guj + Mumbai)", password: "admin123" },
  { id: "u2", name: "Naveen Ahuja",  role: "ZRH", region: "Gujarat",              password: "admin123" },
  { id: "u3", name: "Vikram Shah",   role: "TRH", region: "Gujarat North",        password: "trh123"   },
  { id: "u4", name: "Priya Desai",   role: "RE",  region: "Ahmedabad",            password: "re123"    },
  { id: "u5", name: "Swapnil Gajjar",     role: "TRH", region: "Gujarat", password: "swapnil123" },
  { id: "u6", name: "Harkishan Prajapati",role: "TRH", region: "Gujarat", password: "harkishan123" },
  { id: "u7", name: "Prashant Singh",     role: "TRH", region: "Gujarat", password: "prashant123" },
  { id: "u8", name: "Mayur Sardhara",     role: "TRH", region: "Gujarat", password: "mayur123" },
  { id: "u9", name: "Kamlesh Chavan",     role: "TRH", region: "Gujarat", password: "kamlesh123" },
  { id: "u10", name: "Darshak Mehta",     role: "TRH", region: "Gujarat", password: "darshak123" },
  { id: "u11", name: "Pankaj Singh",      role: "TRH", region: "Gujarat", password: "pankaj123" },
  { id: "u12", name: "Ruturaj Taviyad",   role: "TRH", region: "Gujarat", password: "ruturaj123" },
  { id: "u13", name: "Vishal Sengar",     role: "TRH", region: "Gujarat", password: "vishal123" },
  { id: "u14", name: "Dhiraj Joshi",      role: "TRH", region: "Gujarat", password: "dhiraj123" },
  { id: "u15", name: "Nikhil Verma",      role: "TRH", region: "Gujarat", password: "nikhil123" },
];

const emptyData = {
  users: HARDCODED_USERS,
  dealers: [], trhs: [], res: [],
  visits: [], actions: [],
  categories: DEFAULT_CATS,
  depots: DEPOTS
};

// Login function — tries Supabase first, falls back to hardcoded users
async function tryLogin(name, password, supabaseAvailable) {
  const trimName = name.trim().toLowerCase();
  const trimPass = password.trim();

  // Always check hardcoded users first — instant, works offline
  const hardcoded = HARDCODED_USERS.find(u =>
    u.name.toLowerCase().includes(trimName) && u.password === trimPass
  );
  if (hardcoded) return hardcoded;

  // Then try Supabase for custom users added via Masters
  if (supabaseAvailable && supabase) {
    try {
      const user = await db.loginUser(name, password);
      if (user) return user;
    } catch (e) {
      console.log("Supabase login failed, using local only:", e.message);
    }
  }

  return null;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem("ubs_user")); } catch { return null; }
  });
  const [activeTab, setActiveTab] = useState("dashboard");
  const [data, setData] = useState(emptyData);
  const [loading, setLoading] = useState(true);
  const [supabaseOk, setSupabaseOk] = useState(false);

  const loadAll = useCallback(async () => {
    if (!supabase) {
      setSupabaseOk(false);
      setLoading(false);
      return;
    }
    try {
      const [dealers, trhs, res, visits, actions, categories, dbUsers] = await Promise.all([
        db.getDealers(), db.getTRHs(), db.getREs(),
        db.getVisits(), db.getActions(), db.getCategories(), db.getUsers()
      ]);

      // Merge DB users with hardcoded — hardcoded always win for same name
      const dbUserNames = (dbUsers || []).map(u => u.name.toLowerCase());
      const extraHardcoded = HARDCODED_USERS.filter(u => !dbUserNames.includes(u.name.toLowerCase()));

      setData({
        users: [...(dbUsers || []), ...extraHardcoded],
        dealers: dealers || [],
        trhs: trhs || [],
        res: res || [],
        visits: visits || [],
        actions: actions || [],
        categories: categories?.length ? categories : DEFAULT_CATS,
        depots: DEPOTS
      });
      setSupabaseOk(true);
    } catch (err) {
      console.error("Supabase load error:", err);
      setSupabaseOk(false);
      // Keep default data so app still works
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Real-time sync
  useEffect(() => {
    if (!supabase || !supabaseOk) return;
    const tables = ['users','dealers','trhs','res','visits','actions','categories'];
    const subs = tables.map(table =>
      supabase.channel(`rt-${table}`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, () => loadAll())
        .subscribe()
    );
    return () => subs.forEach(s => supabase.removeChannel(s));
  }, [loadAll, supabaseOk]);

  const handleLogin = (user) => {
    setCurrentUser(user);
    sessionStorage.setItem("ubs_user", JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem("ubs_user");
  };

  const updateData = (key, val) => setData(prev => ({ ...prev, [key]: val }));

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:"#0f2744" }}>
      <div style={{ fontSize:13, fontWeight:600, color:"#e8a020", letterSpacing:3, fontFamily:"monospace", marginBottom:20 }}>UBS FIELDOS</div>
      <div style={{ display:"flex", gap:8 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ width:10, height:10, borderRadius:"50%", background:"#e8a020", animation:`bounce 0.8s ${i*0.25}s infinite ease-in-out` }} />
        ))}
      </div>
      <style>{`@keyframes bounce{0%,100%{transform:translateY(0);opacity:0.3}50%{transform:translateY(-8px);opacity:1}}`}</style>
    </div>
  );

  if (!currentUser) return (
    <Login
      supabaseOk={supabaseOk}
      onLogin={handleLogin}
      loginFn={(name, pass) => tryLogin(name, pass, supabaseOk)}
    />
  );

  return (
    <AppContext.Provider value={{ data, updateData, currentUser, reload: loadAll, offline: !supabaseOk }}>
      <div className="app-shell">
        {!supabaseOk && (
          <div style={{ background:"#e8a020", color:"#0f2744", fontSize:11, fontWeight:600, textAlign:"center", padding:"5px 12px" }}>
            ⚠ Local mode — set up Supabase for cross-device sync
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
