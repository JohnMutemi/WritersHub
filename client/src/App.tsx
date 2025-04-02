import { Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";
import WriterDashboard from "@/pages/writer/dashboard";
import WriterJobs from "@/pages/writer/jobs";
import WriterOrders from "@/pages/writer/orders";
import ClientDashboard from "@/pages/client/dashboard";
import ClientJobs from "@/pages/client/jobs";
import ClientOrders from "@/pages/client/orders";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminUsers from "@/pages/admin/users";
import AdminJobs from "@/pages/admin/jobs";
import AdminOrders from "@/pages/admin/orders";
import AdminAnalytics from "@/pages/admin/analytics";
import Settings from "@/pages/settings";
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
          
          {/* Writer routes */}
          <ProtectedRoute path="/writer" component={WriterDashboard} allowedRoles={["writer"]} />
          <ProtectedRoute path="/writer/jobs" component={WriterJobs} allowedRoles={["writer"]} />
          <ProtectedRoute path="/writer/orders" component={WriterOrders} allowedRoles={["writer"]} />
          
          {/* Client routes */}
          <ProtectedRoute path="/client" component={ClientDashboard} allowedRoles={["client"]} />
          <ProtectedRoute path="/client/jobs" component={ClientJobs} allowedRoles={["client"]} />
          <ProtectedRoute path="/client/orders" component={ClientOrders} allowedRoles={["client"]} />
          
          {/* Admin routes */}
          <ProtectedRoute path="/admin" component={AdminDashboard} allowedRoles={["admin"]} />
          <ProtectedRoute path="/admin/users" component={AdminUsers} allowedRoles={["admin"]} />
          <ProtectedRoute path="/admin/jobs" component={AdminJobs} allowedRoles={["admin"]} />
          <ProtectedRoute path="/admin/orders" component={AdminOrders} allowedRoles={["admin"]} />
          <ProtectedRoute path="/admin/analytics" component={AdminAnalytics} allowedRoles={["admin"]} />
          
          {/* Common protected routes */}
          <ProtectedRoute path="/settings" component={Settings} />
          
          {/* Fallback route */}
          <Route component={NotFound} />
        </Switch>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
