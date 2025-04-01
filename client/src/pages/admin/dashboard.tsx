import { useAuth } from "@/hooks/use-auth";
import { DashboardLayout } from "@/components/ui/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { User, Job, Order } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users, FileText, ClipboardList, DollarSign, CheckCircle, XCircle } from "lucide-react";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedWriter, setSelectedWriter] = useState<User | null>(null);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);

  // Fetch admin stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/admin/stats'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/stats');
      return response.json();
    },
    enabled: !!user
  });

  // Fetch all users
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/users');
      return response.json();
    },
    enabled: !!user
  });

  // Fetch all jobs
  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['/api/admin/jobs'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/jobs');
      return response.json();
    },
    enabled: !!user
  });

  // Fetch all orders
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['/api/admin/orders'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/orders');
      return response.json();
    },
    enabled: !!user
  });

  // Approve/reject writer mutation
  const updateWriterStatusMutation = useMutation({
    mutationFn: async ({ writerId, status }: { writerId: number, status: 'approved' | 'rejected' }) => {
      const response = await apiRequest('POST', `/api/admin/writers/${writerId}/${status}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: "Writer approval status has been updated.",
      });
      setApprovalDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update writer status. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleApproveWriter = () => {
    if (selectedWriter) {
      updateWriterStatusMutation.mutate({ writerId: selectedWriter.id, status: 'approved' });
    }
  };

  const handleRejectWriter = () => {
    if (selectedWriter) {
      updateWriterStatusMutation.mutate({ writerId: selectedWriter.id, status: 'rejected' });
    }
  };

  const handleViewWriterDetails = (writer: User) => {
    setSelectedWriter(writer);
    setApprovalDialogOpen(true);
  };

  // Filter pending writers for approval
  const pendingWriters = users.filter((user: User) => 
    user.role === 'writer' && user.approvalStatus === 'pending'
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.fullName || user?.username}
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalJobs || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalOrders || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats?.totalRevenue || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Writer Approval Cards */}
        {pendingWriters.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Pending Writer Approvals ({stats?.pendingWriters || 0})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingWriters.map((writer: User) => (
                <Card key={writer.id}>
                  <CardHeader>
                    <CardTitle>{writer.fullName || writer.username}</CardTitle>
                    <CardDescription>{writer.email}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4 line-clamp-3">{writer.bio || "No bio provided."}</p>
                    <Button variant="outline" className="w-full" onClick={() => handleViewWriterDetails(writer)}>
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Main Content */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="jobs">Jobs</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
          </TabsList>
          
          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <div className="rounded-md border">
              {usersLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No users found.</p>
                </div>
              ) : (
                <div className="relative w-full overflow-auto">
                  <table className="w-full caption-bottom text-sm">
                    <thead className="[&_tr]:border-b">
                      <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        <th className="h-12 px-4 text-left align-middle font-medium">Name</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Email</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Role</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Status</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                      {users.map((user: User) => (
                        <tr key={user.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                          <td className="p-4 align-middle font-medium">{user.fullName || user.username}</td>
                          <td className="p-4 align-middle">{user.email}</td>
                          <td className="p-4 align-middle">
                            <Badge variant="outline">
                              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                            </Badge>
                          </td>
                          <td className="p-4 align-middle">
                            {user.role === 'writer' && (
                              <Badge variant={
                                user.approvalStatus === 'approved' ? 'default' :
                                user.approvalStatus === 'rejected' ? 'destructive' :
                                'outline'
                              }>
                                {user.approvalStatus.charAt(0).toUpperCase() + user.approvalStatus.slice(1)}
                              </Badge>
                            )}
                          </td>
                          <td className="p-4 align-middle">{new Date(user.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Jobs Tab */}
          <TabsContent value="jobs" className="space-y-4">
            <div className="rounded-md border">
              {jobsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : jobs.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No jobs found.</p>
                </div>
              ) : (
                <div className="relative w-full overflow-auto">
                  <table className="w-full caption-bottom text-sm">
                    <thead className="[&_tr]:border-b">
                      <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        <th className="h-12 px-4 text-left align-middle font-medium">Title</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Client</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Budget</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Status</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Created</th>
                      </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                      {jobs.map((job: any) => (
                        <tr key={job.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                          <td className="p-4 align-middle font-medium">{job.title}</td>
                          <td className="p-4 align-middle">{job.client?.username || "Unknown"}</td>
                          <td className="p-4 align-middle">${job.budget}</td>
                          <td className="p-4 align-middle">
                            <Badge variant={
                              job.status === 'in_progress' ? 'default' :
                              job.status === 'completed' ? 'default' :
                              job.status === 'cancelled' ? 'destructive' :
                              'outline'
                            }>
                              {job.status.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                            </Badge>
                          </td>
                          <td className="p-4 align-middle">{new Date(job.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            <div className="rounded-md border">
              {ordersLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No orders found.</p>
                </div>
              ) : (
                <div className="relative w-full overflow-auto">
                  <table className="w-full caption-bottom text-sm">
                    <thead className="[&_tr]:border-b">
                      <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        <th className="h-12 px-4 text-left align-middle font-medium">ID</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Job Title</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Client</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Writer</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Amount</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Status</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Created</th>
                      </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                      {orders.map((order: any) => (
                        <tr key={order.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                          <td className="p-4 align-middle font-medium">#{order.id}</td>
                          <td className="p-4 align-middle">{order.job?.title || "Unknown"}</td>
                          <td className="p-4 align-middle">{order.client?.username || "Unknown"}</td>
                          <td className="p-4 align-middle">{order.writer?.username || "Unknown"}</td>
                          <td className="p-4 align-middle">${order.amount}</td>
                          <td className="p-4 align-middle">
                            <Badge variant={
                              order.status === 'in_progress' ? 'default' :
                              order.status === 'completed' ? 'default' :
                              order.status === 'cancelled' ? 'destructive' :
                              order.status === 'revision' ? 'outline' :
                              'outline'
                            }>
                              {order.status.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                            </Badge>
                          </td>
                          <td className="p-4 align-middle">{new Date(order.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Writer Approval Dialog */}
      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Writer Application</DialogTitle>
            <DialogDescription>
              Review the writer's application details to approve or reject.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <h3 className="font-medium mb-1">Profile</h3>
              <p className="text-sm text-muted-foreground mb-2">
                <span className="font-medium">Name:</span> {selectedWriter?.fullName}
              </p>
              <p className="text-sm text-muted-foreground mb-2">
                <span className="font-medium">Email:</span> {selectedWriter?.email}
              </p>
              <p className="text-sm text-muted-foreground mb-2">
                <span className="font-medium">Username:</span> {selectedWriter?.username}
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-1">Bio</h3>
              <p className="text-sm text-muted-foreground">
                {selectedWriter?.bio || "No bio provided."}
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-1">Writer Quiz</h3>
              <p className="text-sm text-muted-foreground">
                Sample content will display here when available.
              </p>
            </div>
          </div>
          <DialogFooter className="flex space-x-2 sm:space-x-0">
            <Button 
              variant="destructive" 
              onClick={handleRejectWriter}
              disabled={updateWriterStatusMutation.isPending}
            >
              {updateWriterStatusMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reject Application
            </Button>
            <Button 
              onClick={handleApproveWriter}
              disabled={updateWriterStatusMutation.isPending}
            >
              {updateWriterStatusMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Approve Writer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}