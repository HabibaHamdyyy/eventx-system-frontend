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
  LogOut,
  PlusCircle,
  ChevronDown,
  ChevronRight,
  Menu,
  Heart,
  Star,
  MapPin,
} from "lucide-react";

export default function UserSidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [open, setOpen] = useState({ main: true, events: true, account: false });

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
      { path: "/user", label: "Dashboard", Icon: LayoutDashboard },
      { path: "/user/my-tickets", label: "My Tickets", Icon: Ticket },
      { path: "/events", label: "Browse Events", Icon: Calendar },
    ],
    events: [
      { path: "/user/favorites", label: "Favorite Events", Icon: Heart },
      { path: "/user/upcoming", label: "Upcoming Events", Icon: Star },
      { path: "/user/past-events", label: "Past Events", Icon: MapPin },
    ],
    account: [
      { path: "/user/profile", label: "Profile Settings", Icon: Users },
      { path: "/user/notifications", label: "Notifications", Icon: Bell },
      { path: "/user/settings", label: "Account Settings", Icon: Settings },
    ],
  };

  const SidebarItem = ({ path, label, Icon }) => {
    const active = location.pathname === path;
    return (
      <Link
        to={path}
        className={`group flex items-center gap-3 rounded-xl px-3 py-2 transition-colors whitespace-nowrap ${
          active
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
      className={`h-screen shrink-0 bg-gray-900 text-white border-r border-gray-800 flex flex-col ${
        collapsed ? "w-20" : "w-60 lg:w-64"
      }`}
    >
      {/* Brand + collapse toggle */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-slate-800">
        <div className="flex items-center gap-3 min-w-0">
          <img src="/eventx-logo.jpg" alt="EventX" className="w-9 h-9 rounded-full object-cover" />
          {!collapsed && (
            <div className="truncate">
              <div className="text-lg font-bold leading-tight">EventX</div>
              <div className="text-[11px] text-slate-400 leading-tight">Studio</div>
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

        {/* Events */}
        <div>
          {!collapsed && <SectionHeader id="events" title="Event Management" />}
          <div className={`mt-2 space-y-1 ${!collapsed && !open.events ? "hidden" : "block"}`}>
            {items.events.map((it) => (
              <SidebarItem key={it.path} {...it} />
            ))}
          </div>
        </div>

        {/* Account */}
        <div>
          {!collapsed && <SectionHeader id="account" title="Account Settings" />}
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
          className={`w-full flex items-center space-x-3 px-3 py-2.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <LogOut size={18} />
          {!collapsed && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  );
}
