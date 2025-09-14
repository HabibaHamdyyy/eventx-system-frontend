import React from "react";

const DashboardLayout = ({ header, children }) => {
  return (
    <div className="flex flex-col h-full">
      {header && (
        <div className="border-b border-gray-200 p-4 bg-white">
          {header}
        </div>
      )}
      <div className="flex-1 overflow-auto p-4">{children}</div>
    </div>
  );
};

export default DashboardLayout;


