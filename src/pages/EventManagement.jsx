import { useEffect, useState, useRef } from "react";
import { getEvents, deleteEvent } from "../api/eventApi";
import { getAllTickets } from "../api/ticketApi";
import { Link, useNavigate } from "react-router-dom";
import { Search, Filter, Calendar, MapPin, Users, Clock, Plus, MoreHorizontal, ChevronDown, Edit, Trash2 } from "lucide-react";

const EventManagement = () => {
  const [events, setEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [loading, setLoading] = useState(true);
  const [eventTicketCounts, setEventTicketCounts] = useState({});
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const navigate = useNavigate();
  const filterRef = useRef(null);
  const sortRef = useRef(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setShowFilterDropdown(false);
      }
      if (sortRef.current && !sortRef.current.contains(event.target)) {
        setShowSortDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const [eventsRes, ticketsRes] = await Promise.all([
        getEvents(),
        getAllTickets()
      ]);
      
      const events = eventsRes.data || [];
      setEvents(events);
      console.log('Events data:', events);
      
      // Calculate actual ticket counts per event
      const ticketCounts = {};
      if (ticketsRes.data) {
        console.log('All tickets data:', ticketsRes.data);
        ticketsRes.data.forEach(ticket => {
          console.log('Processing ticket:', ticket);
          // Handle both populated and non-populated eventId
          let eventId;
          if (typeof ticket.eventId === 'string') {
            eventId = ticket.eventId;
          } else if (ticket.eventId && ticket.eventId._id) {
            eventId = ticket.eventId._id;
          }
          
          if (eventId) {
            console.log('Counting ticket for event:', eventId);
            ticketCounts[eventId] = (ticketCounts[eventId] || 0) + 1;
          }
        });
      }
      
      // Log event IDs for comparison
      events.forEach(event => {
        console.log(`Event "${event.title}" ID: ${event._id}, Calculated tickets: ${ticketCounts[event._id] || 0}`);
      });
      
      console.log('Final ticket counts:', ticketCounts);
      setEventTicketCounts(ticketCounts);
    } catch (err) {
      console.error('Error fetching events:', err);
      setEvents([]);
      setEventTicketCounts({});
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
      try {
        await deleteEvent(id);
        fetchEvents();
        alert("Event deleted successfully!");
      } catch (error) {
        console.error("Error deleting event:", error);
        alert("Failed to delete event. Please try again.");
      }
    }
  };

  const handleEdit = (id) => {
    navigate(`/admin/edit-event/${id}`);
  };

  // Filter events based on search term and status
  const filteredEvents = events.filter(event => {
    // Search filter
    const searchMatch = !searchTerm.trim() || (() => {
      const searchLower = searchTerm.toLowerCase().trim();
      return (
        (event.title && event.title.toLowerCase().includes(searchLower)) ||
        (event.description && event.description.toLowerCase().includes(searchLower)) ||
        (event.location && event.location.toLowerCase().includes(searchLower)) ||
        (event.category && event.category.toLowerCase().includes(searchLower))
      );
    })();

    // Status filter
    const statusMatch = statusFilter === "all" || (() => {
      const now = new Date();
      const eventDate = new Date(event.date);
      const daysDiff = (eventDate - now) / (1000 * 60 * 60 * 24);
      
      switch (statusFilter) {
        case "upcoming":
          return eventDate > now;
        case "pending":
          return daysDiff <= 7 && daysDiff > 0;
        case "closed":
          return eventDate <= now;
        default:
          return true;
      }
    })();

    return searchMatch && statusMatch;
  });

  // Sort events based on sortBy option
  const sortEvents = (eventsList) => {
    return [...eventsList].sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(a.date) - new Date(b.date);
        case "date-desc":
          return new Date(b.date) - new Date(a.date);
        case "title":
          return (a.title || "").localeCompare(b.title || "");
        case "title-desc":
          return (b.title || "").localeCompare(a.title || "");
        case "price":
          return (a.price || 0) - (b.price || 0);
        case "price-desc":
          return (b.price || 0) - (a.price || 0);
        case "seats":
          return (a.seats || 0) - (b.seats || 0);
        case "seats-desc":
          return (b.seats || 0) - (a.seats || 0);
        default:
          return 0;
      }
    });
  };

  // Categorize events by status
  const categorizeEvents = () => {
    const now = new Date();
    // Mutually exclusive buckets
    const pending = sortEvents(filteredEvents.filter(event => {
      const eventDate = new Date(event.date);
      const daysDiff = (eventDate - now) / (1000 * 60 * 60 * 24);
      return daysDiff > 0 && daysDiff <= 7;
    }));
    const upcoming = sortEvents(filteredEvents.filter(event => {
      const eventDate = new Date(event.date);
      const daysDiff = (eventDate - now) / (1000 * 60 * 60 * 24);
      return daysDiff > 7;
    }));
    const closed = sortEvents(filteredEvents.filter(event => new Date(event.date) <= now));

    return { upcoming, pending, closed };
  };

  const { upcoming, pending, closed } = categorizeEvents();


  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const EventCard = ({ event, index, status }) => (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="text-2xl"></div>
          <div>
            <h3 className="font-semibold text-gray-900">{event.title}</h3>
            <div className="flex items-center space-x-4 mt-1">
              <div className="flex items-center text-sm text-green-600">
                <span className="mr-1">💰</span>
                {event.price}EGP
              </div>
              <div className="flex items-center text-sm text-orange-600">
                <Users className="w-4 h-4 mr-1" />
                {eventTicketCounts[event._id] || 0} Sold
              </div>
              <div className="flex items-center text-sm text-blue-600">
                <Users className="w-4 h-4 mr-1" />
                {event.seats - (eventTicketCounts[event._id] || 0)} Available
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <button 
            onClick={() => handleEdit(event._id)}
            className="p-2 hover:bg-blue-50 rounded-lg transition-colors group"
            title="Edit Event"
          >
            <Edit className="w-4 h-4 text-blue-600 group-hover:text-blue-700" />
          </button>
          <button 
            onClick={() => handleDelete(event._id)}
            className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
            title="Delete Event"
          >
            <Trash2 className="w-4 h-4 text-red-600 group-hover:text-red-700" />
          </button>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <MapPin className="w-4 h-4 mr-2" />
          Venue: {event.venue}
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="w-4 h-4 mr-2" />
          Date: {new Date(event.date).toLocaleDateString()}
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Clock className="w-4 h-4 mr-2" />
          Time: {formatTime(event.date)}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
            status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {status === 'upcoming' ? 'Upcoming' :
             status === 'pending' ? 'Pending' : 'Closed'}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => navigate(`/admin/events/${event._id}`)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-semibold text-gray-900">Event Management Section</h1>
        </div>
      </div>

      {/* Controls */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => navigate("/admin/add-event")}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>New Event</span>
            </button>
            <button 
              onClick={() => navigate("/admin/attendee-insights")}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <span>Attendee Insights</span>
              
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative" ref={filterRef}>
              <button 
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Filter className="w-4 h-4" />
                <span>Filter</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {showFilterDropdown && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  <div className="p-2">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Filter by Status</div>
                    {[
                      { value: "all", label: "All Events" },
                      { value: "upcoming", label: "Upcoming" },
                      { value: "pending", label: "Pending (7 days)" },
                      { value: "closed", label: "Closed" }
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setStatusFilter(option.value);
                          setShowFilterDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                          statusFilter === option.value
                            ? "bg-purple-100 text-purple-700"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="relative">
              {!searchTerm && <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />}
              <input
                type="text"
                placeholder="       Search events..."
                className={`${searchTerm ? 'pl-4' : 'pl-10'} ${searchTerm ? 'pr-10' : 'pr-4'} py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200`}
                style={{ 
                  '--tw-placeholder-opacity': '1',
                  'color': '#374151'
                }}
                onFocus={(e) => {
                  e.target.style.setProperty('--tw-placeholder-opacity', '0.6');
                }}
                onBlur={(e) => {
                  e.target.style.setProperty('--tw-placeholder-opacity', '1');
                }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setSearchTerm("");
                  }
                }}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            <div className="relative" ref={sortRef}>
              <button 
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <span>Sort By</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {showSortDropdown && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  <div className="p-2">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Sort by</div>
                    {[
                      { value: "date", label: "Date (Earliest First)" },
                      { value: "date-desc", label: "Date (Latest First)" },
                      { value: "title", label: "Title (A-Z)" },
                      { value: "title-desc", label: "Title (Z-A)" },
                      { value: "price", label: "Price (Low to High)" },
                      { value: "price-desc", label: "Price (High to Low)" },
                      { value: "seats", label: "Seats (Few to Many)" },
                      { value: "seats-desc", label: "Seats (Many to Few)" }
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSortBy(option.value);
                          setShowSortDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                          sortBy === option.value
                            ? "bg-purple-100 text-purple-700"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center space-x-8 mb-8">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm font-medium text-black">Up-Coming Events</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-black">Pending Events</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-sm font-medium text-black">Closed Events</span>
          </div>
        </div>

        {/* Search Results Info */}
        {searchTerm && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              {filteredEvents.length === 0 
                ? `No events found for "${searchTerm}"`
                : `Found ${filteredEvents.length} event${filteredEvents.length === 1 ? '' : 's'} for "${searchTerm}"`
              }
            </p>
          </div>
        )}

        {/* Events Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Calendar className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? "No events match your search" : "No events found"}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm ? "Try adjusting your search terms or clear the search to see all events." : "Get started by creating your first event."}
            </p>
            <button 
              onClick={() => navigate("/admin/add-event")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors mx-auto"
            >
              <Plus className="w-5 h-5" />
              <span>Create Your First Event</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Upcoming Events */}
            {upcoming.map((event, index) => (
              <EventCard key={event._id} event={event} index={index} status="upcoming" />
            ))}
            
            {/* Pending Events */}
            {pending.map((event, index) => (
              <EventCard key={event._id} event={event} index={index + upcoming.length} status="pending" />
            ))}
            
            {/* Closed Events */}
            {closed.map((event, index) => (
              <EventCard key={event._id} event={event} index={index + upcoming.length + pending.length} status="closed" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventManagement;
