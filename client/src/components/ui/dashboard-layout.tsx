import { useState, ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import {
  LayoutDashboard,
  Users,
  FileText,
  ShoppingCart,
  BarChart2,
  Settings,
  Menu,
  X,
  LogOut,
  Home,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        toast({
          title: 'Logged out successfully',
          description: 'You have been logged out of your account',
        });
      },
    });
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.username) return 'U';
    return user.username.substring(0, 2).toUpperCase();
  };

  // Define navigation items based on user role
  const getNavItems = () => {
    if (user?.role === 'admin') {
      return [
        { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/admin/users', label: 'Users', icon: Users },
        { href: '/admin/jobs', label: 'Jobs', icon: FileText },
        { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
        { href: '/admin/analytics', label: 'Analytics', icon: BarChart2 },
      ];
    } else if (user?.role === 'writer') {
      return [
        { href: '/writer', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/writer/jobs', label: 'Available Jobs', icon: FileText },
        { href: '/writer/orders', label: 'My Orders', icon: ShoppingCart },
      ];
    } else if (user?.role === 'client') {
      return [
        { href: '/client', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/client/jobs', label: 'My Jobs', icon: FileText },
        { href: '/client/orders', label: 'Orders', icon: ShoppingCart },
      ];
    }
    return [];
  };

  const navItems = getNavItems();

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile sidebar toggle */}
      {isMobile && (
        <Button
          variant="outline"
          size="icon"
          className="fixed top-4 right-4 z-50 lg:hidden"
          onClick={toggleSidebar}
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'bg-card text-card-foreground fixed inset-y-0 left-0 z-40 w-64 flex-shrink-0 transform transition-transform duration-200 ease-in-out border-r',
          isMobile ? (sidebarOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Sidebar header */}
          <div className="flex items-center justify-center h-16 border-b px-4">
            <Link href="/">
              <a className="flex items-center gap-2">
                <div className="bg-primary rounded-md p-1">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 2H8C5.79086 2 4 3.79086 4 6V18C4 20.2091 5.79086 22 8 22H16C18.2091 22 20 20.2091 20 18V6C20 3.79086 18.2091 2 16 2Z" stroke="white" strokeWidth="2"/>
                    <path d="M8 7L16 7" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M8 12L16 12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M8 17L13 17" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <h1 className="text-xl font-semibold">SharpQuill</h1>
              </a>
            </Link>
          </div>

          {/* Nav links */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {/* Home button at the top */}
              <li>
                <Link href="/">
                  <a 
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      location === "/" 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-muted'
                    )}
                    onClick={isMobile ? toggleSidebar : undefined}
                  >
                    <Home className="h-5 w-5" />
                    Home
                  </a>
                </Link>
              </li>
              
              {/* Role-specific navigation */}
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>
                    <a
                      className={cn(
                        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        location === item.href
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      )}
                      onClick={isMobile ? toggleSidebar : undefined}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.label}
                    </a>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Sidebar footer */}
          <div className="border-t p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>{getUserInitials()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{user?.username}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Settings className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <Link href="/settings">
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" /> Settings
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div
        className={cn(
          'flex flex-1 flex-col overflow-y-auto bg-background',
          isMobile ? 'ml-0' : 'ml-64'
        )}
      >
        {children}
      </div>
    </div>
  );
}