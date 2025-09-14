import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NotificationsPanel from './NotificationsPanel';

const TopNavbar = () => {
  const userName = localStorage.getItem('userName') || 'Admin';
  const userRole = localStorage.getItem('role') || 'Admin';
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const handleSearch = () => {
    const q = searchValue.trim();
    if (!q) return;
    navigate(`/events?search=${encodeURIComponent(q)}`);
  };

  const notifications = [
    { message: 'New booking received' },
    { message: 'Event capacity reached 80%' },
  ];

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Welcome Message */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Welcome {userName || 'Admin'}</h2>
            <p className="text-sm text-gray-500">{userRole}</p>
          </div>
        </div>

        {/* Search and Profile */}
        <div className="flex items-center space-x-4">
          
          
          {/* Mobile Search Button */}
          <button onClick={handleSearch} className="md:hidden p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </button>

          {/* Profile and Notifications */}
          <div className="flex items-center space-x-3">
            <button onClick={() => setShowNotifications(v => !v)} className="p-2 text-gray-400 hover:text-gray-600 relative">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
              </svg>
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400"></span>
            </button>
            {showNotifications && (
              <div className="absolute right-0 top-12 z-50 w-80 bg-white border border-gray-200 rounded-lg shadow-lg">
                <NotificationsPanel notifications={notifications} />
              </div>
            )}
            
            <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">{(userName || 'Admin').charAt(0).toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopNavbar;
