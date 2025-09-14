import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getEvents } from "../api/eventApi";
import { getMyTickets, getMostBookedEvents, getBookedSeatsForEvent } from "../api/ticketApi";
import { getFavorites } from "../api/userApi";
import { Calendar, Ticket, TrendingUp, Users, Clock, MapPin, DollarSign, Heart, BarChart } from "lucide-react";

export default function UserDashboard() {
  const navigate = useNavigate();
  const [userStats, setUserStats] = useState({
    myTickets: 0,
    availableEvents: 0,
    totalSpent: 0,
    favoriteEvents: 0
  });
  const [recentTickets, setRecentTickets] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [mostBookedEvents, setMostBookedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Debug: Check if user is authenticated
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      const userRole = localStorage.getItem('role');
      console.log('Auth debug:', { token: !!token, userId, userRole });
      
      if (!token) {
        setError('No authentication token found. Please log in again.');
        setLoading(false);
        return;
      }
      
      // Fetch most booked events for analytics
      try {
        console.log('Attempting to fetch most booked events...');
        const mostBookedResponse = await getMostBookedEvents();
        console.log('Most booked events response:', mostBookedResponse);
        const mostBookedData = Array.isArray(mostBookedResponse?.data) ? mostBookedResponse.data : [];
        setMostBookedEvents(mostBookedData);
      } catch (analyticsError) {
        console.error('Error fetching most booked events:', analyticsError);
        // Don't set error state here to avoid blocking the whole dashboard
      }
      
      // Fetch user's tickets
      let tickets = [];
      try {
        console.log('Attempting to fetch tickets...');
        const ticketsResponse = await getMyTickets();
        console.log('Tickets response:', ticketsResponse);
        tickets = Array.isArray(ticketsResponse?.data) ? ticketsResponse.data : [];
        console.log('Processed tickets:', tickets);
        
        // Filter out any tickets with invalid event data
        tickets = tickets.filter(ticket => 
          ticket.eventId && 
          ticket.eventId._id && 
          ticket.eventId.title && 
          ticket.eventId.date
        );
        console.log('Valid tickets after frontend filtering:', tickets.length);
      } catch (ticketError) {
        console.error('Error fetching tickets:', ticketError);
        if (ticketError.response) {
          console.error('Response status:', ticketError.response.status);
          console.error('Response data:', ticketError.response.data);
        } else if (ticketError.request) {
          console.error('No response received:', ticketError.request);
        } else {
          console.error('Error setting up request:', ticketError.message);
        }
        tickets = [];
      }
      setRecentTickets(tickets.slice(0, 3));

      // Fetch all events
      let events = [];
      try {
        console.log('Attempting to fetch events...');
        const eventsResponse = await getEvents();
        console.log('Events response:', eventsResponse);
        events = Array.isArray(eventsResponse?.data) ? eventsResponse.data : [];
        console.log('Processed events:', events);
      } catch (eventError) {
        console.error('Error fetching events:', eventError);
        if (eventError.response) {
          console.error('Response status:', eventError.response.status);
          console.error('Response data:', eventError.response.data);
        } else if (eventError.request) {
          console.error('No response received:', eventError.request);
        } else {
          console.error('Error setting up request:', eventError.message);
        }
        events = [];
      }
      const upcoming = events.filter(event => 
        new Date(event.date) > new Date()
      ).slice(0, 4);
      
      setUpcomingEvents(upcoming);
      
      // Calculate available events (upcoming events with available seats)
      let availableEventsCount = 0;
      await Promise.all(
        events.map(async (event) => {
          if (new Date(event.date) > new Date()) {
            try {
              const bookedSeatsRes = await getBookedSeatsForEvent(event._id);
              const bookedSeats = bookedSeatsRes?.data?.length || 0;
              if (bookedSeats < event.seats) {
                availableEventsCount++;
              }
            } catch (err) {
              console.error(`Error checking availability for event ${event._id}:`, err);
              // If we can't check, assume it's available
              availableEventsCount++;
            }
          }
        })
      );
      
      // Calculate stats
      const totalSpent = tickets.reduce((sum, ticket) => sum + (ticket.eventId?.price || 0), 0);
      
      // Fetch favorites count
      let favoritesCount = 0;
      try {
        const favoritesResponse = await getFavorites();
        favoritesCount = favoritesResponse?.data?.favorites?.length || 0;
        console.log('Favorites count:', favoritesCount);
      } catch (favoritesError) {
        console.error('Error fetching favorites:', favoritesError);
      }
      
      setUserStats({
        myTickets: tickets.length,
        availableEvents: availableEventsCount,
        totalSpent: totalSpent,
        favoriteEvents: favoritesCount
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <h4 className="text-lg font-semibold text-slate-900 mb-2">Something went wrong</h4>
        <p className="text-slate-600 mb-6">{error}</p>
        <button
          onClick={fetchUserData}
          className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-all duration-200"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome to EventX Studio!</h1>
        <p className="text-slate-600">Discover and book amazing events happening around you.</p>
      </div>

      {/* Event Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">My Tickets</p>
              <p className="text-2xl md:text-3xl font-bold text-slate-900">{userStats.myTickets}</p>
            </div>
            <div className="p-2 md:p-3 bg-blue-100 rounded-xl">
              <Ticket className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Available Events</p>
              <p className="text-2xl md:text-3xl font-bold text-slate-900">{userStats.availableEvents}</p>
            </div>
            <div className="p-2 md:p-3 bg-purple-100 rounded-xl">
              <Calendar className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Spent</p>
              <p className="text-2xl md:text-3xl font-bold text-slate-900">{userStats.totalSpent.toLocaleString()} EGP</p>
            </div>
            <div className="p-2 md:p-3 bg-green-100 rounded-xl">
              <DollarSign className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Favorite Events</p>
              <p className="text-2xl md:text-3xl font-bold text-slate-900">{userStats.favoriteEvents}</p>
            </div>
            <div className="p-2 md:p-3 bg-rose-100 rounded-xl">
              <Heart className="w-5 h-5 md:w-6 md:h-6 text-rose-600" />
            </div>
          </div>
        </div>
      </div>

      {/* My Tickets Section */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">My Tickets</h2>
          <Link 
            to="/user/my-tickets" 
            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            View All →
          </Link>
        </div>
        
        {recentTickets.length > 0 ? (
          <div className="space-y-4">
            {recentTickets.map((ticket) => {
              // Skip tickets with invalid event data
              if (!ticket.eventId || !ticket.eventId.title || !ticket.eventId.date) {
                return null;
              }
              
              return (
                <div key={ticket._id} className="flex items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {ticket.eventId.title.charAt(0)}
                    </span>
                  </div>
                  <div className="ml-4 flex-1">
                    <h4 className="font-semibold text-slate-900">{ticket.eventId.title}</h4>
                    <p className="text-sm text-slate-600">Seat: {ticket.seatNumber}</p>
                    <p className="text-sm text-slate-500 flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {new Date(ticket.eventId.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">{ticket.eventId.price} EGP</p>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Confirmed
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Ticket className="w-8 h-8 text-slate-400" />
            </div>
            <h4 className="text-lg font-semibold text-slate-900 mb-2">No tickets yet</h4>
            <p className="text-slate-600 mb-6">Start by booking your first event</p>
            <Link
              to="/events"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg"
            >
              Browse Events
            </Link>
          </div>
        )}
      </div>

      {/* Analytics - Most Booked Events */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">Most Popular Events</h2>
          <div className="p-2 bg-indigo-100 rounded-lg">
            <BarChart className="w-5 h-5 text-indigo-600" />
          </div>
        </div>
        
        {mostBookedEvents.length > 0 ? (
          <div className="space-y-4">
            {mostBookedEvents.map((event) => (
              <div key={event.eventId} className="flex items-center p-4 bg-slate-50 rounded-xl border border-slate-100 hover:shadow-md transition-all duration-200">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {event.title.charAt(0)}
                  </span>
                </div>
                <div className="ml-4 flex-1">
                  <h4 className="font-semibold text-slate-900">{event.title}</h4>
                  <p className="text-sm text-slate-600">
                    <span className="flex items-center">
                      <MapPin className="w-3 h-3 mr-1" />
                      {event.venue}
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-bold text-indigo-600">{event.bookingCount} bookings</div>
                  <p className="text-sm text-slate-500">{event.price} EGP</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BarChart className="w-8 h-8 text-slate-400" />
            </div>
            <h4 className="text-lg font-semibold text-slate-900 mb-2">No analytics available</h4>
            <p className="text-slate-600">Book more events to see trends</p>
          </div>
        )}
      </div>
      
      {/* Upcoming Events Section */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">Upcoming Events</h2>
          <Link 
            to="/events" 
            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            View All →
          </Link>
        </div>
        
        {upcomingEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingEvents.map((event) => (
              <div key={event._id} className="border border-slate-200 rounded-xl p-4 hover:shadow-lg transition-all duration-200">
                <h4 className="font-bold text-slate-900 mb-2">{event.title}</h4>
                <p className="text-sm text-slate-600 mb-3 line-clamp-2">{event.description}</p>
                <div className="flex items-center justify-between text-sm mb-4">
                  <span className="text-slate-500 flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {new Date(event.date).toLocaleDateString()}
                  </span>
                  <span className="font-bold text-blue-600">{event.price} EGP</span>
                </div>
                <button
                  onClick={() => {
                    console.log('Book Now clicked, navigating to event details:', `/events/${event._id}`);
                    navigate(`/events/${event._id}`);
                  }}
                  className="block w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transform hover:scale-[1.02] transition-all duration-200"
                >
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Book Now
                  </div>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-slate-400" />
            </div>
            <h4 className="text-lg font-semibold text-slate-900 mb-2">No upcoming events</h4>
            <p className="text-slate-600 mb-6">Check back later for new events</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Quick Actions</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/user/my-tickets"
            className="flex items-center p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors group"
          >
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Ticket className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <h4 className="font-semibold text-slate-900">My Tickets</h4>
              <p className="text-sm text-slate-600">View your bookings</p>
            </div>
          </Link>

          <Link
            to="/events"
            className="flex items-center p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors group"
          >
            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <h4 className="font-semibold text-slate-900">Browse Events</h4>
              <p className="text-sm text-slate-600">Discover new events</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
