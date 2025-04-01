import React from "react";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Briefcase, 
  ClipboardList, 
  BookOpen, 
  Clock, 
  Wallet, 
  ArrowDownToLine, 
  User,
  Settings,
  LogOut,
  FilePlus,
  Users,
  CheckCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SidebarLinkProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  active?: boolean;
}

function SidebarLink({ href, icon, children, active }: SidebarLinkProps) {
  return (
    <Link href={href}>
      <a
        className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
          active
            ? "bg-dark-200 text-white"
            : "text-gray-300 hover:bg-dark-200 hover:text-white"
        }`}
      >
        <span className={`mr-3 ${active ? "text-gray-300" : "text-gray-400"}`}>
          {icon}
        </span>
        {children}
      </a>
    </Link>
  );
}

interface SidebarProps {
  mobile?: boolean;
}

export function Sidebar({ mobile = false }: SidebarProps) {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [location, navigate] = useLocation();

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

  const WriterNavigation = () => (
    <>
      <div className="space-y-1">
        <h2 className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Dashboard
        </h2>
        <SidebarLink 
          href="/" 
          icon={<LayoutDashboard size={20} />}
          active={location === "/" || location === ""}
        >
          Overview
        </SidebarLink>
        <SidebarLink 
          href="/writer/available-jobs" 
          icon={<Briefcase size={20} />}
          active={location === "/writer/available-jobs"}
        >
          Available Jobs
        </SidebarLink>
        <SidebarLink 
          href="/writer/pending-bids" 
          icon={<ClipboardList size={20} />}
          active={location === "/writer/pending-bids"}
        >
          Pending Bids
        </SidebarLink>
        <SidebarLink 
          href="/writer/active-orders" 
          icon={<BookOpen size={20} />}
          active={location === "/writer/active-orders"}
        >
          Active Orders
        </SidebarLink>
        <SidebarLink 
          href="/writer/order-history" 
          icon={<Clock size={20} />}
          active={location === "/writer/order-history"}
        >
          Order History
        </SidebarLink>
      </div>
      
      <div className="space-y-1 pt-4">
        <h2 className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Financial
        </h2>
        <SidebarLink 
          href="/writer/earnings" 
          icon={<Wallet size={20} />}
          active={location === "/writer/earnings"}
        >
          Earnings
        </SidebarLink>
      </div>
    </>
  );

  const ClientNavigation = () => (
    <>
      <div className="space-y-1">
        <h2 className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Dashboard
        </h2>
        <SidebarLink 
          href="/" 
          icon={<LayoutDashboard size={20} />}
          active={location === "/" || location === ""}
        >
          Overview
        </SidebarLink>
        <SidebarLink 
          href="/client/post-job" 
          icon={<FilePlus size={20} />}
          active={location === "/client/post-job"}
        >
          Post New Job
        </SidebarLink>
        <SidebarLink 
          href="/client/manage-orders" 
          icon={<BookOpen size={20} />}
          active={location === "/client/manage-orders"}
        >
          Manage Orders
        </SidebarLink>
      </div>
    </>
  );

  const AdminNavigation = () => (
    <>
      <div className="space-y-1">
        <h2 className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Dashboard
        </h2>
        <SidebarLink 
          href="/" 
          icon={<LayoutDashboard size={20} />}
          active={location === "/" || location === ""}
        >
          Overview
        </SidebarLink>
        <SidebarLink 
          href="/admin/writers" 
          icon={<Users size={20} />}
          active={location === "/admin/writers"}
        >
          Writers
        </SidebarLink>
        <SidebarLink 
          href="/admin/approvals" 
          icon={<CheckCircle size={20} />}
          active={location === "/admin/approvals"}
        >
          Approvals
        </SidebarLink>
        <SidebarLink 
          href="/admin/orders" 
          icon={<BookOpen size={20} />}
          active={location === "/admin/orders"}
        >
          Orders
        </SidebarLink>
        <SidebarLink 
          href="/admin/payments" 
          icon={<Wallet size={20} />}
          active={location === "/admin/payments"}
        >
          Payments
        </SidebarLink>
      </div>
    </>
  );

  const NavContent = () => {
    switch (user?.role) {
      case 'writer':
        return <WriterNavigation />;
      case 'client':
        return <ClientNavigation />;
      case 'admin':
        return <AdminNavigation />;
      default:
        return null;
    }
  };

  const baseClass = mobile 
    ? "px-4 py-4 space-y-4" 
    : "hidden md:flex md:flex-shrink-0";

  const sidebarContentClass = mobile
    ? "nav px-2 space-y-4"
    : "flex flex-col w-64 bg-dark-100 text-white";

  return mobile ? (
    <nav className={baseClass}>
      <NavContent />
      
      <div className="space-y-1">
        <h2 className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Account
        </h2>
        <SidebarLink 
          href={user?.role === "writer" ? "/writer/profile" : user?.role === "client" ? "/client/profile" : "/admin/profile"} 
          icon={<User size={20} />}
          active={location.includes("/profile")}
        >
          Profile
        </SidebarLink>
      </div>
    </nav>
  ) : (
    <div className={baseClass}>
      <div className={sidebarContentClass}>
        <div className="flex items-center justify-center h-16 border-b border-dark-200">
          <h1 className="text-xl font-bold">SharpQuill</h1>
        </div>
        <div className="flex flex-col justify-between h-full overflow-y-auto scrollbar-hide">
          <div className="px-4 py-4 space-y-4">
            <NavContent />
            
            <div className="space-y-1">
              <h2 className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Account
              </h2>
              <SidebarLink 
                href={user?.role === "writer" ? "/writer/profile" : user?.role === "client" ? "/client/profile" : "/admin/profile"} 
                icon={<User size={20} />}
                active={location.includes("/profile")}
              >
                Profile
              </SidebarLink>
            </div>
          </div>
          
          <div className="px-4 py-4">
            {/* User Profile Section */}
            <div className="flex items-center mb-4 px-2 py-2">
              {user?.profileImage ? (
                <img 
                  className="h-8 w-8 rounded-full"
                  src={user.profileImage}
                  alt={user.fullName}
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-dark-300 flex items-center justify-center">
                  <User className="h-5 w-5 text-gray-200" />
                </div>
              )}
              <div className="ml-3">
                <p className="text-sm font-medium text-white">{user?.fullName}</p>
                <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
              </div>
            </div>
            
            {/* Logout Button */}
            <button 
              onClick={handleLogout}
              className="w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-300 hover:bg-dark-200 hover:text-white"
            >
              <span className="mr-3 text-gray-400">
                <LogOut size={20} />
              </span>
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
