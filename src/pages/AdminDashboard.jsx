import React, { useEffect, useState } from "react";
import LatestEvents from "../components/LatestEvents";
import Charts from "../components/Charts";
import { useNavigate } from "react-router-dom";
import { getEvents } from "../api/eventApi";
import { getAllTickets, getBookedSeatsForEvent } from "../api/ticketApi";
import { Search, Bell, User, Filter, ChevronRight, Calendar, MapPin, Users, TrendingUp, TrendingDown, Target, Clock, Star, AlertCircle, DollarSign, BarChart3 } from "lucide-react";

const AdminDashboard = () => {
  const [events, setEvents] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [eventTicketCounts, setEventTicketCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const userName = localStorage.getItem("userName");
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [eventsRes, ticketsRes] = await Promise.all([
        getEvents(),
        getAllTickets()
      ]);
      
      // Normalize events response to an array
      const eventsData = Array.isArray(eventsRes?.data)
        ? eventsRes.data
        : (Array.isArray(eventsRes) ? eventsRes : []);

      if (eventsData.length > 0) {
        setEvents(eventsData);
        
        // Fetch accurate ticket counts for each event
        const ticketCounts = {};
        await Promise.all(
          eventsData.map(async (event) => {
            try {
              const bookedSeatsRes = await getBookedSeatsForEvent(event._id);
              ticketCounts[event._id] = bookedSeatsRes?.data?.length || 0;
            } catch (err) {
              console.error(`Error fetching tickets for event ${event._id}:`, err);
              ticketCounts[event._id] = 0;
            }
          })
        );
        setEventTicketCounts(ticketCounts);
      }
      if (Array.isArray(ticketsRes?.data)) setTickets(ticketsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Enhanced Analytics Calculations using accurate ticket counts
  const totalSeatsSold = Object.values(eventTicketCounts).reduce((sum, count) => sum + count, 0);
  
  const totalRevenue = events.reduce((sum, event) => {
    const ticketsSold = eventTicketCounts[event._id] || 0;
    return sum + (ticketsSold * event.price);
  }, 0);

  const totalBookings = totalSeatsSold;
  const totalEvents = events.length;

  // Event Status Analytics
  const now = new Date();
  const upcomingEvents = events.filter(event => new Date(event.date) > now);
  const ongoingEvents = events.filter(event => {
    const eventDate = new Date(event.date);
    const eventEndDate = new Date(eventDate.getTime() + 24 * 60 * 60 * 1000); // Assume 1 day duration
    return eventDate <= now && now <= eventEndDate;
  });
  const completedEvents = events.filter(event => {
    const eventDate = new Date(event.date);
    const eventEndDate = new Date(eventDate.getTime() + 24 * 60 * 60 * 1000);
    return now > eventEndDate;
  });

  // Revenue Analytics
  const averageTicketPrice = totalBookings > 0 ? totalRevenue / totalBookings : 0;
  const revenueTarget = 500000; 
  const revenueProgress = (totalRevenue / revenueTarget) * 100;

  // Real User Analytics (based on actual ticket data) - only count users with "User" role
  const uniqueUserIds = [...new Set(
    tickets
      .filter(ticket => ticket.userId && (ticket.userId.role === "User" || ticket.userId.role === "user"))
      .map(ticket => ticket.userId._id)
  )];
  const uniqueUsers = uniqueUserIds.length;
  const totalTicketHolders = uniqueUsers;

  // Event Performance Analytics using accurate ticket counts
  const eventPerformance = events.map(event => {
    const ticketsSold = eventTicketCounts[event._id] || 0;
    const occupancyRate = event.seats > 0 ? (ticketsSold / event.seats) * 100 : 0;
    
    return {
      ...event,
      ticketsSold,
      occupancyRate,
      revenue: ticketsSold * event.price
    };
  }).sort((a, b) => b.ticketsSold - a.ticketsSold);

  const bestSellingEvent = eventPerformance[0];
  const leastPopularEvent = eventPerformance[eventPerformance.length - 1];

  // Real Event Analytics using accurate ticket counts
  const averageEventCapacity = events.length > 0 ? events.reduce((sum, event) => sum + event.seats, 0) / events.length : 0;
  const totalSeatsAvailable = events.reduce((sum, event) => sum + event.seats, 0);
  const overallOccupancyRate = totalSeatsAvailable > 0 ? (totalSeatsSold / totalSeatsAvailable) * 100 : 0;

  // Real monthly revenue data (based on event dates) using accurate ticket counts
  const monthlyRevenue = events.reduce((acc, event) => {
    const eventMonth = new Date(event.date).toLocaleDateString('en-US', { month: 'short' });
    const ticketsSold = eventTicketCounts[event._id] || 0;
    const eventRevenue = ticketsSold * event.price;
    
    if (!acc[eventMonth]) {
      acc[eventMonth] = 0;
    }
    acc[eventMonth] += eventRevenue;
    return acc;
  }, {});

  const salesData = Object.entries(monthlyRevenue).map(([month, value]) => ({
    month,
    value,
    percentage: totalRevenue > 0 ? ((value / totalRevenue) * 100).toFixed(1) + '%' : '0%'
  }));

  const maxSales = Math.max(...salesData.map(d => d.value));

  // Customer engagement based on actual events
  const engagementData = events.slice(0, 5).map((event, index) => ({
    name: `Event: ${String.fromCharCode(65 + index)}`,
    value: event.seats - event.availableSeats,
    color: ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'][index],
    percentage: ((event.seats - event.availableSeats) / event.seats * 100).toFixed(1)
  }));

  // Upcoming events for display
  const upcomingEventsDisplay = upcomingEvents
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 4);

  // Generate seat grid for latest event using accurate ticket counts
  const generateSeatGrid = () => {
    const latestEvent = events[0];
    if (!latestEvent) return [];
    
    const totalSeats = 100; 
    const actualTicketsSold = eventTicketCounts[latestEvent._id] || 0;
    const actualOccupancyRate = latestEvent.seats > 0 ? actualTicketsSold / latestEvent.seats : 0;
    
    // Calculate seats based on actual booking data
    const paidSeats = Math.floor(totalSeats * actualOccupancyRate);
    const reservedSeats = Math.floor(totalSeats * 0.15); 
    const availableSeats = totalSeats - paidSeats - reservedSeats;
    
    const seats = [];
    for (let i = 0; i < totalSeats; i++) {
      if (i < paidSeats) {
        seats.push('paid');
      } else if (i < paidSeats + reservedSeats) {
        seats.push('reserved');
      } else {
        seats.push('available');
      }
    }
    return seats;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full">
      {/* Main Content - Responsive Layout */}
      <div className="h-full px-4 md:px-6 py-4 md:py-6 bg-gray-50 min-h-screen">
        {/* Enhanced Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 lg:mb-8">
          {/* Total Events Card */}
          <div className="bg-white rounded-xl p-4 md:p-6 shadow-md h-full">
            <div className="flex items-center justify-between h-full">
              <div className="flex-1">
                <p className="text-sm text-gray-500 uppercase tracking-wide">TOTAL EVENTS</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900 mt-1">{totalEvents}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {upcomingEvents.length} upcoming • {ongoingEvents.length} ongoing
                </p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 ml-4">
                <Calendar className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Revenue Card */}
          <div className="bg-white rounded-xl p-4 md:p-6 shadow-md h-full">
            <div className="flex items-center justify-between h-full">
              <div className="flex-1">
                <p className="text-sm text-gray-500 uppercase tracking-wide">TOTAL REVENUE</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900 mt-1">{totalRevenue.toLocaleString()} EGP</p>
                <p className="text-xs text-green-600 mt-2">
                  {revenueProgress.toFixed(1)}% of target
                </p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0 ml-4">
                <DollarSign className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Bookings Card */}
          <div className="bg-white rounded-xl p-4 md:p-6 shadow-md h-full">
            <div className="flex items-center justify-between h-full">
              <div className="flex-1">
                <p className="text-sm text-gray-500 uppercase tracking-wide">TOTAL BOOKINGS</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900 mt-1">{totalBookings.toLocaleString()}</p>
                <p className="text-xs text-gray-400 mt-2">
                  Avg: {averageTicketPrice.toLocaleString()} EGP/ticket
                </p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0 ml-4">
                <Users className="w-5 h-5 md:w-6 md:h-6 text-orange-600" />
              </div>
            </div>
          </div>

          {/* Occupancy Rate Card */}
          <div className="bg-white rounded-xl p-4 md:p-6 shadow-md h-full">
            <div className="flex items-center justify-between h-full">
              <div className="flex-1">
                <p className="text-sm text-gray-500 uppercase tracking-wide">OCCUPANCY RATE</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900 mt-1">{overallOccupancyRate.toFixed(1)}%</p>
                <p className="text-xs text-gray-400 mt-2">
                  {totalSeatsSold} / {totalSeatsAvailable} seats sold
                </p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0 ml-4">
                <BarChart3 className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-12 items-start mb-8">
          {/* Left Column - Main Analytics */}
          <div className="lg:col-span-2 space-y-8 min-h-0">
            {/* Event Status Overview */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Event Status Overview</h3>
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-3 relative">
                    <div className="w-full h-full rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-2xl font-bold text-blue-600">{upcomingEvents.length}</span>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-900">Upcoming</p>
                  <p className="text-xs text-gray-500">{((upcomingEvents.length / totalEvents) * 100).toFixed(1)}%</p>
                </div>
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-3 relative">
                    <div className="w-full h-full rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-2xl font-bold text-green-600">{ongoingEvents.length}</span>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-900">Ongoing</p>
                  <p className="text-xs text-gray-500">{((ongoingEvents.length / totalEvents) * 100).toFixed(1)}%</p>
                </div>
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-3 relative">
                    <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-2xl font-bold text-gray-600">{completedEvents.length}</span>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-900">Completed</p>
                  <p className="text-xs text-gray-500">{((completedEvents.length / totalEvents) * 100).toFixed(1)}%</p>
                </div>
              </div>
            </div>

            {/* Revenue Analytics */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Revenue Analytics</h3>
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">Target: {revenueTarget.toLocaleString()} EGP</span>
                </div>
              </div>
              
              {/* Revenue Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Revenue Progress</span>
                  <span className="text-sm text-gray-500">{revenueProgress.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(revenueProgress, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Monthly Revenue Chart */}
              {salesData.length > 0 ? (
                <div className="h-48 flex items-end space-x-2">
                  {salesData.map((item, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div 
                        className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t transition-all duration-300 hover:from-blue-600 hover:to-blue-500"
                        style={{ 
                          height: `${(item.value / maxSales) * 160}px`,
                          minHeight: '20px'
                        }}
                      ></div>
                      <div className="mt-2 text-xs text-gray-600">{item.month}</div>
                      <div className="text-xs text-gray-500">{item.percentage}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-32 flex items-center justify-center bg-gray-50 rounded-lg">
                  <p className="text-gray-500 text-sm">No revenue data available</p>
                </div>
              )}
            </div>

            {/* Real Event Capacity Analysis */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Event Capacity Analysis</h3>
              
              {/* Overall Statistics */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">{totalSeatsAvailable.toLocaleString()}</div>
                  <div className="text-xs text-gray-600">Total Seats</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-lg font-bold text-green-600">{totalSeatsSold.toLocaleString()}</div>
                  <div className="text-xs text-gray-600">Seats Sold</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-lg font-bold text-gray-600">{Math.round(averageEventCapacity).toLocaleString()}</div>
                  <div className="text-xs text-gray-600">Avg Capacity</div>
                </div>
              </div>

              {/* Occupancy Progress Bar */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Overall Occupancy Rate</span>
                  <span className="text-sm text-gray-500">{overallOccupancyRate.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div 
                    className="bg-gradient-to-r from-blue-400 to-blue-600 h-4 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(overallOccupancyRate, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Event Performance Analytics */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Event Performance</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Best Selling Event */}
                {bestSellingEvent && (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center mb-2">
                      <Star className="w-5 h-5 text-green-600 mr-2" />
                      <h4 className="font-medium text-green-800">Best Selling Event</h4>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{bestSellingEvent.title}</p>
                    <div className="mt-2 space-y-1 text-xs text-gray-600">
                      <p>Tickets Sold: <span className="font-medium">{bestSellingEvent.ticketsSold}</span></p>
                      <p>Occupancy: <span className="font-medium">{bestSellingEvent.occupancyRate.toFixed(1)}%</span></p>
                      <p>Revenue: <span className="font-medium">{bestSellingEvent.revenue.toLocaleString()} EGP</span></p>
                    </div>
                  </div>
                )}

                {/* Least Popular Event */}
                {leastPopularEvent && (
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center mb-2">
                      <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                      <h4 className="font-medium text-red-800">Needs Attention</h4>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{leastPopularEvent.title}</p>
                    <div className="mt-2 space-y-1 text-xs text-gray-600">
                      <p>Tickets Sold: <span className="font-medium">{leastPopularEvent.ticketsSold}</span></p>
                      <p>Occupancy: <span className="font-medium">{leastPopularEvent.occupancyRate.toFixed(1)}%</span></p>
                      <p>Revenue: <span className="font-medium">{leastPopularEvent.revenue.toLocaleString()} EGP</span></p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Latest Event Analytics */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Latest Event Analytics</h3>
              {events[0] && (
                <div>
                  <div className="mb-6">
                    <p className="font-medium text-gray-700">Event Name</p>
                    <p className="text-blue-600 font-semibold text-lg">{events[0].title}</p>
                    <p className="text-sm text-gray-500 mt-1">Event Date</p>
                    <p className="text-sm font-medium">{new Date(events[0].date).toLocaleDateString()}</p>
                  </div>

                  {/* Event Statistics */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{eventTicketCounts[events[0]._id] || 0}</div>
                      <div className="text-xs text-gray-600">Tickets Sold</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {events[0].seats > 0 ? ((eventTicketCounts[events[0]._id] || 0) / events[0].seats * 100).toFixed(1) : 0}%
                      </div>
                      <div className="text-xs text-gray-600">Occupancy Rate</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{events[0].seats}</div>
                      <div className="text-xs text-gray-600">Total Capacity</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {((eventTicketCounts[events[0]._id] || 0) * events[0].price).toLocaleString()} EGP
                      </div>
                      <div className="text-xs text-gray-600">Revenue</div>
                    </div>
                  </div>
                  
                  {/* Seat Occupancy Visualization */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-3">Seat Occupancy Overview</p>
                    
                    {/* Visual Progress Bars */}
                    <div className="space-y-3 mb-4">
                      {/* Sold Seats */}
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-medium text-purple-700">Sold Seats</span>
                          <span className="text-xs text-gray-600">{eventTicketCounts[events[0]._id] || 0} seats</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${events[0].seats > 0 ? ((eventTicketCounts[events[0]._id] || 0) / events[0].seats) * 100 : 0}%` 
                            }}
                          ></div>
                        </div>
                      </div>

                      {/* Available Seats */}
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-medium text-gray-700">Available Seats</span>
                          <span className="text-xs text-gray-600">{events[0].seats - (eventTicketCounts[events[0]._id] || 0)} seats</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gray-400 h-2 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${events[0].seats > 0 ? ((events[0].seats - (eventTicketCounts[events[0]._id] || 0)) / events[0].seats) * 100 : 0}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Occupancy Rate Circle */}
                    <div className="flex items-center justify-center mb-4">
                      <div className="relative w-24 h-24">
                        <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                          {/* Background circle */}
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#e5e7eb"
                            strokeWidth="2"
                          />
                          {/* Progress circle */}
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#7c3aed"
                            strokeWidth="2"
                            strokeDasharray={`${events[0].seats > 0 ? ((eventTicketCounts[events[0]._id] || 0) / events[0].seats) * 100 : 0}, 100`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-lg font-bold text-purple-600">
                              {events[0].seats > 0 ? Math.round(((eventTicketCounts[events[0]._id] || 0) / events[0].seats) * 100) : 0}%
                            </div>
                            <div className="text-xs text-gray-500">Occupied</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Summary Stats */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-purple-50 rounded-lg p-2">
                        <div className="text-sm font-bold text-purple-600">{eventTicketCounts[events[0]._id] || 0}</div>
                        <div className="text-xs text-gray-600">Sold</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2">
                        <div className="text-sm font-bold text-gray-600">{events[0].seats - (eventTicketCounts[events[0]._id] || 0)}</div>
                        <div className="text-xs text-gray-600">Available</div>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-2">
                        <div className="text-sm font-bold text-blue-600">{events[0].seats}</div>
                        <div className="text-xs text-gray-600">Total</div>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Sales Progress</span>
                      <span className="text-sm text-gray-500">
                        {eventTicketCounts[events[0]._id] || 0} / {events[0].seats} seats
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-purple-400 to-purple-600 h-3 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${events[0].seats > 0 ? Math.min(((eventTicketCounts[events[0]._id] || 0) / events[0].seats) * 100, 100) : 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Real User & Event Analytics */}
          <div className="space-y-8 min-h-0 lg:ml-8">
            {/* Latest Events */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Latest Events</h3>
              <LatestEvents events={events.slice(0, 5)} />
            </div>
            {/* Real User Metrics */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">User Analytics</h3>
              
              {/* Real User Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{uniqueUsers}</div>
                  <div className="text-xs text-gray-600">Unique Users</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{totalBookings}</div>
                  <div className="text-xs text-gray-600">Total Bookings</div>
                </div>
              </div>

              {/* Booking per User */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Average Bookings per User</span>
                    <span className="text-sm text-gray-500">{uniqueUsers > 0 ? (totalBookings / uniqueUsers).toFixed(1) : 0}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${Math.min((totalBookings / uniqueUsers / 5) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Real Monthly Revenue Breakdown */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Monthly Revenue Distribution</h3>
              
              <div className="space-y-4">
                {salesData.map((month, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-4 h-4 rounded-full mr-3 bg-blue-500" />
                      <span className="text-sm font-medium text-gray-700">{month.month}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900">
                        {month.value.toLocaleString()} EGP
                      </div>
                      <div className="text-xs text-gray-500">
                        {month.percentage}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Monthly Revenue Chart */}
              {salesData.length > 0 ? (
                <div className="mt-6">
                  <div className="space-y-2">
                    {salesData.map((month, index) => {
                      const maxValue = Math.max(...salesData.map(d => d.value));
                      const percentage = maxValue > 0 ? (month.value / maxValue) * 100 : 0;
                      const minWidth = 8; // Minimum width percentage for visibility
                      const barWidth = Math.max(percentage, minWidth);
                      
                      return (
                        <div key={index} className="flex items-center space-x-3">
                          <div className="w-12 text-xs font-medium text-gray-600 flex-shrink-0">
                            {month.month}
                          </div>
                          <div className="flex-1 bg-gray-200 rounded-full h-3 relative">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300 hover:from-blue-600 hover:to-blue-700"
                              style={{ width: `${barWidth}%` }}
                              title={`${month.month}: ${month.value.toLocaleString()} EGP (${month.percentage})`}
                            />
                          </div>
                          <div className="w-20 text-xs text-right text-gray-600 flex-shrink-0">
                            {month.value.toLocaleString()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="mt-6 h-16 flex items-center justify-center bg-gray-50 rounded-lg">
                  <p className="text-gray-500 text-sm">No monthly data available</p>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => navigate("/admin/add-event")}
                  className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Create New Event</span>
                </button>
                <button 
                  onClick={() => navigate("/admin/analytics")}
                  className="w-full flex items-center justify-center space-x-2 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>View Full Analytics</span>
                </button>
                <button 
                  onClick={() => navigate("/admin/events")}
                  className="w-full flex items-center justify-center space-x-2 bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Users className="w-4 h-4" />
                  <span>Manage Events</span>
                </button>
              </div>
            </div>

            {/* Top Performing Events */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Performing Events</h3>
              
              <div className="space-y-4">
                {eventPerformance.slice(0, 5).map((event, index) => (
                  <div key={event._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{event.title}</p>
                        <p className="text-xs text-gray-500">
                          {event.ticketsSold} tickets • {event.occupancyRate.toFixed(1)}% full
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900">
                        {event.revenue.toLocaleString()} EGP
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
