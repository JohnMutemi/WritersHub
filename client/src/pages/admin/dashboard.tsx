import React, { useState } from "react";
import { DashboardLayout } from "@/components/ui/dashboard-layout";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User, Job, Order, WriterQuiz } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { format, formatDistanceToNow } from "date-fns";
import { 
  Users, 
  Briefcase, 
  FileCheck, 
  DollarSign, 
  UserCheck,
  User as UserIcon,
  Mail,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Loader2,
  AlertTriangle
} from "lucide-react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function AdminDashboard() {
  const [selectedWriter, setSelectedWriter] = useState<User | null>(null);
  const [viewWriterDetails, setViewWriterDetails] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<WriterQuiz | null>(null);
  const [viewQuizDetails, setViewQuizDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  // Fetch admin stats
  const { data: adminStats, isLoading: isStatsLoading } = useQuery({
    queryKey: ["/api/stats/admin"],
  });

  // Fetch all users
  const { data: users, isLoading: isUsersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  // Fetch pending writers
  const pendingWriters = users?.filter(
    user => user.role === "writer" && user.approvalStatus === "pending"
  );

  // Fetch all orders
  const { data: orders, isLoading: isOrdersLoading } = useQuery<Order[]>({
    queryKey: ["/api/admin/orders"],
  });

  // Fetch all jobs
  const { data: jobs, isLoading: isJobsLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  // Fetch writer quizzes
  const { data: quizzes, isLoading: isQuizzesLoading } = useQuery<WriterQuiz[]>({
    queryKey: ["/api/admin/quizzes"],
  });

  // Approve writer mutation
  const approveWriterMutation = useMutation({
    mutationFn: async (writerId: number) => {
      const response = await apiRequest("POST", `/api/admin/writers/${writerId}/approve`, {});
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Writer approved",
        description: "The writer has been approved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setViewWriterDetails(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to approve writer",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reject writer mutation
  const rejectWriterMutation = useMutation({
    mutationFn: async (writerId: number) => {
      const response = await apiRequest("POST", `/api/admin/writers/${writerId}/reject`, {});
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Writer rejected",
        description: "The writer has been rejected",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setViewWriterDetails(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to reject writer",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getQuizForWriter = (writerId: number): WriterQuiz | undefined => {
    return quizzes?.find(quiz => quiz.writerId === writerId);
  };

  const handleViewWriter = (writer: User) => {
    setSelectedWriter(writer);
    setViewWriterDetails(true);
  };

  const handleViewQuiz = (quiz: WriterQuiz) => {
    setSelectedQuiz(quiz);
    setViewQuizDetails(true);
  };

  const handleApproveWriter = (writerId: number) => {
    approveWriterMutation.mutate(writerId);
  };

  const handleRejectWriter = (writerId: number) => {
    rejectWriterMutation.mutate(writerId);
  };

  // Filter pending writers by search term
  const filteredPendingWriters = pendingWriters?.filter(writer => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      writer.username.toLowerCase().includes(term) ||
      writer.fullName.toLowerCase().includes(term) ||
      writer.email.toLowerCase().includes(term)
    );
  });

  // Prepare chart data
  const getOrdersByStatus = () => {
    if (!orders) return [];
    
    const statusCounts = {
      in_progress: 0,
      completed: 0,
      cancelled: 0,
    };
    
    orders.forEach(order => {
      if (statusCounts.hasOwnProperty(order.status)) {
        statusCounts[order.status as keyof typeof statusCounts]++;
      }
    });
    
    return Object.entries(statusCounts).map(([name, value]) => ({
      name: name.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase()),
      value,
    }));
  };

  const getRecentOrdersData = () => {
    if (!orders) return [];
    
    const sortedOrders = [...orders]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);
    
    return sortedOrders.map(order => ({
      date: format(new Date(order.createdAt), "MMM d"),
      amount: order.amount,
    }));
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

  const isLoading = isStatsLoading || isUsersLoading || isOrdersLoading || isJobsLoading || isQuizzesLoading;

  return (
    <DashboardLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
          
          {/* Stats overview */}
          {isStatsLoading ? (
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="bg-white overflow-hidden shadow rounded-lg p-5 animate-pulse">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-gray-200 rounded-md p-3 h-12 w-12"></div>
                    <div className="ml-5 w-0 flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Total Users"
                value={adminStats?.totalUsers || 0}
                icon={<Users />}
                iconBgColor="bg-blue-100"
                iconColor="text-blue-600"
                actionText="Manage users"
                actionHref="/admin/users"
              />
              
              <StatCard
                title="Total Jobs"
                value={adminStats?.totalJobs || 0}
                icon={<Briefcase />}
                iconBgColor="bg-green-100"
                iconColor="text-green-600"
                actionText="View jobs"
                actionHref="/admin/jobs"
              />
              
              <StatCard
                title="Total Orders"
                value={adminStats?.totalOrders || 0}
                icon={<FileCheck />}
                iconBgColor="bg-purple-100"
                iconColor="text-purple-600"
                actionText="Manage orders"
                actionHref="/admin/orders"
              />
              
              <StatCard
                title="Total Revenue"
                value={`$${adminStats?.totalRevenue.toFixed(2) || "0.00"}`}
                icon={<DollarSign />}
                iconBgColor="bg-yellow-100"
                iconColor="text-yellow-600"
                actionText="View payments"
                actionHref="/admin/payments"
              />
            </div>
          )}
          
          {/* Charts */}
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders Revenue</CardTitle>
                <CardDescription>Order amounts for the last 10 orders</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={getRecentOrdersData()}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${value}`, 'Amount']} />
                      <Legend />
                      <Bar dataKey="amount" name="Order Amount" fill="#3182CE" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Orders by Status</CardTitle>
                <CardDescription>Distribution of orders by status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={getOrdersByStatus()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {getOrdersByStatus().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} orders`, 'Count']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Pending Writer Approvals */}
          <div className="mt-8">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle>Pending Writer Approvals</CardTitle>
                    <CardDescription>Writers waiting for approval</CardDescription>
                  </div>
                  <div className="mt-4 md:mt-0 w-full md:w-64">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by name or email"
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isUsersLoading || isQuizzesLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((item) => (
                      <div key={item} className="border rounded-md p-4 animate-pulse">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                            <div className="ml-4">
                              <div className="h-4 bg-gray-200 rounded w-40 mb-2"></div>
                              <div className="h-3 bg-gray-200 rounded w-24"></div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <div className="h-8 bg-gray-200 rounded w-16"></div>
                            <div className="h-8 bg-gray-200 rounded w-16"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredPendingWriters && filteredPendingWriters.length > 0 ? (
                  <div className="space-y-4">
                    {filteredPendingWriters.map(writer => {
                      const quiz = getQuizForWriter(writer.id);
                      return (
                        <div key={writer.id} className="border rounded-md p-4 hover:bg-gray-50">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                            <div className="flex items-center mb-4 sm:mb-0">
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-medium">
                                {writer.profileImage ? (
                                  <img 
                                    src={writer.profileImage} 
                                    alt={writer.fullName} 
                                    className="h-10 w-10 rounded-full"
                                  />
                                ) : (
                                  writer.fullName.substring(0, 2).toUpperCase()
                                )}
                              </div>
                              <div className="ml-4">
                                <h3 className="text-sm font-medium">{writer.fullName}</h3>
                                <div className="flex space-x-4 text-xs text-gray-500">
                                  <span className="flex items-center">
                                    <UserIcon className="h-3 w-3 mr-1" />
                                    {writer.username}
                                  </span>
                                  <span className="flex items-center">
                                    <Mail className="h-3 w-3 mr-1" />
                                    {writer.email}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                              {quiz ? (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleViewQuiz(quiz)}
                                >
                                  <FileText className="h-4 w-4 mr-1" />
                                  View Quiz
                                </Button>
                              ) : (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  disabled
                                >
                                  <AlertTriangle className="h-4 w-4 mr-1" />
                                  No Quiz
                                </Button>
                              )}
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleViewWriter(writer)}
                              >
                                View Profile
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No pending approvals</h3>
                    <p className="text-sm text-gray-500">
                      All writers have been reviewed and approved.
                    </p>
                  </div>
                )}
              </CardContent>
              {filteredPendingWriters && filteredPendingWriters.length > 0 && (
                <CardFooter className="border-t px-6 py-4 flex justify-between">
                  <div className="text-sm text-gray-500">
                    Showing {filteredPendingWriters.length} pending {filteredPendingWriters.length === 1 ? 'writer' : 'writers'}
                  </div>
                </CardFooter>
              )}
            </Card>
          </div>
          
          {/* Recent Activity */}
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest orders and jobs on the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="orders">
                  <TabsList className="mb-4">
                    <TabsTrigger value="orders">Recent Orders</TabsTrigger>
                    <TabsTrigger value="jobs">Recent Jobs</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="orders">
                    {isOrdersLoading ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map((item) => (
                          <div key={item} className="p-4 border rounded-md animate-pulse">
                            <div className="flex justify-between mb-2">
                              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                              <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                            </div>
                            <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
                            <div className="flex justify-between">
                              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : orders && orders.length > 0 ? (
                      <div className="space-y-4">
                        {orders
                          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                          .slice(0, 5)
                          .map(order => (
                            <div key={order.id} className="p-4 border rounded-md hover:bg-gray-50">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h4 className="text-sm font-medium">Order #{order.id}</h4>
                                  <p className="text-xs text-gray-500">
                                    Created {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                                  </p>
                                </div>
                                <Badge className={
                                  order.status === "in_progress" 
                                    ? "bg-blue-100 text-blue-800" 
                                    : order.status === "completed" 
                                      ? "bg-green-100 text-green-800" 
                                      : "bg-red-100 text-red-800"
                                }>
                                  {order.status.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-500 mt-2">
                                <div className="flex items-center">
                                  <UserIcon className="h-3 w-3 mr-1" />
                                  Writer #{order.writerId}
                                </div>
                                <div className="flex items-center">
                                  <UserIcon className="h-3 w-3 mr-1" />
                                  Client #{order.clientId}
                                </div>
                                <div className="flex items-center">
                                  <DollarSign className="h-3 w-3 mr-1" />
                                  ${order.amount.toFixed(2)}
                                </div>
                                <div className="flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Due: {format(new Date(order.deadline), "MMM d")}
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileCheck className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No orders yet</h3>
                        <p className="text-sm text-gray-500">
                          There are no orders in the system yet.
                        </p>
                      </div>
                    )}
                    
                    {orders && orders.length > 0 && (
                      <div className="mt-4 text-center">
                        <Button variant="outline" size="sm" asChild>
                          <Link href="/admin/orders">View All Orders</Link>
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="jobs">
                    {isJobsLoading ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map((item) => (
                          <div key={item} className="p-4 border rounded-md animate-pulse">
                            <div className="flex justify-between mb-2">
                              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                              <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                            </div>
                            <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
                            <div className="flex justify-between">
                              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : jobs && jobs.length > 0 ? (
                      <div className="space-y-4">
                        {jobs
                          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                          .slice(0, 5)
                          .map(job => (
                            <div key={job.id} className="p-4 border rounded-md hover:bg-gray-50">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h4 className="text-sm font-medium">{job.title}</h4>
                                  <p className="text-xs text-gray-500">
                                    Posted {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                                  </p>
                                </div>
                                <Badge className={
                                  job.status === "open" 
                                    ? "bg-green-100 text-green-800" 
                                    : job.status === "in_progress" 
                                      ? "bg-blue-100 text-blue-800" 
                                      : job.status === "completed" 
                                        ? "bg-purple-100 text-purple-800" 
                                        : "bg-red-100 text-red-800"
                                }>
                                  {job.status.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-500 mt-2">
                                <div className="flex items-center">
                                  <UserIcon className="h-3 w-3 mr-1" />
                                  Client #{job.clientId}
                                </div>
                                <div className="flex items-center">
                                  <FileText className="h-3 w-3 mr-1" />
                                  {job.pages} pages
                                </div>
                                <div className="flex items-center">
                                  <DollarSign className="h-3 w-3 mr-1" />
                                  ${job.budget}
                                </div>
                                <div className="flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {job.deadline} days
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No jobs yet</h3>
                        <p className="text-sm text-gray-500">
                          There are no jobs in the system yet.
                        </p>
                      </div>
                    )}
                    
                    {jobs && jobs.length > 0 && (
                      <div className="mt-4 text-center">
                        <Button variant="outline" size="sm" asChild>
                          <Link href="/admin/jobs">View All Jobs</Link>
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Writer Details Dialog */}
      {selectedWriter && (
        <Dialog open={viewWriterDetails} onOpenChange={setViewWriterDetails}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Writer Profile</DialogTitle>
              <DialogDescription>
                Review writer information and approve or reject
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="h-14 w-14 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-medium">
                  {selectedWriter.profileImage ? (
                    <img 
                      src={selectedWriter.profileImage} 
                      alt={selectedWriter.fullName} 
                      className="h-14 w-14 rounded-full"
                    />
                  ) : (
                    selectedWriter.fullName.substring(0, 2).toUpperCase()
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-medium">{selectedWriter.fullName}</h3>
                  <p className="text-sm text-gray-500">@{selectedWriter.username}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-500">Email</Label>
                <div className="text-sm mt-1">{selectedWriter.email}</div>
              </div>
              
              {selectedWriter.bio && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Bio</Label>
                  <div className="text-sm mt-1 whitespace-pre-wrap">{selectedWriter.bio}</div>
                </div>
              )}
              
              <div>
                <Label className="text-sm font-medium text-gray-500">Account Created</Label>
                <div className="text-sm mt-1">
                  {format(new Date(selectedWriter.createdAt), "MMM d, yyyy 'at' h:mm a")}
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-500">Quiz Status</Label>
                <div className="text-sm mt-1">
                  {getQuizForWriter(selectedWriter.id) ? (
                    <span className="text-green-600 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Quiz Completed
                    </span>
                  ) : (
                    <span className="text-red-600 flex items-center">
                      <XCircle className="h-4 w-4 mr-1" />
                      No Quiz Submitted
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <DialogFooter className="space-x-2">
              <Button
                variant="outline"
                onClick={() => setViewWriterDetails(false)}
                disabled={approveWriterMutation.isPending || rejectWriterMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleRejectWriter(selectedWriter.id)}
                disabled={approveWriterMutation.isPending || rejectWriterMutation.isPending}
              >
                {rejectWriterMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  "Reject Writer"
                )}
              </Button>
              <Button
                onClick={() => handleApproveWriter(selectedWriter.id)}
                disabled={approveWriterMutation.isPending || rejectWriterMutation.isPending}
              >
                {approveWriterMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Approving...
                  </>
                ) : (
                  "Approve Writer"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Quiz Details Dialog */}
      {selectedQuiz && (
        <Dialog open={viewQuizDetails} onOpenChange={setViewQuizDetails}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Writer Quiz Results</DialogTitle>
              <DialogDescription>
                Quiz submitted by Writer #{selectedQuiz.writerId}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">Quiz Score</Label>
                <div className="text-lg font-medium mt-1">
                  {selectedQuiz.score}/100
                  <span className={`text-sm ml-2 ${
                    selectedQuiz.score >= 70 ? "text-green-600" : "text-red-600"
                  }`}>
                    ({selectedQuiz.score >= 70 ? "Passed" : "Failed"})
                  </span>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-500">Submitted On</Label>
                <div className="text-sm mt-1">
                  {format(new Date(selectedQuiz.submittedAt), "MMM d, yyyy 'at' h:mm a")}
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-500">Quiz Answers</Label>
                <div className="mt-2 border rounded-md p-4 max-h-60 overflow-y-auto">
                  <pre className="text-sm whitespace-pre-wrap">{selectedQuiz.answers}</pre>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewQuizDetails(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  );
}
