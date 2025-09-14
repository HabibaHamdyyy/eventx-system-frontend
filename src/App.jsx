import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import AdminLayout from "./components/AdminLayout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDashboard from "./pages/AdminDashboard";
import UserDashboard from "./pages/UserDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import EventForm from "./pages/EventForm";
import MyTickets from "./pages/MyTickets";
import AdminTickets from "./pages/AdminTickets";
import EventList from "./pages/EventList";
import EventDetails from "./pages/EventDetails";
import Booking from "./pages/Booking";
import EventManagement from "./pages/EventManagement";
import AttendeeInsights from "./pages/AttendeeInsights";
import SingleEventInsights from "./pages/SingleEventInsights";
import Analytics from "./pages/Analytics";
import Favorites from "./pages/Favorites";

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/events" element={<Layout />}>
          <Route index element={<EventList />} />
          <Route path=":id" element={<EventDetails />} />
        </Route>

        {/* User routes */}
        <Route
          path="/user/*"
          element={
            <ProtectedRoute role="User">
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<UserDashboard />} />
          <Route path="my-tickets" element={<MyTickets />} />
          <Route path="favorites" element={<Favorites />} />
        </Route>

        {/* Booking route (separate since it needs user protection but different path) */}
        <Route
          path="/events/:id/booking"
          element={
            <ProtectedRoute role="User">
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Booking />} />
        </Route>

        {/* Admin routes */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute role="Admin">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="events" element={<EventManagement />} />
          <Route path="add-event" element={<EventForm />} />
          <Route path="edit-event/:id" element={<EventForm />} />
          <Route path="bookings" element={<AdminTickets />} />
          <Route path="tickets" element={<AdminTickets />} />
          <Route path="attendees" element={<AdminDashboard />} />
          <Route path="reports" element={<AdminDashboard />} />
          <Route path="support" element={<AdminDashboard />} />
          <Route path="notifications" element={<AdminDashboard />} />
          <Route path="settings" element={<AdminDashboard />} />
          <Route path="marketing" element={<AdminDashboard />} />
          <Route path="categories" element={<AdminDashboard />} />
          <Route path="users" element={<AdminDashboard />} />
          <Route path="events/:id" element={<EventDetails />} />
          <Route path="attendee-insights" element={<AttendeeInsights />} />
          <Route path="events/:id/insights" element={<SingleEventInsights />} />
          <Route path="analytics" element={<Analytics />} />
        </Route>

        {/* Auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
