import { useAuth } from "@/hooks/use-auth";
import { DashboardLayout } from "@/components/ui/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, QueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { Job, Bid, Order } from "@shared/schema";
import { BidModal } from "@/components/bid-modal";
import { JobCard } from "@/components/job-card";
import { OrderItem } from "@/components/order-item";
import { Loader2, AlertCircle, CheckCircle, Clock } from "lucide-react";

export default function WriterDashboard() {
  const { user } = useAuth();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [bidModalOpen, setBidModalOpen] = useState(false);

  // Fetch writer stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/writer/stats'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/writer/stats');
      return response.json();
    },
    enabled: !!user
  });

  // Fetch available jobs
  const { data: availableJobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['/api/jobs/available'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/jobs/available');
      return response.json();
    },
    enabled: !!user
  });

  // Fetch writer's bids
  const { data: myBids = [], isLoading: bidsLoading } = useQuery({
    queryKey: ['/api/writer/bids'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/writer/bids');
      return response.json();
    },
    enabled: !!user
  });

  // Fetch writer's orders
  const { data: myOrders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['/api/writer/orders'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/writer/orders');
      return response.json();
    },
    enabled: !!user
  });

  const handlePlaceBid = (job: Job) => {
    setSelectedJob(job);
    setBidModalOpen(true);
  };

  const handleViewJob = (job: Job) => {
    setSelectedJob(job);
    // Implement job detail view
  };

  const handleViewOrderDetails = (order: Order) => {
    // Implement order detail view
  };

  const handleDeliverOrder = (order: Order) => {
    // Implement order delivery logic
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Writer Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.fullName || user?.username}
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats?.balance || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.activeOrders || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Completed Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.completedOrders || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending Bids</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.pendingBids || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="available-jobs" className="space-y-4">
          <TabsList>
            <TabsTrigger value="available-jobs">Available Jobs</TabsTrigger>
            <TabsTrigger value="my-bids">My Bids</TabsTrigger>
            <TabsTrigger value="active-orders">Active Orders</TabsTrigger>
            <TabsTrigger value="completed-orders">Completed Orders</TabsTrigger>
          </TabsList>
          
          {/* Available Jobs Tab */}
          <TabsContent value="available-jobs" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {jobsLoading ? (
                <div className="col-span-full flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : availableJobs.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <p className="text-muted-foreground">No available jobs found. Check back later!</p>
                </div>
              ) : (
                availableJobs.map((job: Job) => (
                  <JobCard 
                    key={job.id} 
                    job={job} 
                    onBid={handlePlaceBid}
                    onView={handleViewJob}
                  />
                ))
              )}
            </div>
          </TabsContent>
          
          {/* My Bids Tab */}
          <TabsContent value="my-bids" className="space-y-4">
            <div className="rounded-md border">
              {bidsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : myBids.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">You haven't placed any bids yet.</p>
                </div>
              ) : (
                <div className="relative w-full overflow-auto">
                  <table className="w-full caption-bottom text-sm">
                    <thead className="[&_tr]:border-b">
                      <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        <th className="h-12 px-4 text-left align-middle font-medium">Job Title</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Amount</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Status</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                      {myBids.map((bid: any) => (
                        <tr key={bid.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                          <td className="p-4 align-middle">{bid.job.title}</td>
                          <td className="p-4 align-middle">${bid.amount}</td>
                          <td className="p-4 align-middle">
                            <Badge variant={
                              bid.status === 'accepted' ? 'default' :
                              bid.status === 'rejected' ? 'destructive' :
                              'outline'
                            }>
                              {bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
                            </Badge>
                          </td>
                          <td className="p-4 align-middle">{new Date(bid.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Active Orders Tab */}
          <TabsContent value="active-orders" className="space-y-4">
            <div className="space-y-4">
              {ordersLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                myOrders
                  .filter((order: Order) => order.status === 'in_progress' || order.status === 'revision')
                  .map((order: Order) => (
                    <OrderItem
                      key={order.id}
                      order={order}
                      onViewDetails={() => handleViewOrderDetails(order)}
                      onDeliver={() => handleDeliverOrder(order)}
                    />
                  ))
              )}
              {!ordersLoading && myOrders.filter((order: Order) => order.status === 'in_progress' || order.status === 'revision').length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">You don't have any active orders at the moment.</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Completed Orders Tab */}
          <TabsContent value="completed-orders" className="space-y-4">
            <div className="space-y-4">
              {ordersLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                myOrders
                  .filter((order: Order) => order.status === 'completed')
                  .map((order: Order) => (
                    <OrderItem
                      key={order.id}
                      order={order}
                      onViewDetails={() => handleViewOrderDetails(order)}
                    />
                  ))
              )}
              {!ordersLoading && myOrders.filter((order: Order) => order.status === 'completed').length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">You don't have any completed orders yet.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Bid Modal */}
      <BidModal 
        job={selectedJob} 
        isOpen={bidModalOpen} 
        onClose={() => setBidModalOpen(false)} 
      />
    </DashboardLayout>
  );
}