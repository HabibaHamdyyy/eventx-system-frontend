import React, { useState, useEffect } from "react";
import { addEvent, updateEvent, getEventById } from "../api/eventApi";
import { useNavigate, useParams } from "react-router-dom";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { ArrowLeft, Calendar, MapPin, Users, DollarSign } from "lucide-react";

const EventForm = () => {
  const { id } = useParams(); // if editing
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    venue: "",
    price: "",
    seats: "",
    availableSeats: "",
  });

  useEffect(() => {
    if (id) {
      fetchEvent();
    }
  }, [id]);

  const fetchEvent = async () => {
    try {
      const res = await getEventById(id);
      if (res.data) setForm(res.data);
    } catch (err) {
      console.error("Error fetching event:", err);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!form.title || !form.description || !form.date || !form.venue || !form.price || !form.seats) {
      alert("Please fill in all required fields.");
      return;
    }

    // Validate numeric fields
    if (isNaN(form.price) || form.price < 0) {
      alert("Please enter a valid price.");
      return;
    }

    if (isNaN(form.seats) || form.seats < 1) {
      alert("Please enter a valid number of seats (minimum 1).");
      return;
    }

    // prevent past dates
    if (new Date(form.date) < new Date().setHours(0, 0, 0, 0)) {
      alert("Event date cannot be in the past.");
      return;
    }

    const payload = { 
      ...form,
      price: parseFloat(form.price),
      seats: parseInt(form.seats)
    };

    // when adding a new event, set availableSeats = seats
    if (!id) {
      payload.availableSeats = parseInt(form.seats);
    }

    console.log("Submitting event with payload:", payload);

    try {
      if (id) {
        const result = await updateEvent(id, payload);
        console.log("Event updated successfully:", result);
      } else {
        const result = await addEvent(payload);
        console.log("Event created successfully:", result);
      }
      navigate("/admin/events"); // redirect to manage events page
    } catch (err) {
      console.error("Error saving event:", err);
      console.error("Error response:", err.response);
      console.error("Error status:", err.response?.status);
      console.error("Error data:", err.response?.data);
      
      let errorMessage = "An error occurred while saving the event.";
      
      if (err.response?.status === 401) {
        errorMessage = "You are not authorized. Please log in again.";
      } else if (err.response?.status === 403) {
        errorMessage = "You don't have permission to create events.";
      } else if (err.response?.status === 500) {
        errorMessage = "Server error. Please try again later.";
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      alert(errorMessage);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/admin/dashboard")}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {id ? "Edit Event" : "Add New Event"}
            </h1>
            <p className="text-gray-400 mt-1">
              {id ? "Update event details" : "Create a new event for your audience"}
            </p>
          </div>
        </div>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Event Title */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Event Title
              </label>
              <Input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Enter event title"
                className="bg-gray-700 border-gray-600 text-white"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Describe your event"
                rows={4}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            {/* Date and Venue Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Event Date
                </label>
                <Input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  className="bg-gray-700 border-gray-600 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  Venue
                </label>
                <Input
                  type="text"
                  name="venue"
                  value={form.venue}
                  onChange={handleChange}
                  placeholder="Event location"
                  className="bg-gray-700 border-gray-600 text-white"
                  required
                />
              </div>
            </div>

            {/* Price and Seats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-2" />
                  Ticket Price (EGP)
                </label>
                <Input
                  type="number"
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  className="bg-gray-700 border-gray-600 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Users className="w-4 h-4 inline mr-2" />
                  Total Seats
                </label>
                <Input
                  type="number"
                  name="seats"
                  value={form.seats}
                  onChange={handleChange}
                  placeholder="100"
                  min="1"
                  className="bg-gray-700 border-gray-600 text-white"
                  required
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-700">
              <Button 
                type="button"
                variant="outline" 
                onClick={() => navigate("/admin/dashboard")}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                {id ? "Update Event" : "Create Event"}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default EventForm;
