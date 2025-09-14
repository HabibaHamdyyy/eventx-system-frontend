import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { bookTicket, getBookedSeatsForEvent } from "../api/ticketApi";
import { getEventById } from "../api/eventApi";

const Booking = () => {
  const { id } = useParams(); // eventId from URL
  const navigate = useNavigate();
  const [seatNumber, setSeatNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [event, setEvent] = useState(null);
  const [availableSeats, setAvailableSeats] = useState([]);
  const [fetchingEvent, setFetchingEvent] = useState(true);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setFetchingEvent(true);
        const response = await getEventById(id);
        setEvent(response.data);
        
        // Generate available seat numbers based on availableSeats count
        if (response.data.availableSeats > 0) {
          // Create an array of seat numbers from 1 to total seats
          const totalSeats = response.data.seats;
          
          // Get already booked seats
          const bookedSeatsResponse = await getBookedSeatsForEvent(id);
          const bookedSeats = bookedSeatsResponse.data || [];
          
          // Generate available seats (seats that are not booked)
          const seatOptions = [];
          for (let i = 1; i <= totalSeats; i++) {
            if (!bookedSeats.includes(i)) {
              seatOptions.push(i);
            }
          }
          
          setAvailableSeats(seatOptions);
        }
      } catch (err) {
        console.error("Error fetching event details:", err);
        setError("Could not load event details. Please try again.");
      } finally {
        setFetchingEvent(false);
      }
    };

    fetchEventDetails();
  }, [id]);

  const handleBooking = async () => {
    if (!seatNumber) {
      setError("Please select a seat number.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please login first.");
        return;
      }

      const res = await bookTicket(id, seatNumber);

      console.log("Booking successful:", res.data);
      navigate("/my-tickets");
    } catch (err) {
      setError(err.response?.data?.message || "Booking failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Book Your Ticket</h1>
          <p className="text-gray-600">Secure your seat for this amazing event</p>
        </div>

        {/* Booking Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select a Seat
              </label>
              
              {fetchingEvent ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                  <span className="ml-2 text-gray-600">Loading available seats...</span>
                </div>
              ) : availableSeats.length > 0 ? (
                <div className="mt-2">
                  <div className="grid grid-cols-5 gap-2 mb-4">
                    {availableSeats.map((seat) => (
                      <button
                        key={seat}
                        type="button"
                        onClick={() => setSeatNumber(seat)}
                        className={`py-2 px-3 rounded-lg text-center transition-all ${seatNumber === seat 
                          ? 'bg-purple-600 text-white' 
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
                      >
                        {seat}
                      </button>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mt-2">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-gray-100 rounded mr-2"></div>
                      <span>Available</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-purple-600 rounded mr-2"></div>
                      <span>Selected</span>
                    </div>
                  </div>
                  
                  <p className="mt-4 text-sm text-gray-500">
                    Selected seat: {seatNumber ? <span className="font-medium text-purple-700">Seat {seatNumber}</span> : "None"}
                  </p>
                </div>
              ) : (
                <div className="py-4 text-center bg-red-50 rounded-lg border border-red-100">
                  <p className="text-red-600">No seats available for this event</p>
                </div>
              )}
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-100">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-purple-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-purple-800">Booking Information</p>
                  <p className="text-sm text-purple-600">Your ticket will include a QR code for easy check-in</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleBooking}
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Booking Ticket...
                </div>
              ) : (
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Confirm Booking
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Back Button */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate(-1)}
            className="text-purple-600 hover:text-purple-500 font-medium text-sm flex items-center justify-center mx-auto"
          >
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Event Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default Booking;
