import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getFavorites } from "../api/userApi";
import { Calendar, MapPin, Users, Clock, Heart, Eye } from "lucide-react";

const Favorites = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const res = await getFavorites();
      setFavorites(res.data.favorites || []);
    } catch (err) {
      console.error('Error fetching favorites:', err);
      setError("Failed to load favorite events");
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const EventCard = ({ event }) => {
    const now = new Date();
    const eventDate = new Date(event.date);
    const isUpcoming = eventDate > now;
    const isPending = isUpcoming && (eventDate - now) / (1000 * 60 * 60 * 24) <= 7;
    const isClosed = eventDate <= now;
    
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
                  {event.seats - event.availableSeats} booked
                </div>
                <div className="flex items-center text-sm text-blue-600">
                  <Users className="w-4 h-4 mr-1" />
                  {event.availableSeats} available
                </div>
              </div>
            </div>
          </div>
          <div className="p-2 bg-red-100 rounded-full">
            <Heart className="w-5 h-5 fill-red-500 text-red-500" />
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
              onClick={() => navigate(`/events/${event._id}`)}
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
          <p className="text-gray-600">Loading favorite events...</p>
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
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-semibold text-gray-900">My Favorite Events</h1>
          <p className="text-gray-600">Events you've marked as favorites</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {favorites.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center border border-gray-200">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Heart className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No favorite events yet</h3>
            <p className="text-gray-600 mb-6">You haven't added any events to your favorites list.</p>
            <Link 
              to="/events" 
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Browse Events
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((event, index) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;