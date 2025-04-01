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
import { Loader2 } from "lucide-react";

// Simple App without complex routing logic
function App() {
  return (
    <>
      <Switch>
        <Route path="/auth" component={AuthPage} />
        <Route path="/" component={WriterDashboard} />
        <Route path="/writer/available-jobs" component={WriterAvailableJobs} />
        <Route path="/writer/pending-bids" component={WriterPendingBids} />
        <Route path="/writer/active-orders" component={WriterActiveOrders} />
        <Route path="/writer/order-history" component={WriterOrderHistory} />
        <Route path="/writer/earnings" component={WriterEarnings} />
        <Route path="/writer/profile" component={WriterProfile} />
        <Route path="/client/dashboard" component={ClientDashboard} />
        <Route path="/client/post-job" component={ClientPostJob} />
        <Route path="/client/manage-orders" component={ClientManageOrders} />
        <Route path="/admin/dashboard" component={AdminDashboard} />
        <Route component={NotFound} />
      </Switch>
      <Toaster />
    </>
  );
}

export default App;
