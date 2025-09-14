import React from "react";

const LatestEvents = ({ events = [] }) => {
  if (!Array.isArray(events) || events.length === 0) {
    return (
      <div className="text-sm text-gray-500">No events available.</div>
    );
  }

  return (
    <div className="space-y-3">
      {events.map((e) => (
        <div key={e._id || e.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{e.title || "Untitled Event"}</p>
            <p className="text-xs text-gray-500 flex items-center space-x-2">
              <span>{e.venue}</span>
              <span>•</span>
              <span>{e.date ? new Date(e.date).toLocaleDateString() : "No date"}</span>
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-indigo-600">{e.price != null ? `${e.price} EGP` : ""}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LatestEvents;


