import { useState, useEffect, useCallback } from "react";
import { AppContext } from "./context/AppContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Depots from "./pages/Depots";
import Actions from "./pages/Actions";
import NewVisit from "./pages/NewVisit";
import History from "./pages/History";
import Masters from "./pages/Masters";
import Export from "./pages/Export";
import BottomNav from "./components/BottomNav";
import TopBar from "./components/TopBar";
import { supabase } from "./lib/supabase";
import * as db from "./lib/db";
import { OFFLINE_TRHS, OFFLINE_DEALERS } from "./data/masterData";
import "./App.css";

const DEFAULT_CATS = ["Cement","Paints","PVC","Sanitary","Tiles","Waterproofing","Displays & Branding","Credit/Outstanding","New Product","Competition","Team Issue","Store Experience","Inventory","Influencer/Contractor","Payment Issue","Others"];
const DEPOTS = ["Ahmedabad","Mehsana","Palanpur","Kutchh","Junagadh","Surendranagar","Rajkot","Jamnagar","Bharuch","Valsad","Surat","Gandhinagar","Dahod","Anand","Vadodara","Bhavnagar","Greater Mumbai","Thane","Dahanu"];

const HARDCODED_USERS = [
  { id: "u1",  name: "Naveen Ahuja",          role: "ZRH", region: "Gujarat",              password: "admin123"     },
  { id: "u2",  name: "Rajesh Mehta",          role: "ZRH", region: "West (Guj + Mumbai)",  password: "admin123"     },
  { id: "u3",  name: "Vikram Shah",           role: "TRH", region: "Gujarat North",        password: "trh123"       },
  { id: "u4",  name: "Priya Desai",           role: "RE",  region: "Ahmedabad",            password: "re123"        },
  { id: "u5",  name: "Swapnil Gajjar",        role: "TRH", region: "Gujarat",              password: "swapnil123"   },
  { id: "u6",  name: "Harkishan Prajapati",   role: "TRH", region: "Gujarat",              password: "harkishan123" },
  { id: "u7",  name: "Prashant Singh",        role: "TRH", region: "Gujarat",              password: "prashant123"  },
  { id: "u8",  name: "Mayur Sardhara",        role: "TRH", region: "Gujarat",              password: "mayur123"     },
  { id: "u9",  name: "Kamlesh Chavan",        role: "TRH", region: "Gujarat",              password: "kamlesh123"   },
  { id: "u10", name: "Darshak Mehta",         role: "TRH", region: "Gujarat",              password: "darshak123"   },
  { id: "u11", name: "Pankaj Singh",          role: "TRH", region: "Gujarat",              password: "pankaj123"    },
  { id: "u12", name: "Ruturaj Taviyad",       role: "TRH", region: "Gujarat",              password: "ruturaj123"   },
  { id: "u13", name: "Vishal Sengar",         role: "TRH", region: "Gujarat",              password: "vishal123"    },
  { id: "u14", name: "Dhiraj Joshi",          role: "TRH", region: "Gujarat",              password: "dhiraj123"    },
  { id: "u15", name: "Nikhil Verma",          role: "TRH", region: "Gujarat",              password: "nikhil123"    },
];

// Default data always includes all dealers + TRHs from master file
const getDefaultData = () => ({
  users: HARDCODED_USERS,
  dealers: OFFLINE_DEALERS,
  trhs: OFFLINE_TRHS,
  res: [],
  visits: [],
  actions: [],
  categories: DEFAULT_CATS,
  depots: DEPOTS
});

async function tryLogin(name, password) {
  const n = name.trim().toLowerCase();
  const p = password.trim();

  // 1. Check hardcoded users first (works offline)
  const hardcoded = HARDCODED_USERS.find(u =>
    u.name.toLowerCase().includes(n) && u.password === p
  );
  if (hardcoded) return hardcoded;

  // 2. Try Supabase — for any user added via Table Editor or Masters
  if (supabase) {
    try {
      // Case-insensitive name match, exact password match
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .ilike('name', `%${name.trim()}%`)
        .limit(10);

      if (!error && data && data.length > 0) {
        // Find exact password match (case-sensitive)
        const match = data.find(u => u.password === p);
        if (match) return match;
      }
    } catch (e) {
      console.log("Supabase login error:", e.message);
    }
  }

  return null;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem("ubs_user")); } catch { return null; }
  });
  const [activeTab, setActiveTab] = useState("dashboard");
  const [data, setData] = useState(getDefaultData);
  const [loading, setLoading] = useState(true);
  const [supabaseOk, setSupabaseOk] = useState(false);

  const loadAll = useCallback(async () => {
    // Always start with full offline data (all dealers + TRHs available immediately)
    const base = getDefaultData();

    if (!supabase) { setLoading(false); return; }

    try {
      const [dbVisits, dbActions, dbCategories, dbDealers, dbUsers] = await Promise.all([
        db.getVisits(), db.getActions(), db.getCategories(),
        db.getDealers(), db.getUsers()
      ]);

      setData(prev => ({
        ...prev,
        // Use Supabase dealers if available (more complete), else keep offline
        dealers: (dbDealers?.length > 0) ? dbDealers : base.dealers,
        // Merge users — DB users + hardcoded
        users: [...HARDCODED_USERS, ...(dbUsers||[]).filter(u => !HARDCODED_USERS.find(h => h.name.toLowerCase() === u.name.toLowerCase()))],
        visits:     dbVisits     || [],
        actions:    dbActions    || [],
        categories: dbCategories?.length ? dbCategories : DEFAULT_CATS,
      }));
      setSupabaseOk(true);
    } catch (err) {
      console.log("Supabase not available, using offline data:", err.message);
      setSupabaseOk(false);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    if (!supabase || !supabaseOk) return;
    const tables = ['visits','actions','categories','dealers'];
    const subs = tables.map(t =>
      supabase.channel(`rt-${t}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: t }, () => loadAll())
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
        {[0,1,2].map(i => <div key={i} style={{ width:10, height:10, borderRadius:"50%", background:"#e8a020", animation:`bounce 0.8s ${i*0.25}s infinite ease-in-out` }} />)}
      </div>
      <style>{`@keyframes bounce{0%,100%{transform:translateY(0);opacity:0.3}50%{transform:translateY(-8px);opacity:1}}`}</style>
    </div>
  );

  if (!currentUser) return (
    <Login supabaseOk={supabaseOk} onLogin={handleLogin} loginFn={tryLogin} />
  );

  return (
    <AppContext.Provider value={{ data, updateData, currentUser, reload: loadAll, offline: !supabaseOk }}>
      <div className="app-shell">
        <TopBar user={currentUser} onLogout={handleLogout} setTab={setActiveTab} />
        <main className="main-content">
          {activeTab === "dashboard" && <Dashboard setTab={setActiveTab} />}
          {activeTab === "depots"    && <Depots />}
          {activeTab === "actions"   && <Actions />}
          {activeTab === "visit"     && <NewVisit onDone={() => { loadAll(); setActiveTab("actions"); }} />}
          {activeTab === "history"   && <History />}
          {activeTab === "masters"   && <Masters />}
          {activeTab === "export"    && <Export />}
        </main>
        <BottomNav active={activeTab} setActive={setActiveTab} role={currentUser.role} />
      </div>
    </AppContext.Provider>
  );
}
