import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getEventById } from "../api/eventApi";
import { getMyTickets, getBookedSeatsForEvent, bookTicket } from "../api/ticketApi";
import { addToFavorites, removeFromFavorites, getFavorites } from "../api/userApi";
import { ArrowLeft, Calendar, MapPin, Clock, Users, Tag, Eye, Edit2, Copy, Ticket, TrendingUp, Heart } from "lucide-react";
import QRCode from "react-qr-code";

const EventDetails = () => {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [seatInputValue, setSeatInputValue] = useState('');
  const [seatInputError, setSeatInputError] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const userRole = localStorage.getItem('role');
  const isAuthenticated = !!localStorage.getItem('token');

  const handleBookTickets = async () => {

    if (selectedSeats.length === 0) {
      setBookingError("Please select at least one seat");
      return;
    }

    setBookingLoading(true);
    setBookingError("");
    setBookingSuccess(false);

    try {
      // Book each selected seat
      const bookingPromises = selectedSeats.map(seatNumber => 
        bookTicket(event._id, seatNumber)
      );

      await Promise.all(bookingPromises);
      
      // Clear selected seats after successful booking
      setSelectedSeats([]);
      setBookingSuccess(true);
      
      // Navigate to My Tickets page after successful booking
      navigate('/user/my-tickets');
      
      // Refresh event data to update available seats
      const updatedEventRes = await getEventById(id);
      if (updatedEventRes.data) {
        setEvent(updatedEventRes.data);
      }
      
      // Refresh booked seats
      const bookedSeatsRes = await getBookedSeatsForEvent(id);
      if (bookedSeatsRes?.data) {
        setTickets(bookedSeatsRes.data);
      }
    } catch (err) {
      console.error("Error booking tickets:", err);
      console.error("Error response:", err.response?.data);
      console.error("Error status:", err.response?.status);
      setBookingError(err.response?.data?.message || "Failed to book tickets. Please try again.");
    } finally {
      setBookingLoading(false);
    }
  };

  useEffect(() => {
    console.log('EventDetails component loaded with id:', id);
    const fetchData = async () => {
      try {
        console.log('Fetching event data for id:', id);
        // Fetch event data
        const eventRes = await getEventById(id);
        
        if (eventRes.data) {
          console.log('Event data received:', eventRes.data);
          setEvent(eventRes.data);
          
          // Check if event is in favorites
          if (isAuthenticated) {
            try {
              const favRes = await getFavorites();
              const favoriteIds = favRes.data.favorites.map(fav => fav._id);
              setIsFavorite(favoriteIds.includes(id));
            } catch (favError) {
              console.error("Error fetching favorites:", favError);
            }
          }
          
          // Get booked seats for this event
           try {
             const bookedSeatsRes = await getBookedSeatsForEvent(id);
             if (bookedSeatsRes?.data) {
               console.log('Booked seats data received:', bookedSeatsRes.data);
               // This will give us accurate ticket counts for the event
               // Store the booked seats as an array of numbers
               setTickets(bookedSeatsRes.data);
             }
           } catch (bookedSeatsError) {
             console.error("Error fetching booked seats:", bookedSeatsError);
           }
        } else {
          console.log('No event data received:', eventRes);
          setError("Event not found");
          setLoading(false);
          return;
        }
        
        // Try to fetch tickets - handle both admin and user cases
        try {
          let ticketsRes;
          if (userRole === 'Admin') {
            // For admin users, try to get all tickets
            const { getAllTickets } = await import("../api/ticketApi");
            ticketsRes = await getAllTickets();
          } else {
            // For regular users, get their own tickets
            ticketsRes = await getMyTickets();
          }
          
          // Don't overwrite booked seats data with ticket objects
          // The booked seats data from getBookedSeatsForEvent is more accurate for this event
          // Skip setting tickets from getMyTickets/getAllTickets to avoid overwriting
        } catch (ticketError) {
          console.log("Could not fetch tickets (this is normal for users):", ticketError.message);
          // Only set empty tickets if we haven't already set them from getBookedSeatsForEvent
          if (tickets.length === 0) {
            setTickets([]);
          }
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load event details");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, userRole]);

  const handleSeatClick = (seatNumber) => {
    if (selectedSeats.includes(seatNumber)) {
      setSelectedSeats(selectedSeats.filter(seat => seat !== seatNumber));
    } else {
      setSelectedSeats([...selectedSeats, seatNumber]);
    }
  };

  const handleSeatInputSubmit = () => {
    // Clear previous error
    setSeatInputError('');
    
    // Validate input
    const seatNumber = parseInt(seatInputValue, 10);
    
    if (!seatInputValue || isNaN(seatNumber)) {
      setSeatInputError('Please enter a valid seat number');
      return;
    }
    
    if (seatNumber < 1 || seatNumber > (event?.seats || 0)) {
      setSeatInputError(`Seat number must be between 1 and ${event?.seats || 0}`);
      return;
    }
    
    // Check if seat is already booked
    const bookedSeatNumbers = tickets
      .filter(ticket => ticket.eventId === event._id)
      .map(ticket => ticket.seatNumber);
      
    if (bookedSeatNumbers.includes(seatNumber)) {
      setSeatInputError('This seat is already booked');
      return;
    }
    
    // Check if seat is already selected
    if (selectedSeats.includes(seatNumber)) {
      setSeatInputError('This seat is already selected');
      return;
    }
    
    // Add seat to selected seats
    setSelectedSeats([...selectedSeats, seatNumber]);
    
    // Clear input
    setSeatInputValue('');
  };

  const generateSeatGrid = () => {
    if (!event) return [];
    
    const totalSeats = event.seats;
    // The tickets array contains seat numbers from getBookedSeatsForEvent
    const bookedSeatNumbers = tickets || [];
    const seats = [];
    
    for (let i = 1; i <= totalSeats; i++) {
      const isBooked = bookedSeatNumbers.includes(i);
      const isSelected = selectedSeats.includes(i);
      const isAvailable = !isBooked;
      
      seats.push({
        number: i,
        isBooked,
        isSelected,
        isAvailable
      });
    }
    return seats;
  };

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      if (isFavorite) {
        await removeFromFavorites(id);
        setIsFavorite(false);
      } else {
        await addToFavorites(id);
        setIsFavorite(true);
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  // Calculate real statistics
  const getEventStats = () => {
    if (!event) return {};
    
    // Calculate sold tickets based on actual booked tickets data
    // The tickets array contains seat numbers from getBookedSeatsForEvent
    const soldTickets = tickets.length || 0;
    const totalRevenue = soldTickets * event.price;
    const occupancyRate = event.seats > 0 ? Math.round((soldTickets / event.seats) * 100) : 0;
    const availableSeats = event.seats - soldTickets;
    
    return {
      soldTickets,
      totalRevenue,
      occupancyRate,
      availableSeats
    };
  };

  const stats = getEventStats();

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <div className="text-gray-600">Loading event details...</div>
        <div className="text-sm text-gray-500 mt-2">Event ID: {id}</div>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        <div className="text-red-500 text-lg font-medium mb-2">Error</div>
        <div className="text-gray-600">{error}</div>
        <div className="text-sm text-gray-500 mt-2">Event ID: {id}</div>
        <button 
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go Back
        </button>
      </div>
    </div>
  );
  
  if (!event) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        <div className="text-gray-600 text-lg font-medium mb-2">No event found</div>
        <div className="text-gray-500 mb-4">The event you're looking for doesn't exist or has been removed.</div>
        <div className="text-sm text-gray-500 mb-4">Event ID: {id}</div>
        <button 
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go Back
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div 
        className="relative bg-cover bg-center h-56 sm:h-64 md:h-96" 
        style={{ 
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7)), url(${event?.bannerImage || '/eventx-logo.jpg'})` 
        }}
      >
        <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-6 md:p-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-4xl font-bold text-white mb-2">{event.title}</h1>
              <div className="flex items-center text-white/80 mb-1">
                <Calendar className="w-4 h-4 mr-2" />
                <span className="text-sm sm:text-base">{new Date(event.date).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </div>
              <div className="flex items-center text-white/80">
                <MapPin className="w-4 h-4 mr-2" />
                <span className="text-sm sm:text-base">{event.venue}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3 mt-3 md:mt-0">
              {isAuthenticated && (
                <button 
                  onClick={handleToggleFavorite}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  {isFavorite ? (
                    <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 fill-current" />
                  ) : (
                    <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  )}
                </button>
              )}
              
              <button 
                onClick={() => navigate(-1)}
                className="px-3 sm:px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white flex items-center text-sm sm:text-base"
              >
                <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
                Back
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Info Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Event Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Event Name</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={event.title}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-white text-black font-medium"
                      style={{ color: '#000000', fontWeight: '500' }}
                    />
                    <button className="p-2 text-gray-400 hover:text-gray-600">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Event Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Event Date</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={new Date(event.date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-white text-black font-medium"
                      style={{ color: '#000000', fontWeight: '500' }}
                    />
                    <button className="p-2 text-gray-400 hover:text-gray-600">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Event Venue */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Event Venue</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={event.venue}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-white text-black font-medium"
                      style={{ color: '#000000', fontWeight: '500' }}
                    />
                    <button className="p-2 text-gray-400 hover:text-gray-600">
                      <MapPin className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Event Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Event Time</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={new Date(event.date).toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit',
                        hour12: true 
                      }) + " - " + new Date(new Date(event.date).getTime() + 4.5 * 60 * 60 * 1000).toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit',
                        hour12: true 
                      })}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-white text-black font-medium"
                      style={{ color: '#000000', fontWeight: '500' }}
                    />
                    <button className="p-2 text-gray-400 hover:text-gray-600">
                      <Clock className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Event Description */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Event Description</label>
                <textarea
                  value={event.description}
                  readOnly
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-black font-medium resize-none"
                  style={{ color: '#000000', fontWeight: '500' }}
                />
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">{event.price} EGP</div>
                  <div className="text-sm text-gray-600">Ticket Price</div>
                  <Tag className="w-4 h-4 mx-auto mt-1 text-gray-400" />
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">{event.seats}</div>
                  <div className="text-sm text-gray-600">Total Seats</div>
                  <Users className="w-4 h-4 mx-auto mt-1 text-gray-400" />
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">{stats.availableSeats || 0}</div>
                  <div className="text-sm text-gray-600">Available Seats</div>
                  <Users className="w-4 h-4 mx-auto mt-1 text-gray-400" />
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">{stats.occupancyRate || 0}%</div>
                  <div className="text-sm text-gray-600">Occupancy Rate</div>
                  <TrendingUp className="w-4 h-4 mx-auto mt-1 text-gray-400" />
                </div>
              </div>
              
              {/* Additional Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.soldTickets || 0}</div>
                  <div className="text-sm text-blue-600">Tickets Sold</div>
                  <Ticket className="w-4 h-4 mx-auto mt-1 text-blue-400" />
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.totalRevenue?.toLocaleString() || 0} EGP</div>
                  <div className="text-sm text-green-600">Total Revenue</div>
                  <TrendingUp className="w-4 h-4 mx-auto mt-1 text-green-400" />
                </div>
              </div>
            </div>

            {/* Booked Seats - Only show for admins */}
            {userRole === 'Admin' && (
              <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">Booked Seats</h3>
                  <div className="text-xs text-gray-500">{stats.soldTickets || 0} of {event?.seats || 0} seats booked</div>
                </div>
                
                {/* Booked Seats Display */}
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto p-2 border border-gray-100 rounded-lg">
                    {generateSeatGrid()
                      .filter(seat => seat.isBooked)
                      .map((seat) => (
                        <span 
                          key={seat.number}
                          className="inline-flex w-8 h-8 bg-purple-700 text-white font-extrabold rounded-md text-xs items-center justify-center"
                          style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}
                        >
                          {seat.number}
                        </span>
                    ))}
                    {generateSeatGrid().filter(seat => seat.isBooked).length === 0 && (
                      <p className="text-gray-500 text-sm">No seats booked yet</p>
                    )}
                  </div>
                </div>

                {/* Booking Summary */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Booked:</span>
                      <span className="ml-2 font-semibold text-purple-600">{stats.soldTickets || 0}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Available:</span>
                      <span className="ml-2 font-semibold text-green-600">{stats.availableSeats || 0}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Revenue:</span>
                      <span className="ml-2 font-semibold text-green-600">{stats.totalRevenue?.toLocaleString() || 0} EGP</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Occupancy:</span>
                      <span className="ml-2 font-semibold text-blue-600">{stats.occupancyRate || 0}%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Seat Allocation - Only show for non-admin users */}
            {userRole !== 'Admin' && (
              <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">Seat Allocation</h3>
                  <div className="text-xs text-gray-500">{event?.seats || 0} total seats</div>
                </div>
                

                {/* Direct Seat Input */}
                <div className="mb-4">
                  <div className="flex flex-col space-y-2">
                    <div className="flex justify-between items-center">
                      <label htmlFor="seatInput" className="text-sm font-medium text-black">Enter seat number:</label>
                      <span className="text-xs text-gray-500">
                        Available: {stats.availableSeats || 0} of {event?.seats || 0} seats
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <input 
                        type="number" 
                        id="seatInput"
                        min="1"
                        max={event?.seats || 100}
                        className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black font-medium"
                        style={{ color: '#000000', fontWeight: '500' }}
                        placeholder="Enter seat number"
                        value={seatInputValue}
                        onChange={(e) => setSeatInputValue(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleSeatInputSubmit();
                          }
                        }}
                      />
                      <button 
                        onClick={handleSeatInputSubmit}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors"
                      >
                        Add Seat
                      </button>
                    </div>
                    {seatInputError && (
                      <p className="text-red-500 text-xs mt-1">{seatInputError}</p>
                    )}
                  </div>
                </div>
                
                {/* Booked Seats Display */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2 ">Booked Seats:</h4>
                  <div className="flex flex-wrap gap-2 max-h-[100px] overflow-y-auto p-2 border border-gray-100 rounded-lg">
                    {generateSeatGrid()
                      .filter(seat => seat.isBooked)
                      .map((seat) => (
                        <span 
                          key={seat.number}
                          className="inline-flex w-8 h-8 bg-purple-700 text-white font-extrabold rounded-md text-xs items-center justify-center"
                          style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}
                        >
                          {seat.number}
                        </span>
                    ))}
                    {generateSeatGrid().filter(seat => seat.isBooked).length === 0 && (
                      <p className="text-gray-500 text-xs">No seats booked yet</p>
                    )}
                  </div>
                </div>

                {/* Selected Seats Summary */}
                {selectedSeats.length > 0 && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-blue-800">Selected Seats</h4>
                      <button 
                        onClick={() => setSelectedSeats([])}
                        className="text-xs text-red-600 hover:text-red-800 underline"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedSeats.map(seatNum => (
                        <span 
                          key={seatNum} 
                          className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm flex items-center"
                        >
                          Seat {seatNum}
                          <button 
                            onClick={() => setSelectedSeats(selectedSeats.filter(seat => seat !== seatNum))}
                            className="ml-1 text-red-500 hover:text-red-700 font-bold"
                            aria-label={`Remove seat ${seatNum}`}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="mt-3 font-medium text-gray-700">
                      Total: {selectedSeats.length} × {event.price} EGP = {selectedSeats.length * event.price} EGP
                    </div>
                    <button 
                      onClick={handleBookTickets}
                      className="mt-4 block w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      disabled={selectedSeats.length === 0 || bookingLoading}
                    >
                      {bookingLoading ? (
                        <div className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Booking Tickets...
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Book Now
                        </div>
                      )}
                    </button>
                    {bookingError && (
                      <p className="mt-2 text-sm text-red-600">{bookingError}</p>
                    )}
                    {bookingSuccess && (
                      <p className="mt-2 text-sm text-green-600">Booking successful! Redirecting to My Tickets...</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Tags & Attendance */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {event.category ? (
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        #{event.category}
                      </span>
                    ) : (
                      <>
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">#Event</span>
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">#Live</span>
                      </>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Attendance</label>
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900 font-medium">{stats.soldTickets || 0} / {event.seats || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* QR Code */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="text-center">
                <div className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-300 mb-4">
                  <QRCode
                    value={`${window.location.origin}/events/${event._id}`}
                    size={120}
                    className="mx-auto"
                  />
                </div>
                <p className="text-sm text-gray-600">
                  Scan QR code for easy payments
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {userRole === 'Admin' && (
                <Link
                  to={`/admin/edit-event/${event._id}`}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  EDIT
                </Link>
              )}
              
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;
