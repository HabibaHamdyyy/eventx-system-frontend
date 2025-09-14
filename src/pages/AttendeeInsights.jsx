import React, { useEffect, useState } from "react";
import { getAllTickets } from "../api/ticketApi";
import { getEvents } from "../api/eventApi";
import { ArrowLeft, Users, MapPin, TrendingUp, Calendar, BarChart3, PieChart } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AttendeeInsights = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ticketsRes, eventsRes] = await Promise.all([
        getAllTickets(),
        getEvents()
      ]);
      setTickets(ticketsRes.data || []);
      setEvents(eventsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate demographics data
  const getDemographicsData = () => {
    const ageGroups = {
      '18-25': 0,
      '26-35': 0,
      '36-45': 0,
      '46+': 0
    };

    // Simulate age distribution based on ticket count
    const totalTickets = tickets.length;
    ageGroups['18-25'] = Math.floor(totalTickets * 0.35);
    ageGroups['26-35'] = Math.floor(totalTickets * 0.40);
    ageGroups['36-45'] = Math.floor(totalTickets * 0.20);
    ageGroups['46+'] = totalTickets - ageGroups['18-25'] - ageGroups['26-35'] - ageGroups['36-45'];

    return ageGroups;
  };

  // Calculate location data
  const getLocationData = () => {
    return [
      { city: 'Colombo', count: Math.floor(tickets.length * 0.45), percentage: 45 },
      { city: 'Kandy', count: Math.floor(tickets.length * 0.25), percentage: 25 },
      { city: 'Galle', count: Math.floor(tickets.length * 0.15), percentage: 15 },
      { city: 'Jaffna', count: Math.floor(tickets.length * 0.10), percentage: 10 },
      { city: 'Others', count: Math.floor(tickets.length * 0.05), percentage: 5 }
    ];
  };

  // Calculate engagement metrics (real data)
  const getEngagementData = () => {
    const totalEvents = events.length;
    const totalTickets = tickets.length;
    const avgTicketsPerEvent = totalEvents > 0 ? Number((totalTickets / totalEvents).toFixed(1)) : 0;

    // Unique users and repeat attendees
    const userCounts = new Map();
    tickets.forEach(t => {
      const userId = typeof t.userId === 'object' ? t.userId?._id : t.userId;
      if (!userId) return;
      userCounts.set(userId, (userCounts.get(userId) || 0) + 1);
    });
    const uniqueUsers = userCounts.size;
    const repeatAttendees = Array.from(userCounts.values()).filter(c => c > 1).length;
    const repeatRate = uniqueUsers > 0 ? Math.round((repeatAttendees / uniqueUsers) * 100) : 0;

    // Occupancy rate across all events
    const ticketsPerEvent = new Map();
    tickets.forEach(t => {
      const evId = typeof t.eventId === 'object' ? t.eventId?._id : t.eventId;
      if (!evId) return;
      ticketsPerEvent.set(evId, (ticketsPerEvent.get(evId) || 0) + 1);
    });
    const eventById = new Map(events.map(e => [e._id, e]));
    let totalSeats = 0;
    let totalSold = 0;
    events.forEach(e => {
      const sold = ticketsPerEvent.get(e._id) || 0;
      totalSold += sold;
      totalSeats += e.seats || 0;
    });
    const occupancyRate = totalSeats > 0 ? Math.round((totalSold / totalSeats) * 100) : 0;

    return {
      totalAttendees: totalTickets,
      avgTicketsPerEvent,
      engagementRate: occupancyRate,
      repeatAttendees,
      repeatRate,
      uniqueUsers
    };
  };

  const demographics = getDemographicsData();
  const locations = getLocationData();
  const engagement = getEngagementData();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-2xl font-semibold text-gray-900">All Events Attendee Insights</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Attendees</p>
                <p className="text-3xl font-bold text-gray-900">{engagement.totalAttendees}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg per Event</p>
                <p className="text-3xl font-bold text-gray-900">{engagement.avgTicketsPerEvent}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Engagement Rate</p>
                <p className="text-3xl font-bold text-gray-900">{engagement.engagementRate}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Repeat Attendees</p>
                <p className="text-3xl font-bold text-gray-900">{engagement.repeatAttendees}</p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Events by Attendees */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Top Events by Attendees</h3>
              <Users className="w-5 h-5 text-gray-400" />
            </div>
            {(() => {
              const byEvent = new Map();
              tickets.forEach(t => {
                const evId = typeof t.eventId === 'object' ? t.eventId?._id : t.eventId;
                if (!evId) return;
                byEvent.set(evId, (byEvent.get(evId) || 0) + 1);
              });
              const rows = Array.from(byEvent.entries())
                .map(([id, count]) => {
                  const ev = events.find(e => e._id === id) || {};
                  const capacity = ev.seats || 0;
                  const fill = capacity > 0 ? Math.round((count / capacity) * 100) : 0;
                  const revenue = (ev.price || 0) * count;
                  return { id, title: ev.title || 'Unknown Event', count, fill, revenue };
                })
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);
              return rows.length > 0 ? (
                <div className="space-y-3">
                  {rows.map(row => (
                    <div key={row.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900 text-sm">{row.title}</div>
                        <div className="text-xs text-gray-500">{row.count} attendees • {row.fill}% full</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-green-600">{row.revenue.toLocaleString()} EGP</div>
                        <div className="text-xs text-gray-500">revenue</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500">No attendance data yet</div>
              );
            })()}
          </div>

          {/* Bookings by Weekday */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Bookings by Weekday</h3>
              <Calendar className="w-5 h-5 text-gray-400" />
            </div>
            {(() => {
              const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
              const counts = Array(7).fill(0);
              tickets.forEach(t => {
                const created = new Date(t.createdAt || 0);
                if (!isNaN(created)) counts[created.getDay()] += 1;
              });
              const max = Math.max(1, ...counts);
              return (
                <div className="flex items-end justify-between h-32 space-x-2">
                  {counts.map((c, idx) => (
                    <div key={idx} className="flex flex-col items-center flex-1">
                      <div
                        className="bg-purple-500 rounded-t w-full transition-all duration-300 hover:bg-purple-600"
                        style={{ height: `${(c / max) * 100}%`, minHeight: '6%' }}
                        title={`${days[idx]}: ${c}`}
                      ></div>
                      <span className="text-xs text-gray-600 mt-2">{days[idx]}</span>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
        {/* Engagement Trends */}
        <div className="mt-8 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Engagement Trends</h3>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{engagement.engagementRate}%</div>
              <div className="text-sm text-gray-600">Overall Occupancy</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">{engagement.repeatRate}%</div>
              <div className="text-sm text-gray-600">Repeat Attendees</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">{engagement.avgTicketsPerEvent}</div>
              <div className="text-sm text-gray-600">Avg Tickets per Event</div>
            </div>
          </div>

          {/* Bar Chart - real monthly ticket counts (last 6 months) */}
          <div className="mt-8">
            {(() => {
              const now = new Date();
              const months = Array.from({ length: 6 }).map((_, i) => {
                const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
                return { key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleString('en-US', { month: 'short' }) };
              });
              const counts = months.map(m => {
                const [year, monthIdx] = m.key.split('-').map(Number);
                const start = new Date(year, monthIdx, 1);
                const end = new Date(year, monthIdx + 1, 1);
                const count = tickets.filter(t => {
                  const created = new Date(t.createdAt || t._id?.toString().substring(0,8) * 1000);
                  return created >= start && created < end;
                }).length;
                return { label: m.label, count };
              });
              const max = Math.max(1, ...counts.map(c => c.count));
              return (
                <div className="flex items-end justify-between h-32 space-x-2">
                  {counts.map(({ label, count }) => (
                    <div key={label} className="flex flex-col items-center flex-1">
                      <div
                        className="bg-blue-500 rounded-t w-full transition-all duration-300 hover:bg-blue-600"
                        style={{ height: `${(count / max) * 100}%`, minHeight: '6%' }}
                        title={`${label}: ${count}`}
                      ></div>
                      <span className="text-xs text-gray-600 mt-2">{label}</span>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendeeInsights;
