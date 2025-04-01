import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import { ProtectedRoute } from "./lib/protected-route";
import WriterDashboard from "@/pages/writer/dashboard";
import WriterAvailableJobs from "@/pages/writer/available-jobs";
import WriterPendingBids from "@/pages/writer/pending-bids";
import WriterActiveOrders from "@/pages/writer/active-orders";
import WriterOrderHistory from "@/pages/writer/order-history";
import WriterEarnings from "@/pages/writer/earnings";
import WriterProfile from "@/pages/writer/profile";
import ClientDashboard from "@/pages/client/dashboard";
import ClientPostJob from "@/pages/client/post-job";
import ClientManageOrders from "@/pages/client/manage-orders";
import AdminDashboard from "@/pages/admin/dashboard";
import { useAuth } from "./hooks/use-auth";
import { Loader2 } from "lucide-react";

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <Switch>
      {/* Auth route */}
      <Route path="/auth" component={AuthPage} />

      {/* Writer routes */}
      <ProtectedRoute path="/" component={() => 
        user?.role === "writer" ? <WriterDashboard /> : 
        user?.role === "client" ? <ClientDashboard /> : 
        <AdminDashboard />
      } />
      <ProtectedRoute path="/writer/available-jobs" component={WriterAvailableJobs} />
      <ProtectedRoute path="/writer/pending-bids" component={WriterPendingBids} />
      <ProtectedRoute path="/writer/active-orders" component={WriterActiveOrders} />
      <ProtectedRoute path="/writer/order-history" component={WriterOrderHistory} />
      <ProtectedRoute path="/writer/earnings" component={WriterEarnings} />
      <ProtectedRoute path="/writer/profile" component={WriterProfile} />

      {/* Client routes */}
      <ProtectedRoute path="/client/post-job" component={ClientPostJob} />
      <ProtectedRoute path="/client/manage-orders" component={ClientManageOrders} />

      {/* Admin routes */}
      <ProtectedRoute path="/admin" component={AdminDashboard} />

      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
