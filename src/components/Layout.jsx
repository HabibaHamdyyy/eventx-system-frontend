import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import UserSidebar from "./UserSidebar";
import TopNavbar from "./TopNavbar";

const Layout = () => {
  const location = useLocation();
  const hideNavbar = ["/login", "/register"].includes(location.pathname);
  const token = localStorage.getItem("token");

  return (
    <div className="flex h-screen w-screen bg-dashboardBg overflow-hidden font-sans">
      {!hideNavbar && token && <UserSidebar />}
      
      {/* Main Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Sticky topbar */}
        {!hideNavbar && token && (
          <div className="sticky top-0 z-30">
            <TopNavbar />
          </div>
        )}
        
        {/* Content */}
        <main className="flex-1 min-w-0 overflow-y-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
