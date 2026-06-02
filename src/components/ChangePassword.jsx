import { useState } from "react";
import { useApp } from "../context/AppContext";
import { useToast, Toast } from "./Toast";
import { supabase } from "../lib/supabase";

export default function ChangePassword({ onClose }) {
  const { currentUser, data, updateData } = useApp();
  const { toast, showToast } = useToast();
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [saving, setSaving] = useState(false);

  const handleChange = async () => {
    if (!oldPass) return showToast("Enter your current password");
    if (newPass.length < 4) return showToast("New password must be at least 4 characters");
    if (newPass !== confirmPass) return showToast("New passwords do not match");

    // Verify old password
    const user = data.users.find(u => u.id === currentUser.id);
    const oldMatches = user?.password === oldPass;
    // Also check hardcoded
    const HARDCODED = ["admin123","trh123","re123","swapnil123","harkishan123","prashant123",
      "mayur123","kamlesh123","darshak123","pankaj123","ruturaj123","vishal123","dhiraj123","nikhil123"];
    const isHardcoded = HARDCODED.includes(currentUser.password) && currentUser.password === oldPass;

    if (!oldMatches && !isHardcoded) return showToast("Current password is incorrect");

    setSaving(true);
    try {
      // Update in Supabase if connected
      if (supabase) {
        const { error } = await supabase
          .from('users')
          .update({ password: newPass })
          .eq('id', currentUser.id);
        if (error) throw error;
      }
      // Update locally
      const updated = data.users.map(u =>
        u.id === currentUser.id ? { ...u, password: newPass } : u
      );
      updateData("users", updated);
      // Update session
      const sess = JSON.parse(sessionStorage.getItem("ubs_user") || "{}");
      sessionStorage.setItem("ubs_user", JSON.stringify({ ...sess, password: newPass }));
      showToast("✓ Password changed successfully!");
      setTimeout(() => onClose(), 1500);
    } catch (e) {
      showToast("Error: " + e.message);
    }
    setSaving(false);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-handle" />
        <div className="modal-title">Change Password</div>
        <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 16 }}>
          Changing password for <b>{currentUser.name}</b>
        </div>

        <div className="form-group">
          <label className="form-label">Current Password</label>
          <input className="form-input" type="password" placeholder="Enter current password"
            value={oldPass} onChange={e => setOldPass(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">New Password</label>
          <input className="form-input" type="password" placeholder="Min 4 characters"
            value={newPass} onChange={e => setNewPass(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Confirm New Password</label>
          <input className="form-input" type="password" placeholder="Repeat new password"
            value={confirmPass} onChange={e => setConfirmPass(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleChange()} />
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" style={{ flex: 1 }} onClick={handleChange} disabled={saving}>
            {saving ? "Saving…" : "Change Password"}
          </button>
        </div>
        <Toast message={toast} />
      </div>
    </div>
  );
}
