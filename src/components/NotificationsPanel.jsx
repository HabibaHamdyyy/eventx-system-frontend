import React, { useEffect, useState } from "react";

// Simple polling-based notifications panel
const NotificationsPanel = ({ notifications: initial = [] }) => {
  const [items, setItems] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const id = setInterval(fetchNotifications, 15000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
        <button
          onClick={fetchNotifications}
          className="text-xs px-2 py-1 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>
      {loading && <div className="text-xs text-gray-500 mt-2">Loading...</div>}
      {error && <div className="text-xs text-red-600 mt-2">{error}</div>}
      <ul className="mt-2 space-y-2 max-h-64 overflow-y-auto">
        {items.length === 0 && !loading && (
          <li className="text-gray-600">You're all caught up.</li>
        )}
        {items.map((n, idx) => (
          <li key={idx} className="text-gray-800 text-sm bg-gray-50 p-2 rounded-md border border-gray-100">
            {n.message || String(n)}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NotificationsPanel;


