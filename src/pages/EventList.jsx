import React, { useEffect, useState } from "react";
import { getEvents } from "../api/eventApi";
import { getBookedSeatsForEvent } from "../api/ticketApi";
import { addToFavorites, removeFromFavorites, getFavorites } from "../api/userApi";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Search, Filter, Calendar, MapPin, Users, Clock, ChevronDown, Eye, Heart } from "lucide-react";

const EventList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [events, setEvents] = useState([]);
  const [eventTicketCounts, setEventTicketCounts] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [favorites, setFavorites] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    fetchEvents();
    const token = localStorage.getItem("token");
    if (token) {
      setIsAuthenticated(true);
      fetchFavorites();
    }
    
    // Check for search query in URL
    const searchQuery = searchParams.get('search');
    if (searchQuery) {
      setSearchTerm(searchQuery);
    }
  }, [searchParams]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await getEvents();
      const eventsData = Array.isArray(res?.data)
        ? res.data
        : (Array.isArray(res) ? res : []);
      // De-duplicate by _id in case backend returns duplicates
      const uniqueEvents = Array.from(new Map((eventsData || []).map(e => [e._id, e])).values());
      setEvents(uniqueEvents);
      
      // Fetch actual ticket counts for each event
      const ticketCounts = {};
      await Promise.all(
        (uniqueEvents || []).map(async (event) => {
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
    } catch (err) {
      console.error('Error fetching events:', err);
      setError("Failed to load events");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      const res = await getFavorites();
      setFavorites(res.data.favorites.map(fav => fav._id));
    } catch (err) {
      console.error('Error fetching favorites:', err);
      // Don't set error state here to avoid blocking the UI
    }
  };

  const handleToggleFavorite = async (eventId, e) => {
    e.stopPropagation(); // Prevent event bubbling to parent (card click)
    
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      if (favorites.includes(eventId)) {
        await removeFromFavorites(eventId);
        setFavorites(favorites.filter(id => id !== eventId));
      } else {
        await addToFavorites(eventId);
        setFavorites([...favorites, eventId]);
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  // Categorize events by status
  const categorizeEvents = () => {
    const now = new Date();
    const upcoming = events.filter(event => new Date(event.date) > now);
    const pending = events.filter(event => {
      const eventDate = new Date(event.date);
      const daysDiff = (eventDate - now) / (1000 * 60 * 60 * 24);
      return daysDiff <= 7 && daysDiff > 0;
    });
    const closed = events.filter(event => new Date(event.date) <= now);

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

  // Filter events based on search and status
  const getFilteredEvents = () => {
    let filtered = events;
    
    // Apply status filter
    if (statusFilter === 'upcoming') filtered = upcoming;
    else if (statusFilter === 'pending') filtered = pending;
    else if (statusFilter === 'closed') filtered = closed;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.venue.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'date') return new Date(a.date) - new Date(b.date);
      if (sortBy === 'price') return a.price - b.price;
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      return 0;
    });
    
    return filtered;
  };

  const filteredEvents = getFilteredEvents();

  const EventCard = ({ event, index }) => {
    const now = new Date();
    const eventDate = new Date(event.date);
    const isUpcoming = eventDate > now;
    const isPending = isUpcoming && (eventDate - now) / (1000 * 60 * 60 * 24) <= 7;
    const isClosed = eventDate <= now;
    const isFavorite = favorites.includes(event._id);
    
    let status = 'upcoming';
    if (isClosed) status = 'closed';
    else if (isPending) status = 'pending';

    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">🎉</div>
            <div>
              <h3 className="font-semibold text-gray-900">{event.title}</h3>
              <div className="flex items-center space-x-4 mt-1">
                <div className="flex items-center text-sm text-green-600">
                  <span className="mr-1">💰</span>
                  {event.price} EGP
                </div>
                <div className="flex items-center text-sm text-orange-600">
                  <Users className="w-4 h-4 mr-1" />
                  {eventTicketCounts[event._id] || 0} booked
                </div>
                <div className="flex items-center text-sm text-blue-600">
                  <Users className="w-4 h-4 mr-1" />
                  {event.seats - (eventTicketCounts[event._id] || 0)} available
                </div>
              </div>
            </div>
          </div>
          <button 
            onClick={(e) => handleToggleFavorite(event._id, e)}
            className={`p-2 rounded-full transition-colors ${isFavorite ? 'bg-red-100' : 'bg-gray-100 hover:bg-red-50'}`}
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
          </button>
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
              onClick={() => {
                console.log('View Details clicked, navigating to:', `/events/${event._id}`);
                navigate(`/events/${event._id}`);
              }}
              className="inline-flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4 mr-1" />
              View Details
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading events...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900">Browse Events</h1>
          <p className="text-sm md:text-base text-gray-600">Discover and book tickets for amazing events</p>
        </div>
      </div>

      {/* Controls */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-gray-500">
              <Filter className="w-4 h-4 text-gray-700" />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Events</option>
                <option value="upcoming">Upcoming</option>
                <option value="pending">Pending</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2 text-gray-500">
              <span className="text-sm text-gray-600">Sort By:</span>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="date">Date</option>
                <option value="price">Price</option>
                <option value="title">Title</option>
              </select>
            </div>
          </div>

          <div className="relative text-gray-500">
            {!searchTerm && <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />}
            <input
              type="text"
              placeholder={searchTerm ? "Search events..." : "       Search events..."}
              className={`${searchTerm ? 'pl-4' : 'pl-10'} pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Events</p>
                <p className="text-2xl font-semibold text-gray-900">{events.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Upcoming</p>
                <p className="text-2xl font-semibold text-gray-900">{upcoming.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-semibold text-gray-900">{pending.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <Calendar className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Closed</p>
                <p className="text-2xl font-semibold text-gray-900">{closed.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Events Grid */}
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event, index) => (
              <EventCard key={event._id} event={event} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventList;
