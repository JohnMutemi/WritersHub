import { ReactNode, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PanelLeft, Menu, User, LogOut, Home, FileText, Clock, BarChart3, Users, Settings } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  
  const navigation = [
    { name: "Dashboard", href: `/${user?.role}`, icon: Home },
    ...(user?.role === "writer" ? [
      { name: "Available Jobs", href: "/writer/jobs", icon: FileText },
      { name: "My Orders", href: "/writer/orders", icon: Clock },
    ] : []),
    ...(user?.role === "client" ? [
      { name: "My Jobs", href: "/client/jobs", icon: FileText },
      { name: "My Orders", href: "/client/orders", icon: Clock },
    ] : []),
    ...(user?.role === "admin" ? [
      { name: "Users", href: "/admin/users", icon: Users },
      { name: "Jobs", href: "/admin/jobs", icon: FileText },
      { name: "Orders", href: "/admin/orders", icon: Clock },
      { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    ] : []),
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const handleLogout = () => {
    logoutMutation.mutate();
    setLogoutDialogOpen(false);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-card transition-transform duration-300 ease-in-out",
          isMobile && !sidebarOpen && "-translate-x-full"
        )}
      >
        <div className="flex h-16 shrink-0 items-center border-b px-4">
          <div 
            className="flex items-center cursor-pointer"
            onClick={() => window.location.href = "/"}
          >
            <span className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg mr-2">SQ</span>
            <span className="text-xl font-semibold">SharpQuill</span>
          </div>
        </div>
        <ScrollArea className="flex flex-col flex-grow px-2 py-4">
          <nav className="flex flex-col space-y-1">
            {navigation.map((item) => {
              const isActive = location === item.href;
              return (
                <div 
                  key={item.name}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium cursor-pointer",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                  onClick={() => window.location.href = item.href}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </div>
              );
            })}
          </nav>
        </ScrollArea>
        <div className="border-t p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">{user?.username}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
            </div>
          </div>
          <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Confirm Logout</DialogTitle>
                <DialogDescription>
                  Are you sure you want to log out? Any unsaved changes will be lost.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setLogoutDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="default" onClick={handleLogout} disabled={logoutMutation.isPending}>
                  Logout
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Content area */}
      <div className={cn(
        "flex flex-col flex-1 w-full transition-all duration-300",
        sidebarOpen && !isMobile && "pl-64"
      )}>
        <div className="sticky top-0 z-10 flex items-center border-b h-16 px-4 bg-background">
          <button
            type="button"
            className="p-2 rounded-md hover:bg-muted"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <PanelLeft className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            <span className="sr-only">Toggle sidebar</span>
          </button>
          <div className="ml-4">
            <h1 className="text-xl font-semibold">{user?.role === "writer" ? "Writer Dashboard" : 
              user?.role === "client" ? "Client Dashboard" : "Admin Dashboard"}</h1>
          </div>
        </div>

        <ScrollArea className="flex-1 px-4 py-6 md:px-8">
          {children}
        </ScrollArea>
      </div>
    </div>
  );
}