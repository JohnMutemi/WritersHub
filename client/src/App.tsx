import { Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";
import WriterDashboard from "@/pages/writer/dashboard";
import ClientDashboard from "@/pages/client/dashboard";
import AdminDashboard from "@/pages/admin/dashboard";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "@/hooks/use-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Create a client
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Toaster />
        <Switch>
          {/* Public routes */}
          <Route path="/" component={HomePage} />
          <Route path="/auth" component={AuthPage} />
          
          {/* Protected role-specific routes */}
          <ProtectedRoute path="/writer" component={WriterDashboard} allowedRoles={["writer"]} />
          <ProtectedRoute path="/client" component={ClientDashboard} allowedRoles={["client"]} />
          <ProtectedRoute path="/admin" component={AdminDashboard} allowedRoles={["admin"]} />
          
          {/* Fallback route */}
          <Route component={NotFound} />
        </Switch>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
