import { useAuth } from "@/hooks/use-auth";
import { Loader2, AlertTriangle } from "lucide-react";
import { Redirect, Route } from "wouter";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType;
  allowedRoles?: string[];
}

export function ProtectedRoute({
  path,
  component: Component,
  allowedRoles = [],
}: ProtectedRouteProps) {
  return (
    <Route path={path}>
      {() => {
        const { user, isLoading } = useAuth();

        // Loading state
        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          );
        }

        // Not authenticated
        if (!user) {
          return <Redirect to="/auth" />;
        }

        // Check role access if roles are specified
        if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
          return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
              <Alert variant="destructive" className="max-w-lg mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Access Denied</AlertTitle>
                <AlertDescription>
                  You don't have permission to access this page. This area is restricted to {allowedRoles.join(", ")} roles.
                </AlertDescription>
              </Alert>
              
              {/* Redirect based on user role */}
              {user.role === "writer" && (
                <Button asChild>
                  <a href="/writer">Go to Writer Dashboard</a>
                </Button>
              )}
              {user.role === "client" && (
                <Button asChild>
                  <a href="/client">Go to Client Dashboard</a>
                </Button>
              )}
              {user.role === "admin" && (
                <Button asChild>
                  <a href="/admin">Go to Admin Dashboard</a>
                </Button>
              )}
            </div>
          );
        }

        // All checks passed, render the component
        return <Component />;
      }}
    </Route>
  );
}
