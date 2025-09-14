import React, { useEffect, useMemo, useState } from "react";
import { getAllTickets } from "../api/ticketApi";
import { Search, Filter, Users, Ticket, Calendar, MapPin, QrCode, ArrowUpDown } from "lucide-react";

const AdminTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await getAllTickets();
        setTickets(res.data);
      } catch (err) {
        console.error("Error fetching tickets:", err);
      }
    };
    fetchTickets();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let data = [...tickets];
    if (q) {
      data = data.filter(t => {
        const user = t.userId?.name || "";
        const email = t.userId?.email || "";
        const event = t.eventId?.title || "";
        const seat = String(t.seatNumber || "");
        return [user, email, event, seat].some(v => v.toLowerCase().includes(q));
      });
    }
    const dir = sortDir === "asc" ? 1 : -1;
    data.sort((a, b) => {
      const av = sortKey === "createdAt" ? new Date(a.createdAt || 0).getTime() : (a[sortKey] ?? 0);
      const bv = sortKey === "createdAt" ? new Date(b.createdAt || 0).getTime() : (b[sortKey] ?? 0);
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
    return data;
  }, [tickets, query, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Booking & Tickets</h2>
          <p className="text-sm text-gray-500">Manage all bookings, search, and analyze ticket sales.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              placeholder="Search by user, email, event, seat..."
              className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm w-72 bg-white"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500">Total Tickets</div>
              <div className="text-xl font-bold text-gray-900">{tickets.length}</div>
            </div>
            <Ticket className="w-5 h-5 text-indigo-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500">Unique Buyers</div>
              <div className="text-xl font-bold text-gray-900">{new Set(tickets.map(t => t.userId?._id || t.userId)).size}</div>
            </div>
            <Users className="w-5 h-5 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500">Events Covered</div>
              <div className="text-xl font-bold text-gray-900">{new Set(tickets.map(t => t.eventId?._id || t.eventId)).size}</div>
            </div>
            <Calendar className="w-5 h-5 text-orange-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500">Estimated Revenue</div>
              <div className="text-xl font-bold text-gray-900">
                {tickets.reduce((sum, t) => sum + (t.eventId?.price || 0), 0).toLocaleString()} EGP
              </div>
            </div>
            <MapPin className="w-5 h-5 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-3 py-2 text-left whitespace-nowrap">User</th>
                <th className="px-3 py-2 text-left whitespace-nowrap">Email</th>
                <th className="px-3 py-2 text-left whitespace-nowrap">Event</th>
                <th className="px-3 py-2 text-left whitespace-nowrap">Seat</th>
                <th className="px-3 py-2 text-left cursor-pointer" onClick={() => toggleSort("createdAt")}>
                  <div className="inline-flex items-center gap-1">Booked At <ArrowUpDown className="w-4 h-4" /></div>
                </th>
                <th className="px-3 py-2 text-left whitespace-nowrap">QR</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t._id} className="border-t">
                  <td className="px-3 py-2">{t.userId?.name || "User"}</td>
                  <td className="px-3 py-2 text-gray-500">{t.userId?.email || "-"}</td>
                  <td className="px-3 py-2">{t.eventId?.title || "-"}</td>
                  <td className="px-3 py-2">{t.seatNumber}</td>
                  <td className="px-3 py-2 text-gray-500">{new Date(t.createdAt || 0).toLocaleString()}</td>
                  <td className="px-3 py-2">
                    <img src={t.qrCode} alt="QR" className="w-12 h-12 border rounded" />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td className="px-3 py-6 text-center text-gray-500" colSpan={6}>No tickets match your filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminTickets;
