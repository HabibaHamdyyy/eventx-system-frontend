import React from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import TopNavbar from "./TopNavbar";

const AdminLayout = () => {
  return (
    <div className="flex h-screen w-screen bg-dashboardBg overflow-hidden font-sans">
      <AdminSidebar />

      {/* Main Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Sticky topbar */}
        <div className="sticky top-0 z-30">
          <TopNavbar />
        </div>

        {/* Content */}
        <main className="flex-1 min-w-0 overflow-y-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;