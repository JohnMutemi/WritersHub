import { Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
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
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

function App() {
  return (
    <AuthProvider>
      <Toaster />
      <Switch>
        {/* Public routes */}
        <Route path="/auth" component={AuthPage} />
        
        {/* Protected writer routes */}
        <ProtectedRoute path="/" component={WriterDashboard} allowedRoles={["writer"]} />
        <ProtectedRoute path="/writer/available-jobs" component={WriterAvailableJobs} allowedRoles={["writer"]} />
        <ProtectedRoute path="/writer/pending-bids" component={WriterPendingBids} allowedRoles={["writer"]} />
        <ProtectedRoute path="/writer/active-orders" component={WriterActiveOrders} allowedRoles={["writer"]} />
        <ProtectedRoute path="/writer/order-history" component={WriterOrderHistory} allowedRoles={["writer"]} />
        <ProtectedRoute path="/writer/earnings" component={WriterEarnings} allowedRoles={["writer"]} />
        <ProtectedRoute path="/writer/profile" component={WriterProfile} allowedRoles={["writer"]} />
        
        {/* Protected client routes */}
        <ProtectedRoute path="/client/dashboard" component={ClientDashboard} allowedRoles={["client"]} />
        <ProtectedRoute path="/client/post-job" component={ClientPostJob} allowedRoles={["client"]} />
        <ProtectedRoute path="/client/manage-orders" component={ClientManageOrders} allowedRoles={["client"]} />
        
        {/* Protected admin routes */}
        <ProtectedRoute path="/admin/dashboard" component={AdminDashboard} allowedRoles={["admin"]} />
        
        {/* Fallback route */}
        <Route component={NotFound} />
      </Switch>
    </AuthProvider>
  );
}

export default App;
