import { useState, useEffect } from "react";
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
import "./App.css";

const STORAGE_KEY = "ubs_fieldos_data_v2"; // bumped version = fresh start on all devices

const defaultData = {
  users: [
    { id: "u1", name: "Rajesh Mehta", role: "ZRH", region: "West (Guj + Mumbai)", password: "admin123" },
    { id: "u2", name: "Naveen Ahuja", role: "ZRH", region: "Gujarat", password: "admin123" },
    { id: "u3", name: "Vikram Shah", role: "TRH", region: "Gujarat North", password: "trh123" },
    { id: "u4", name: "Priya Desai", role: "RE", region: "Ahmedabad", password: "re123" },
  ],
  depots: [
    "Ahmedabad","Mehsana","Palanpur","Kutchh","Junagadh","Surendranagar",
    "Rajkot","Jamnagar","Bharuch","Valsad","Surat","Gandhinagar","Dahod",
    "Anand","Vadodara","Bhavnagar","Greater Mumbai","Thane","Dahanu"
  ],
  dealers: [
    { id: "d1", name: "ABC UBS", code: "GJ-001", depot: "Ahmedabad", city: "Ahmedabad", trhName: "Vikram Shah", reName: "Priya Desai", contact: "9876543210" },
    { id: "d2", name: "Sunrise Hardware", code: "GJ-045", depot: "Rajkot", city: "Rajkot", trhName: "Vikram Shah", reName: "", contact: "9876543211" },
  ],
  visits: [
    {
      id: "v1", dealerId: "d1", date: "2025-05-20", categories: ["Paints","PVC","Displays & Branding"],
      notes: "Dealer interested in Opus branding. PVC category slow moving. Needs display support.",
      createdBy: "u1", depot: "Ahmedabad", photos: []
    }
  ],
  actions: [
    { id: "a1", visitId: "v1", dealerId: "d1", title: "Arrange Opus branding artwork", detail: "Full display kit for paint section", assignedTo: "Vikram Shah", priority: "High", deadline: "2025-05-28", category: "Displays & Branding", status: "Open", remarks: "", createdBy: "u1", depot: "Ahmedabad" },
    { id: "a2", visitId: "v1", dealerId: "d1", title: "Conduct PVC product training", detail: "Schedule half-day training with dealer staff", assignedTo: "Priya Desai", priority: "Medium", deadline: "2025-05-30", category: "PVC", status: "In Progress", remarks: "Date being fixed", createdBy: "u1", depot: "Ahmedabad" },
    { id: "a3", visitId: null, dealerId: "d2", title: "Appoint sanitary distributor", detail: "Identify and onboard distributor for Saurashtra", assignedTo: "Vikram Shah", priority: "High", deadline: "2025-05-25", category: "Sanitary", status: "Open", remarks: "", createdBy: "u1", depot: "Rajkot" },
  ],
  trhs: [
    { id: "t1", name: "Vikram Shah", phone: "9876500001", region: "Gujarat North", depots: ["Ahmedabad","Mehsana","Palanpur","Gandhinagar"] },
    { id: "t2", name: "Suresh Patel", phone: "9876500002", region: "Saurashtra", depots: ["Rajkot","Jamnagar","Bhavnagar","Junagadh","Surendranagar"] },
    { id: "t3", name: "Anita Joshi", phone: "9876500003", region: "South Gujarat", depots: ["Surat","Bharuch","Valsad","Anand","Vadodara"] },
    { id: "t4", name: "Ravi Nair", phone: "9876500004", region: "Mumbai", depots: ["Greater Mumbai","Thane","Dahanu"] },
  ],
  res: [
    { id: "r1", name: "Priya Desai", phone: "9876600001", depot: "Ahmedabad", trhId: "t1" },
    { id: "r2", name: "Mohit Sharma", phone: "9876600002", depot: "Surat", trhId: "t3" },
    { id: "r3", name: "Kavita Rao", phone: "9876600003", depot: "Rajkot", trhId: "t2" },
  ]
};

// Merge saved data with defaults — ensures new default users always exist
function mergeWithDefaults(saved) {
  const merged = { ...defaultData, ...saved };
  // Always ensure default users exist (so demo logins work on any device)
  const savedIds = (saved.users || []).map(u => u.id);
  const missingDefaults = defaultData.users.filter(u => !savedIds.includes(u.id));
  merged.users = [...(saved.users || []), ...missingDefaults];
  return merged;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? mergeWithDefaults(JSON.parse(saved)) : defaultData;
    } catch { return defaultData; }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const updateData = (key, val) => setData(prev => ({ ...prev, [key]: val }));

  if (!currentUser) return <Login users={data.users} onLogin={setCurrentUser} />;

  return (
    <AppContext.Provider value={{ data, updateData, currentUser }}>
      <div className="app-shell">
        <TopBar user={currentUser} onLogout={() => setCurrentUser(null)} activeTab={activeTab} />
        <main className="main-content">
          {activeTab === "dashboard" && <Dashboard setTab={setActiveTab} />}
          {activeTab === "depots" && <Depots />}
          {activeTab === "actions" && <Actions />}
          {activeTab === "visit" && <NewVisit onDone={() => setActiveTab("actions")} />}
          {activeTab === "history" && <History />}
          {activeTab === "masters" && <Masters />}
        </main>
        <BottomNav active={activeTab} setActive={setActiveTab} role={currentUser.role} />
      </div>
    </AppContext.Provider>
  );
}
