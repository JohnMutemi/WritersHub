import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export function UserDropdown() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [, navigate] = useLocation();

  const toggleUserMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen);
  };

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account",
      });
      navigate("/auth");
    } catch (error) {
      toast({
        title: "Logout failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest("[data-user-dropdown]")) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const profileUrl = user?.role === "writer" 
    ? "/writer/profile" 
    : user?.role === "client" 
      ? "/client/profile" 
      : "/admin/profile";

  return (
    <div className="ml-3 relative" data-user-dropdown>
      <div>
        <button
          type="button"
          onClick={toggleUserMenu}
          className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none"
        >
          <span className="sr-only">Open user menu</span>
          {user?.profileImage ? (
            <img
              className="h-8 w-8 rounded-full"
              src={user.profileImage}
              alt={user.fullName}
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
              <User className="h-5 w-5 text-gray-500" />
            </div>
          )}
        </button>
      </div>
      
      <div
        className={`origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 ${
          isProfileMenuOpen ? "" : "hidden"
        }`}
      >
        <a
          href={profileUrl}
          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          onClick={() => setIsProfileMenuOpen(false)}
        >
          Your Profile
        </a>
        <button
          onClick={handleLogout}
          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
