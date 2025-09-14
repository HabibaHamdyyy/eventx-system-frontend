import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, role }) => {
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("role");

  // If no token redirect to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // If role is required but user role doesn't match redirect home
  if (role && userRole !== role) {
    console.log(`Access denied: Required role "${role}", but user has role "${userRole}"`);
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
