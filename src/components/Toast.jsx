import { useState, useCallback } from "react";

export function useToast() {
  const [toast, setToast] = useState(null);
  const showToast = useCallback((msg, duration = 2500) => {
    setToast(msg);
    setTimeout(() => setToast(null), duration);
  }, []);
  return { toast, showToast };
}

export function Toast({ message }) {
  if (!message) return null;
  return <div className="toast">{message}</div>;
}
