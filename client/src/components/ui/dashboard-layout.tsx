import React, { useState } from "react";
import { Sidebar } from "./sidebar";
import { Navbar } from "./navbar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar for desktop */}
      <Sidebar />

      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top navigation */}
        <Navbar toggleSidebar={toggleSidebar} />

        {/* Mobile sidebar menu slide-over */}
        <div className={`fixed inset-0 flex z-40 md:hidden ${isMobileSidebarOpen ? "" : "hidden"}`}>
          <div 
            className="fixed inset-0 bg-dark-100 bg-opacity-75"
            onClick={closeMobileSidebar}
          ></div>
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-dark-100">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                onClick={closeMobileSidebar}
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              >
                <span className="sr-only">Close sidebar</span>
                <span className="text-white">✕</span>
              </button>
            </div>
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4">
                <h1 className="text-xl font-bold text-white">SharpQuill</h1>
              </div>
              <Sidebar mobile={true} />
            </div>
          </div>
          <div className="flex-shrink-0 w-14"></div>
        </div>

        {/* Main content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}
