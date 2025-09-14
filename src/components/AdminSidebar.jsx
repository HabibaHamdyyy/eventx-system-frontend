import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Ticket,
  Users,
  BarChart3,
  Headset,
  Bell,
  Settings,
  Megaphone,
  Folder,
  UserCog,
  LogOut,
  PlusCircle,
  ChevronDown,
  ChevronRight,
  Menu,
} from "lucide-react";

export default function AdminSidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [open, setOpen] = useState({ main: true, support: true, features: false, account: false });

  const SectionHeader = ({ id, title }) => (
    <button
      onClick={() => setOpen((p) => ({ ...p, [id]: !p[id] }))}
      className="flex items-center w-full text-xs tracking-wide font-semibold text-gray-400 hover:text-gray-200 uppercase"
    >
      <span className="mr-1">{open[id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</span>
      {title}
    </button>
  );

  const items = {
    main: [
      { path: "/admin/dashboard", label: "Dashboard", Icon: LayoutDashboard },
      { path: "/admin/events", label: "Manage Events", Icon: Calendar },
      { path: "/admin/bookings", label: "Booking & Tickets", Icon: Ticket },
      { path: "/admin/attendee-insights", label: "Attendee Insights", Icon: Users },
      { path: "/admin/analytics", label: "Analytics & Reports", Icon: BarChart3 },
    ],
    support: [
      { path: "/admin/support", label: "Contact Support", Icon: Headset },
      { path: "/admin/notifications", label: "Notifications", Icon: Bell },
      { path: "/admin/settings", label: "Settings", Icon: Settings },
    ],
    features: [
      { path: "/admin/marketing", label: "Marketing", Icon: Megaphone },
      { path: "/admin/categories", label: "Event Categories", Icon: Folder },
    ],
    account: [{ path: "/admin/users", label: "Manage Users", Icon: UserCog }],
  };

  const SidebarItem = ({ path, label, Icon }) => {
    const active = location.pathname === path;
    return (
      <Link
        to={path}
        className={`group flex items-center gap-3 rounded-xl px-3 py-2 transition-colors whitespace-nowrap ${active
          ? "bg-gray-800 text-primary"
          : "text-gray-300 hover:text-white hover:bg-gray-800/60"
          }`}
      >
        <Icon size={18} className={active ? "text-primary" : "text-gray-400 group-hover:text-white"} />
        {!collapsed && <span className="text-sm">{label}</span>}
      </Link>
    );
  };

  return (
    <aside
      className={`h-screen shrink-0 bg-gray-900 text-white border-r border-gray-800 flex flex-col ${collapsed ? "w-20" : "w-60 lg:w-64"
        }`}
    >
      {/* Brand + collapse toggle */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-slate-800">
        <div className="flex items-center gap-3 min-w-0">
          <img src="/eventx-logo.jpg" alt="EventX" className="w-9 h-9 rounded-full object-cover" />
          {!collapsed && (
            <div className="truncate">
              <div className="text-lg font-bold leading-tight">EventX</div>
              <div className="[font-family:'Reenie Beanie',cursive] font-medium text-white text-2xl leading-6 whitespace-nowrap">studio</div>
            </div>
          )}
        </div>
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="p-2 rounded-lg hover:bg-slate-800 text-slate-300"
          aria-label="Toggle sidebar"
        >
          <Menu size={18} />
        </button>
      </div>

      {/* Add Quick Event */}
      <div className="px-3 pt-3">
        <Link
          to="/admin/add-event"
          className={`flex items-center gap-2 rounded-xl bg-indigo-600/90 hover:bg-indigo-600 transition-colors px-3 py-2 shadow ${collapsed ? "justify-center" : ""
            }`}
        >
          <PlusCircle size={18} />
          {!collapsed && <span className="text-sm font-medium">Add Quick Event</span>}
        </Link>
      </div>

      {/* Scrollable nav */}
      <nav className="mt-2 px-3 pb-3 overflow-y-auto no-scrollbar flex-1 space-y-5">
        {/* Main */}
        <div>
          {!collapsed && <SectionHeader id="main" title="Main Navigation" />}
          <div className={`mt-2 space-y-1 ${!collapsed && !open.main ? "hidden" : "block"}`}>
            {items.main.map((it) => (
              <SidebarItem key={it.path} {...it} />
            ))}
          </div>
        </div>

        {/* Support */}
        <div>
          {!collapsed && <SectionHeader id="support" title="Support & Management" />}
          <div className={`mt-2 space-y-1 ${!collapsed && !open.support ? "hidden" : "block"}`}>
            {items.support.map((it) => (
              <SidebarItem key={it.path} {...it} />
            ))}
          </div>
        </div>

        {/* Features */}
        <div>
          {!collapsed && <SectionHeader id="features" title="Additional Features" />}
          <div className={`mt-2 space-y-1 ${!collapsed && !open.features ? "hidden" : "block"}`}>
            {items.features.map((it) => (
              <SidebarItem key={it.path} {...it} />
            ))}
          </div>
        </div>

        {/* Account */}
        <div>
          {!collapsed && <SectionHeader id="account" title="Account Management" />}
          <div className={`mt-2 space-y-1 ${!collapsed && !open.account ? "hidden" : "block"}`}>
            {items.account.map((it) => (
              <SidebarItem key={it.path} {...it} />
            ))}
          </div>
        </div>
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-slate-800">
        <button
          onClick={() => {
            localStorage.clear();
            setTimeout(() => {
              window.location.href = '/login';
            }, 100);
          }}
          className={`w-full flex items-center space-x-3 px-3 py-2.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors ${collapsed ? "justify-center" : ""
            }`}
        >
          <LogOut size={18} />
          {!collapsed && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  );
}