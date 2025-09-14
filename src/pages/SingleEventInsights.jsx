import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getEventById } from "../api/eventApi";
import { getAllTickets, getBookedSeatsForEvent } from "../api/ticketApi";
import { ArrowLeft, Users, TrendingUp, Share2, Heart, MessageCircle, Eye, Calendar, MapPin, Clock } from "lucide-react";

const SingleEventInsights = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [eventRes, ticketsRes, bookedSeatsRes] = await Promise.all([
        getEventById(id),
        getAllTickets(),
        getBookedSeatsForEvent(id)
      ]);

      setEvent(eventRes?.data || null);

      // Prefer accurate booked seats endpoint (returns array of seat numbers)
      let eventTickets = Array.isArray(bookedSeatsRes?.data) ? bookedSeatsRes.data : [];

      // Fallback: derive from all tickets if booked seats not available
      if (eventTickets.length === 0 && Array.isArray(ticketsRes?.data)) {
        const allTickets = ticketsRes.data;
        eventTickets = allTickets
          .filter(t => {
            // Handle both string and populated object for eventId
            if (typeof t.eventId === 'string') return t.eventId === id;
            if (t.eventId && t.eventId._id) return t.eventId._id === id;
            return false;
          })
          .map(t => t.seatNumber)
          .filter(n => typeof n === 'number');
      }

      setTickets(eventTickets);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSocialMetrics = () => {
    const baseMetrics = {
      facebook: { likes: 245, shares: 89, comments: 156 },
      instagram: { likes: 892, shares: 234, comments: 67 },
      twitter: { likes: 445, retweets: 123, comments: 89 },
      linkedin: { likes: 156, shares: 45, comments: 23 }
    };

    // Scale metrics based on actual ticket sales
    const scaleFactor = tickets.length > 0 ? Math.max(0.5, tickets.length / 50) : 1;
    
    Object.keys(baseMetrics).forEach(platform => {
      Object.keys(baseMetrics[platform]).forEach(metric => {
        baseMetrics[platform][metric] = Math.floor(baseMetrics[platform][metric] * scaleFactor);
      });
    });

    return baseMetrics;
  };

  const getEngagementData = () => {
    const totalSeats = event?.seats || 0;
    const soldTickets = Array.isArray(tickets) ? tickets.length : 0;
    const availableSeats = Math.max(totalSeats - soldTickets, 0);
    
    return {
      soldTickets,
      availableSeats,
      occupancyRate: totalSeats > 0 ? ((soldTickets / totalSeats) * 100).toFixed(1) : 0,
      revenue: soldTickets * (event?.price || 0),
      // Keep placeholders for now; can be connected to real feedback endpoints later
      avgRating: 4.2,
      satisfaction: 87
    };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!event) {
    return <div className="text-center p-8">Event not found</div>;
  }

  const socialMetrics = getSocialMetrics();
  const engagement = getEngagementData();

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
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Event Attendee Insights</h1>
              <p className="text-sm text-gray-600">{event.title}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Event Info Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-4xl">🎵</div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{event.title}</h2>
                <div className="flex items-center space-x-6 mt-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(event.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{new Date(event.date).toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      hour12: true 
                    })}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4" />
                    <span>{event.venue}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">{event.price} EGP</div>
              <div className="text-sm text-gray-600">Ticket Price</div>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tickets Sold</p>
                <p className="text-3xl font-bold text-gray-900">{engagement.soldTickets}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Occupancy Rate</p>
                <p className="text-3xl font-bold text-gray-900">{engagement.occupancyRate}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Revenue</p>
                <p className="text-3xl font-bold text-gray-900">{engagement.revenue.toLocaleString()}</p>
              </div>
              <div className="text-green-600 text-2xl">💰</div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Satisfaction</p>
                <p className="text-3xl font-bold text-gray-900">{engagement.satisfaction}%</p>
              </div>
              <div className="text-yellow-500 text-2xl">⭐</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Social Media Analytics */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Social Media Analytics</h3>
              <Share2 className="w-5 h-5 text-gray-400" />
            </div>

            <div className="space-y-6">
              {/* Facebook */}
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">f</div>
                  <div>
                    <p className="font-medium text-gray-900">Facebook</p>
                    <p className="text-sm text-gray-600">Social engagement</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-1">
                      <Heart className="w-4 h-4 text-red-500" />
                      <span>{socialMetrics.facebook.likes}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Share2 className="w-4 h-4 text-blue-500" />
                      <span>{socialMetrics.facebook.shares}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MessageCircle className="w-4 h-4 text-green-500" />
                      <span>{socialMetrics.facebook.comments}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Instagram */}
              <div className="flex items-center justify-between p-4 bg-pink-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold">📷</div>
                  <div>
                    <p className="font-medium text-gray-900">Instagram</p>
                    <p className="text-sm text-gray-600">Visual content</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-1">
                      <Heart className="w-4 h-4 text-red-500" />
                      <span>{socialMetrics.instagram.likes}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Share2 className="w-4 h-4 text-blue-500" />
                      <span>{socialMetrics.instagram.shares}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MessageCircle className="w-4 h-4 text-green-500" />
                      <span>{socialMetrics.instagram.comments}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Twitter */}
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-400 rounded-lg flex items-center justify-center text-white font-bold">🐦</div>
                  <div>
                    <p className="font-medium text-gray-900">Twitter</p>
                    <p className="text-sm text-gray-600">Real-time updates</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-1">
                      <Heart className="w-4 h-4 text-red-500" />
                      <span>{socialMetrics.twitter.likes}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Share2 className="w-4 h-4 text-blue-500" />
                      <span>{socialMetrics.twitter.retweets}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MessageCircle className="w-4 h-4 text-green-500" />
                      <span>{socialMetrics.twitter.comments}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* LinkedIn */}
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center text-white font-bold">in</div>
                  <div>
                    <p className="font-medium text-gray-900">LinkedIn</p>
                    <p className="text-sm text-gray-600">Professional network</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-1">
                      <Heart className="w-4 h-4 text-red-500" />
                      <span>{socialMetrics.linkedin.likes}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Share2 className="w-4 h-4 text-blue-500" />
                      <span>{socialMetrics.linkedin.shares}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MessageCircle className="w-4 h-4 text-green-500" />
                      <span>{socialMetrics.linkedin.comments}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Attendance Analytics */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Attendance Analytics</h3>
              <Users className="w-5 h-5 text-gray-400" />
            </div>

            {/* Seat Visualization */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-700">Seat Occupancy</span>
                <span className="text-sm text-gray-600">{engagement.soldTickets}/{event.seats} seats</span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
                <div 
                  className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                  style={{ width: `${engagement.occupancyRate}%` }}
                ></div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{engagement.soldTickets}</div>
                  <div className="text-xs text-gray-600">Sold</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-400">{engagement.availableSeats}</div>
                  <div className="text-xs text-gray-600">Available</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{engagement.occupancyRate}%</div>
                  <div className="text-xs text-gray-600">Occupancy</div>
                </div>
              </div>
            </div>

            {/* Rating & Feedback */}
            <div className="border-t pt-6">
              <h4 className="font-medium text-gray-900 mb-4">Event Feedback</h4>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Overall Rating</span>
                  <div className="flex items-center space-x-2">
                    <div className="flex text-yellow-400">
                      {'★'.repeat(Math.floor(engagement.avgRating))}
                      {'☆'.repeat(5 - Math.floor(engagement.avgRating))}
                    </div>
                    <span className="text-sm font-medium">{engagement.avgRating}/5</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Satisfaction Rate</span>
                  <span className="text-sm font-medium text-green-600">{engagement.satisfaction}%</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Would Recommend</span>
                  <span className="text-sm font-medium text-blue-600">78%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="mt-8 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance Overview</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {Object.values(socialMetrics).reduce((acc, platform) => 
                  acc + Object.values(platform).reduce((sum, val) => sum + val, 0), 0
                )}
              </div>
              <div className="text-sm text-gray-600">Total Social Interactions</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">{engagement.revenue.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Revenue Generated (EGP)</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">92%</div>
              <div className="text-sm text-gray-600">Event Success Rate</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleEventInsights;
