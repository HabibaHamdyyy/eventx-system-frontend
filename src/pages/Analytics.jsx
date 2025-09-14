import React, { useEffect, useState } from "react";
import { getEvents } from "../api/eventApi";
import { getAllTickets, getBookedSeatsForEvent } from "../api/ticketApi";
import { 
  TrendingUp, 
  TrendingDown,
  Users, 
  Ticket, 
  DollarSign, 
  Download, 
  Calendar,
  MapPin,
  BarChart3,
  PieChart,
  Filter,
  RefreshCw
} from "lucide-react";

const Analytics = () => {
  const [events, setEvents] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [eventTicketCounts, setEventTicketCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("all");

  useEffect(() => {
    fetchData();
  }, []);

  const getDateThreshold = () => {
    if (dateRange === "30") return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    if (dateRange === "90") return new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    if (dateRange === "365") return new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    return null; // "all"
  };

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

      // Apply date range filter to events
      const threshold = getDateThreshold();
      const filteredEvents = threshold
        ? eventsData.filter(e => {
            const d = new Date(e.date);
            return d >= threshold;
          })
        : eventsData;

      setEvents(filteredEvents);

      // Fetch accurate ticket counts for each event
      const ticketCounts = {};
      await Promise.all(
        filteredEvents.map(async (event) => {
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

      const ticketsData = Array.isArray(ticketsRes?.data)
        ? ticketsRes.data
        : (Array.isArray(ticketsRes) ? ticketsRes : []);
      setTickets(ticketsData);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Refetch when dateRange changes
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  // Calculate key metrics using accurate ticket counts
  const getKeyMetrics = () => {
    // Calculate total revenue using accurate ticket counts
    const totalRevenue = events.reduce((sum, event) => {
      const ticketsSold = eventTicketCounts[event._id] || 0;
      return sum + (ticketsSold * event.price);
    }, 0);

    // Calculate total tickets sold using accurate counts
    const totalTicketsSold = Object.values(eventTicketCounts).reduce((sum, count) => sum + count, 0);
    
    const totalAttendees = totalTicketsSold; // Each ticket represents one attendee
    const totalEvents = events.length;

    // Calculate average metrics
    const avgRevenuePerEvent = totalEvents > 0 ? totalRevenue / totalEvents : 0;
    const avgTicketsPerEvent = totalEvents > 0 ? totalTicketsSold / totalEvents : 0;
    const avgTicketPrice = totalTicketsSold > 0 ? totalRevenue / totalTicketsSold : 0;

    return {
      totalRevenue,
      totalAttendees,
      totalTicketsSold,
      totalEvents,
      avgRevenuePerEvent,
      avgTicketsPerEvent,
      avgTicketPrice
    };
  };

  // Event Performance Analytics
  const getEventPerformanceAnalytics = () => {
    const eventAnalytics = events.map(event => {
      const ticketsSold = eventTicketCounts[event._id] || 0;
      const occupancyRate = event.seats > 0 ? (ticketsSold / event.seats) * 100 : 0;
      const revenue = ticketsSold * event.price;
      const eventDate = new Date(event.date);
      const now = new Date();
      const isUpcoming = eventDate > now;
      const isPast = eventDate < now;
      
      return {
        ...event,
        ticketsSold,
        occupancyRate,
        revenue,
        isUpcoming,
        isPast,
        performance: occupancyRate >= 80 ? 'excellent' : occupancyRate >= 60 ? 'good' : occupancyRate >= 40 ? 'average' : 'poor'
      };
    });

    const topPerformers = eventAnalytics
      .filter(e => e.isPast)
      .sort((a, b) => b.occupancyRate - a.occupancyRate)
      .slice(0, 5);

    const underPerformers = eventAnalytics
      .filter(e => e.isUpcoming && e.occupancyRate < 50)
      .sort((a, b) => a.occupancyRate - b.occupancyRate)
      .slice(0, 5);

    return { eventAnalytics, topPerformers, underPerformers };
  };

  // Revenue Trends Analytics
  const getRevenueTrends = () => {
    const monthlyData = {};
    const quarterlyData = {};
    
    events.forEach(event => {
      const eventDate = new Date(event.date);
      const month = eventDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const quarter = `Q${Math.ceil((eventDate.getMonth() + 1) / 3)} ${eventDate.getFullYear()}`;
      const ticketsSold = eventTicketCounts[event._id] || 0;
      const revenue = ticketsSold * event.price;
      
      monthlyData[month] = (monthlyData[month] || 0) + revenue;
      quarterlyData[quarter] = (quarterlyData[quarter] || 0) + revenue;
    });

    const monthlyTrend = Object.entries(monthlyData)
      .map(([period, revenue]) => ({ period, revenue }))
      .sort((a, b) => new Date(a.period) - new Date(b.period));

    const quarterlyTrend = Object.entries(quarterlyData)
      .map(([period, revenue]) => ({ period, revenue }))
      .sort((a, b) => a.period.localeCompare(b.period));

    return { monthlyTrend, quarterlyTrend };
  };

  // Customer Behavior Analytics
  const getCustomerAnalytics = () => {
    const userBookings = {};
    
    tickets.forEach(ticket => {
      if (ticket.userId && ticket.userId._id) {
        const userId = ticket.userId._id;
        userBookings[userId] = (userBookings[userId] || 0) + 1;
      }
    });

    const bookingCounts = Object.values(userBookings);
    const totalCustomers = bookingCounts.length;
    const repeatCustomers = bookingCounts.filter(count => count > 1).length;
    const repeatCustomerRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;
    
    const customerSegments = {
      newCustomers: bookingCounts.filter(count => count === 1).length,
      repeatCustomers: bookingCounts.filter(count => count >= 2 && count <= 4).length,
      loyalCustomers: bookingCounts.filter(count => count >= 5).length
    };

    return {
      totalCustomers,
      repeatCustomers,
      repeatCustomerRate,
      customerSegments,
      avgBookingsPerCustomer: totalCustomers > 0 ? tickets.length / totalCustomers : 0
    };
  };

  // Capacity Utilization Analytics
  const getCapacityAnalytics = () => {
    const totalCapacity = events.reduce((sum, event) => sum + event.seats, 0);
    const totalSold = Object.values(eventTicketCounts).reduce((sum, count) => sum + count, 0);
    const overallUtilization = totalCapacity > 0 ? (totalSold / totalCapacity) * 100 : 0;

    const utilizationByEvent = events.map(event => {
      const sold = eventTicketCounts[event._id] || 0;
      const utilization = event.seats > 0 ? (sold / event.seats) * 100 : 0;
      return {
        eventTitle: event.title,
        capacity: event.seats,
        sold,
        utilization,
        available: event.seats - sold
      };
    }).sort((a, b) => b.utilization - a.utilization);

    return {
      overallUtilization,
      totalCapacity,
      totalSold,
      utilizationByEvent
    };
  };


  // Export to CSV
  const exportToCSV = () => {
    const metrics = getKeyMetrics();
    const eventPerformanceData = getEventPerformanceAnalytics();
    const revenueData = getRevenueTrends();
    const customerData = getCustomerAnalytics();
    const capacityData = getCapacityAnalytics();

    let csvContent = "EventX Analytics Report\n";
    csvContent += `Generated on: ${new Date().toLocaleDateString()}\n\n`;
    
    // Key Metrics
    csvContent += "Key Metrics\n";
    csvContent += "Metric,Value\n";
    csvContent += `Total Revenue,"${metrics.totalRevenue.toLocaleString()} EGP"\n`;
    csvContent += `Total Customers,${customerData.totalCustomers || 0}\n`;
    csvContent += `Tickets Sold,${metrics.totalTicketsSold || 0}\n`;
    csvContent += `Total Events,${metrics.totalEvents || 0}\n`;
    csvContent += `Capacity Utilization,"${capacityData.overallUtilization.toFixed(1)}%"\n`;
    csvContent += `Average Revenue per Event,"${metrics.avgRevenuePerEvent.toLocaleString()} EGP"\n`;
    csvContent += `Average Tickets per Event,${metrics.avgTicketsPerEvent.toFixed(1)}\n`;
    csvContent += `Repeat Customer Rate,"${customerData.repeatCustomerRate.toFixed(1)}%"\n\n`;

    // Top Performing Events
    csvContent += "Top Performing Events\n";
    csvContent += "Event Title,Occupancy Rate,Revenue,Tickets Sold,Event Date\n";
    if (eventPerformanceData.topPerformers && eventPerformanceData.topPerformers.length > 0) {
      eventPerformanceData.topPerformers.forEach(event => {
        const eventDate = new Date(event.date).toLocaleDateString();
        csvContent += `"${event.title}","${event.occupancyRate.toFixed(1)}%","${event.revenue.toLocaleString()} EGP",${event.ticketsSold},"${eventDate}"\n`;
      });
    } else {
      csvContent += "No completed events available\n";
    }
    csvContent += "\n";

    // Events Needing Attention
    csvContent += "Events Needing Attention\n";
    csvContent += "Event Title,Occupancy Rate,Tickets Sold,Total Capacity,Event Date\n";
    if (eventPerformanceData.underPerformers && eventPerformanceData.underPerformers.length > 0) {
      eventPerformanceData.underPerformers.forEach(event => {
        const eventDate = new Date(event.date).toLocaleDateString();
        csvContent += `"${event.title}","${event.occupancyRate.toFixed(1)}%",${event.ticketsSold},${event.seats},"${eventDate}"\n`;
      });
    } else {
      csvContent += "All upcoming events performing well\n";
    }
    csvContent += "\n";

    // Customer Segmentation
    csvContent += "Customer Segmentation\n";
    csvContent += "Segment,Count,Percentage\n";
    const totalCustomers = customerData.totalCustomers || 1;
    csvContent += `New Customers,${customerData.customerSegments.newCustomers},"${((customerData.customerSegments.newCustomers / totalCustomers) * 100).toFixed(1)}%"\n`;
    csvContent += `Repeat Customers,${customerData.customerSegments.repeatCustomers},"${((customerData.customerSegments.repeatCustomers / totalCustomers) * 100).toFixed(1)}%"\n`;
    csvContent += `Loyal Customers,${customerData.customerSegments.loyalCustomers},"${((customerData.customerSegments.loyalCustomers / totalCustomers) * 100).toFixed(1)}%"\n\n`;

    // Monthly Revenue Trends
    csvContent += "Monthly Revenue Trends\n";
    csvContent += "Month,Revenue\n";
    if (revenueData.monthlyTrend && revenueData.monthlyTrend.length > 0) {
      revenueData.monthlyTrend.forEach(item => {
        csvContent += `"${item.period}","${item.revenue.toLocaleString()} EGP"\n`;
      });
    } else {
      csvContent += "No monthly revenue data available\n";
    }
    csvContent += "\n";

    // Capacity Utilization by Event
    csvContent += "Capacity Utilization by Event\n";
    csvContent += "Event Title,Capacity,Sold,Available,Utilization Rate\n";
    if (capacityData.utilizationByEvent && capacityData.utilizationByEvent.length > 0) {
      capacityData.utilizationByEvent.slice(0, 10).forEach(event => {
        csvContent += `"${event.eventTitle}",${event.capacity},${event.sold},${event.available},"${event.utilization.toFixed(1)}%"\n`;
      });
    } else {
      csvContent += "No capacity data available\n";
    }

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `eventx-analytics-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const metrics = getKeyMetrics();
  const eventPerformance = getEventPerformanceAnalytics();
  const revenueTrends = getRevenueTrends();
  const customerAnalytics = getCustomerAnalytics();
  const capacityAnalytics = getCapacityAnalytics();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics & Reports</h1>
          <p className="text-gray-200">Comprehensive insights into your events and attendees</p>
        </div>
        <div className="flex items-center space-x-3">
          <select 
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-800 text-gray-200 appearance-none"
            style={{ backgroundColor: '#111827', color: '#f9fafb' }}
          >
            <option value="all">All Time</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="365">Last Year</option>
          </select>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Enhanced Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-3xl font-bold text-green-600">{metrics.totalRevenue.toLocaleString()} EGP</p>
              <p className="text-sm text-gray-500 mt-1">Avg: {metrics.avgRevenuePerEvent.toLocaleString()} EGP/event</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Customers</p>
              <p className="text-3xl font-bold text-blue-600">{customerAnalytics.totalCustomers}</p>
              <p className="text-sm text-blue-600 mt-1">{customerAnalytics.repeatCustomerRate.toFixed(1)}% repeat customers</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tickets Sold</p>
              <p className="text-3xl font-bold text-purple-600">{metrics.totalTicketsSold}</p>
              <p className="text-sm text-gray-500 mt-1">Avg: {metrics.avgTicketsPerEvent.toFixed(1)} tickets/event</p>
            </div>
            <Ticket className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Capacity Utilization</p>
              <p className="text-3xl font-bold text-orange-600">{capacityAnalytics.overallUtilization.toFixed(1)}%</p>
              <p className="text-sm text-gray-500 mt-1">{capacityAnalytics.totalSold} / {capacityAnalytics.totalCapacity} seats</p>
            </div>
            <BarChart3 className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Event Performance Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Events */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Top Performing Events</h3>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          
          <div className="space-y-4">
            {eventPerformance.topPerformers.length > 0 ? (
              eventPerformance.topPerformers.map((event, index) => (
                <div key={event._id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{event.title}</p>
                      <p className="text-xs text-gray-500">{event.occupancyRate.toFixed(1)}% occupied</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-green-600">
                      {event.revenue.toLocaleString()} EGP
                    </div>
                    <div className="text-xs text-gray-500">
                      {event.ticketsSold} tickets
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No completed events yet</p>
            )}
          </div>
        </div>

        {/* Events Needing Attention */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Events Needing Attention</h3>
            <TrendingDown className="w-5 h-5 text-red-500" />
          </div>
          
          <div className="space-y-4">
            {eventPerformance.underPerformers.length > 0 ? (
              eventPerformance.underPerformers.map((event, index) => (
                <div key={event._id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      !
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{event.title}</p>
                      <p className="text-xs text-gray-500">{event.occupancyRate.toFixed(1)}% occupied</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-red-600">
                      {event.ticketsSold} / {event.seats}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(event.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">All upcoming events performing well!</p>
            )}
          </div>
        </div>
      </div>

      {/* Revenue Trends */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Revenue Trends</h3>
          <BarChart3 className="w-5 h-5 text-gray-400" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Monthly Revenue */}
          <div>
            <h4 className="text-md font-medium text-gray-700 mb-4">Monthly Revenue</h4>
            {revenueTrends.monthlyTrend.length > 0 ? (
              <div className="space-y-3">
                {revenueTrends.monthlyTrend.slice(-6).map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">{item.period}</span>
                    <div className="flex items-center space-x-3">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ 
                            width: `${(item.revenue / Math.max(...revenueTrends.monthlyTrend.map(d => d.revenue))) * 100}%` 
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 w-20 text-right">
                        {item.revenue.toLocaleString()} EGP
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No revenue data available</p>
            )}
          </div>

          {/* Quarterly Revenue */}
          <div>
            <h4 className="text-md font-medium text-gray-700 mb-4">Quarterly Revenue</h4>
            {revenueTrends.quarterlyTrend.length > 0 ? (
              <div className="space-y-3">
                {revenueTrends.quarterlyTrend.slice(-4).map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">{item.period}</span>
                    <div className="flex items-center space-x-3">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full"
                          style={{ 
                            width: `${(item.revenue / Math.max(...revenueTrends.quarterlyTrend.map(d => d.revenue))) * 100}%` 
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 w-20 text-right">
                        {item.revenue.toLocaleString()} EGP
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No quarterly data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Customer Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Segmentation */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Customer Segmentation</h3>
            <Users className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">New Customers</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {customerAnalytics.customerSegments.newCustomers}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">Repeat Customers</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {customerAnalytics.customerSegments.repeatCustomers}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">Loyal Customers (5+ bookings)</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {customerAnalytics.customerSegments.loyalCustomers}
              </span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {customerAnalytics.avgBookingsPerCustomer.toFixed(1)}
              </div>
              <div className="text-sm text-gray-500">Average bookings per customer</div>
            </div>
          </div>
        </div>

        {/* Capacity Utilization by Event */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Capacity Utilization</h3>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {capacityAnalytics.utilizationByEvent.slice(0, 8).map((event, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1 min-w-0 mr-3">
                  <p className="text-sm font-medium text-gray-900 truncate">{event.eventTitle}</p>
                  <p className="text-xs text-gray-500">{event.sold} / {event.capacity} seats</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        event.utilization >= 80 ? 'bg-green-500' :
                        event.utilization >= 60 ? 'bg-yellow-500' :
                        event.utilization >= 40 ? 'bg-orange-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(event.utilization, 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-medium text-gray-600 w-10 text-right">
                    {event.utilization.toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>


      {/* Revenue Trends */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Revenue Trends</h3>
          <TrendingUp className="w-5 h-5 text-gray-400" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">{(metrics.totalRevenue / metrics.totalEvents).toFixed(0)} EGP</div>
            <div className="text-sm text-gray-600">Avg Revenue per Event</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">{(metrics.totalRevenue / metrics.totalAttendees).toFixed(0)} EGP</div>
            <div className="text-sm text-gray-600">Avg Revenue per Attendee</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">{((metrics.totalAttendees / events.reduce((sum, e) => sum + e.seats, 0)) * 100).toFixed(1)}%</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
