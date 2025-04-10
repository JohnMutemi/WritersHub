import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/ui/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Job, Order, Bid } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";
import { 
  FileText, 
  DollarSign, 
  Calendar, 
  Clock, 
  User, 
  CheckCircle, 
  Info, 
  AlertTriangle, 
  XCircle, 
  Loader2
} from "lucide-react";

export default function ClientManageOrders() {
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("all");
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [selectedBidId, setSelectedBidId] = useState<number | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [viewJobDetails, setViewJobDetails] = useState(false);
  const [viewBidDetails, setViewBidDetails] = useState(false);
  const [viewOrderDetails, setViewOrderDetails] = useState(false);
  const { toast } = useToast();

  // Parse query parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(location.split("?")[1]);
    const tab = searchParams.get("tab");
    const jobId = searchParams.get("job");
    const bidId = searchParams.get("bid");
    const orderId = searchParams.get("id");

    if (tab) {
      setActiveTab(tab);
    }

    if (jobId) {
      setSelectedJobId(Number(jobId));
      setViewJobDetails(true);
    }

    if (bidId) {
      setSelectedBidId(Number(bidId));
      setViewBidDetails(true);
    }

    if (orderId) {
      setSelectedOrderId(Number(orderId));
      setViewOrderDetails(true);
    }
  }, [location]);

  // Fetch client's jobs
  const { data: jobs, isLoading: isJobsLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  // Fetch client's orders
  const { data: orders, isLoading: isOrdersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  // Fetch bids for the client's jobs
  const { data: bids, isLoading: isBidsLoading } = useQuery<Bid[]>({
    queryKey: ["/api/bids"],
  });

  // Accept bid mutation
  const acceptBidMutation = useMutation({
    mutationFn: async (bidId: number) => {
      const response = await apiRequest("POST", `/api/bids/${bidId}/accept`, {});
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Bid accepted",
        description: "The order has been created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bids"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setViewBidDetails(false);
      setActiveTab("active");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to accept bid",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter jobs based on selected tab
  const filteredJobs = jobs?.filter(job => {
    if (activeTab === "all") return true;
    if (activeTab === "open") return job.status === "open";
    if (activeTab === "active") return job.status === "in_progress";
    if (activeTab === "completed") return job.status === "completed";
    return true;
  });

  // Filter orders based on selected tab
  const filteredOrders = orders?.filter(order => {
    if (activeTab === "all") return true;
    if (activeTab === "active") return order.status === "in_progress";
    if (activeTab === "completed") return order.status === "completed";
    if (activeTab === "cancelled") return order.status === "cancelled";
    return true;
  });

  // Get all bids for a job
  const getBidsForJob = (jobId: number) => {
    return bids?.filter(bid => bid.jobId === jobId) || [];
  };

  // Get job by id
  const getJobById = (jobId: number | null): Job | undefined => {
    if (!jobId) return undefined;
    return jobs?.find(job => job.id === jobId);
  };

  // Get bid by id
  const getBidById = (bidId: number | null): Bid | undefined => {
    if (!bidId) return undefined;
    return bids?.find(bid => bid.id === bidId);
  };

  // Get order by id
  const getOrderById = (orderId: number | null): Order | undefined => {
    if (!orderId) return undefined;
    return orders?.find(order => order.id === orderId);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-purple-100 text-purple-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatStatus = (status: string) => {
    return status.replace("_", " ").replace(/\b\w/g, char => char.toUpperCase());
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <Info className="h-5 w-5 text-green-500" />;
      case "in_progress":
        return <Clock className="h-5 w-5 text-blue-500" />;
      case "completed":
        return <CheckCircle className="h-5 w-5 text-purple-500" />;
      case "cancelled":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  const handleAcceptBid = (bidId: number) => {
    acceptBidMutation.mutate(bidId);
  };

  // Selected job, bid, and order for details view
  const selectedJob = getJobById(selectedJobId);
  const selectedBid = getBidById(selectedBidId);
  const selectedOrder = getOrderById(selectedOrderId);

  const isLoading = isJobsLoading || isOrdersLoading || isBidsLoading;

  return (
    <DashboardLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">Manage Orders</h1>
          
          <div className="mt-6">
            <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="open">Open Jobs</TabsTrigger>
                <TabsTrigger value="active">Active Orders</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
              </TabsList>
              
              <TabsContent value={activeTab}>
                {isLoading ? (
                  <div className="grid gap-4 grid-cols-1 animate-pulse">
                    {[1, 2, 3].map(item => (
                      <Card key={item}>
                        <CardHeader className="pb-2">
                          <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="h-4 bg-gray-200 rounded w-full"></div>
                            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="h-4 bg-gray-200 rounded"></div>
                              <div className="h-4 bg-gray-200 rounded"></div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <>
                    {/* Jobs Section */}
                    {(activeTab === "all" || activeTab === "open") && filteredJobs && filteredJobs.length > 0 && (
                      <div className="mb-8">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Jobs</h2>
                        <div className="grid gap-4 grid-cols-1">
                          {filteredJobs.map(job => {
                            const jobBids = getBidsForJob(job.id);
                            const pendingBids = jobBids.filter(bid => bid.status === "pending");
                            
                            return (
                              <Card key={job.id} className="relative overflow-hidden">
                                {/* Status indicator */}
                                <div className="absolute top-0 left-0 w-1 h-full bg-primary-600"></div>
                                
                                <CardHeader>
                                  <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg">{job.title}</CardTitle>
                                    <Badge className={getStatusBadgeColor(job.status)}>
                                      {formatStatus(job.status)}
                                    </Badge>
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    Posted {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                                  </div>
                                </CardHeader>
                                <CardContent>
                                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{job.description}</p>
                                  
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                    <div className="flex items-center">
                                      <FileText className="h-4 w-4 text-gray-400 mr-2" />
                                      <span className="text-sm">{job.pages} pages</span>
                                    </div>
                                    <div className="flex items-center">
                                      <Clock className="h-4 w-4 text-gray-400 mr-2" />
                                      <span className="text-sm">{job.deadline} days</span>
                                    </div>
                                    <div className="flex items-center">
                                      <DollarSign className="h-4 w-4 text-gray-400 mr-2" />
                                      <span className="text-sm">Budget: ${job.budget}</span>
                                    </div>
                                    <div className="flex items-center">
                                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                                      <span className="text-sm">{pendingBids.length} pending bid{pendingBids.length !== 1 ? 's' : ''}</span>
                                    </div>
                                  </div>
                                  
                                  {pendingBids.length > 0 ? (
                                    <div className="space-y-3">
                                      <h4 className="text-sm font-medium">Recent Bids</h4>
                                      <div className="space-y-2">
                                        {pendingBids.slice(0, 3).map(bid => (
                                          <div key={bid.id} className="flex items-center justify-between border p-2 rounded-md">
                                            <div>
                                              <div className="text-sm font-medium">Writer #{bid.writerId}</div>
                                              <div className="text-xs text-gray-500">${bid.amount} • {bid.deliveryTime} days</div>
                                            </div>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => {
                                                setSelectedBidId(bid.id);
                                                setSelectedJobId(job.id);
                                                setViewBidDetails(true);
                                              }}
                                            >
                                              View Bid
                                            </Button>
                                          </div>
                                        ))}
                                      </div>
                                      
                                      {pendingBids.length > 3 && (
                                        <Button 
                                          variant="link" 
                                          size="sm" 
                                          className="text-primary-600"
                                          onClick={() => {
                                            setSelectedJobId(job.id);
                                            setViewJobDetails(true);
                                          }}
                                        >
                                          View all {pendingBids.length} bids
                                        </Button>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="text-sm text-gray-500 italic">No bids yet</div>
                                  )}
                                  
                                  <div className="mt-4 flex justify-end">
                                    <Button 
                                      variant="outline"
                                      onClick={() => {
                                        setSelectedJobId(job.id);
                                        setViewJobDetails(true);
                                      }}
                                    >
                                      View Details
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {/* Orders Section */}
                    {filteredOrders && filteredOrders.length > 0 ? (
                      <div>
                        {(activeTab === "all" || activeTab !== "open") && (
                          <h2 className="text-lg font-medium text-gray-900 mb-4">Orders</h2>
                        )}
                        
                        <div className="grid gap-4 grid-cols-1">
                          {filteredOrders.map(order => {
                            const job = getJobById(order.jobId);
                            return (
                              <Card key={order.id} className="relative overflow-hidden">
                                {/* Status indicator */}
                                <div 
                                  className={`absolute top-0 left-0 w-1 h-full ${
                                    order.status === "in_progress" 
                                      ? "bg-blue-500" 
                                      : order.status === "completed" 
                                        ? "bg-green-500" 
                                        : "bg-red-500"
                                  }`}
                                ></div>
                                
                                <CardHeader>
                                  <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg">{job?.title || `Order #${order.id}`}</CardTitle>
                                    <Badge className={getStatusBadgeColor(order.status)}>
                                      {formatStatus(order.status)}
                                    </Badge>
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    Created {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                                  </div>
                                </CardHeader>
                                <CardContent>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                    <div className="flex items-center">
                                      <User className="h-4 w-4 text-gray-400 mr-2" />
                                      <span className="text-sm">Writer #{order.writerId}</span>
                                    </div>
                                    <div className="flex items-center">
                                      <DollarSign className="h-4 w-4 text-gray-400 mr-2" />
                                      <span className="text-sm">${order.amount.toFixed(2)}</span>
                                    </div>
                                    <div className="flex items-center">
                                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                                      <span className="text-sm">Due: {format(new Date(order.deadline), "MMM d, yyyy")}</span>
                                    </div>
                                    {order.completedAt && (
                                      <div className="flex items-center">
                                        <CheckCircle className="h-4 w-4 text-gray-400 mr-2" />
                                        <span className="text-sm">Completed: {format(new Date(order.completedAt), "MMM d, yyyy")}</span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="mt-4 flex justify-end">
                                    <Button 
                                      variant="outline"
                                      onClick={() => {
                                        setSelectedOrderId(order.id);
                                        setViewOrderDetails(true);
                                      }}
                                    >
                                      View Details
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white shadow overflow-hidden sm:rounded-lg p-8 text-center">
                        {activeTab === "open" ? (
                          <>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No open jobs</h3>
                            <p className="text-gray-500 mb-4">
                              You don't have any open jobs at the moment.
                            </p>
                            <Button onClick={() => setLocation('/client/post-job')}>
                              Post a New Job
                            </Button>
                          </>
                        ) : activeTab === "active" ? (
                          <>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No active orders</h3>
                            <p className="text-gray-500 mb-4">
                              You don't have any active orders at the moment.
                            </p>
                            <Button onClick={() => setActiveTab('open')}>
                              View Open Jobs
                            </Button>
                          </>
                        ) : activeTab === "completed" ? (
                          <>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No completed orders</h3>
                            <p className="text-gray-500 mb-4">
                              You don't have any completed orders yet.
                            </p>
                          </>
                        ) : activeTab === "cancelled" ? (
                          <>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No cancelled orders</h3>
                            <p className="text-gray-500 mb-4">
                              You don't have any cancelled orders.
                            </p>
                          </>
                        ) : (
                          <>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs or orders found</h3>
                            <p className="text-gray-500 mb-4">
                              You haven't posted any jobs yet.
                            </p>
                            <Button onClick={() => setLocation('/client/post-job')}>
                              Post Your First Job
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      
      {/* Job Details Dialog */}
      {selectedJob && (
        <Dialog open={viewJobDetails} onOpenChange={setViewJobDetails}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                {getStatusIcon(selectedJob.status)}
                <span className="ml-2">{selectedJob.title}</span>
              </DialogTitle>
              <DialogDescription>
                Posted {formatDistanceToNow(new Date(selectedJob.createdAt), { addSuffix: true })}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Job Description</h4>
                <p className="text-sm mt-1 whitespace-pre-wrap">{selectedJob.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Category</h4>
                  <p className="text-base">{selectedJob.category}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Pages</h4>
                  <p className="text-base">{selectedJob.pages}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Budget</h4>
                  <p className="text-base">${selectedJob.budget}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Deadline</h4>
                  <p className="text-base">{selectedJob.deadline} days</p>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500">Status</h4>
                <div className="flex items-center mt-1">
                  <Badge className={getStatusBadgeColor(selectedJob.status)}>
                    {formatStatus(selectedJob.status)}
                  </Badge>
                </div>
              </div>
              
              {/* Bids section */}
              {selectedJob.status === "open" && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Bids</h4>
                  {getBidsForJob(selectedJob.id).filter(bid => bid.status === "pending").length > 0 ? (
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {getBidsForJob(selectedJob.id)
                        .filter(bid => bid.status === "pending")
                        .map(bid => (
                          <div key={bid.id} className="border rounded-md p-3">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <div className="text-sm font-medium">Writer #{bid.writerId}</div>
                                <div className="text-xs text-gray-500">
                                  Bid: ${bid.amount} • Delivery: {bid.deliveryTime} days
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedBidId(bid.id);
                                    setViewBidDetails(true);
                                    setViewJobDetails(false);
                                  }}
                                >
                                  View
                                </Button>
                                <Button 
                                  size="sm"
                                  onClick={() => handleAcceptBid(bid.id)}
                                  disabled={acceptBidMutation.isPending}
                                >
                                  Accept
                                </Button>
                              </div>
                            </div>
                            <p className="text-xs text-gray-600 line-clamp-2">{bid.coverLetter}</p>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <Alert className="bg-blue-50 border-blue-200 text-blue-700">
                      <Info className="h-4 w-4 text-blue-500" />
                      <AlertDescription>
                        No bids yet. Writers will be able to place bids on this job.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewJobDetails(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Bid Details Dialog */}
      {selectedBid && (
        <Dialog open={viewBidDetails} onOpenChange={setViewBidDetails}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Bid Details</DialogTitle>
              <DialogDescription>
                Bid from Writer #{selectedBid.writerId} for job #{selectedBid.jobId}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Bid Amount</h4>
                  <p className="text-base">${selectedBid.amount}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Delivery Time</h4>
                  <p className="text-base">{selectedBid.deliveryTime} days</p>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500">Cover Letter</h4>
                <p className="text-sm whitespace-pre-wrap mt-1">{selectedBid.coverLetter}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500">Status</h4>
                <div className="flex items-center mt-1">
                  <Badge className={getStatusBadgeColor(selectedBid.status)}>
                    {formatStatus(selectedBid.status)}
                  </Badge>
                </div>
              </div>
            </div>
            
            <DialogFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setViewBidDetails(false)}
                disabled={acceptBidMutation.isPending}
              >
                Close
              </Button>
              {selectedBid.status === "pending" && (
                <Button 
                  onClick={() => handleAcceptBid(selectedBid.id)}
                  disabled={acceptBidMutation.isPending}
                >
                  {acceptBidMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Accept Bid"
                  )}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Order Details Dialog */}
      {selectedOrder && (
        <Dialog open={viewOrderDetails} onOpenChange={setViewOrderDetails}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                {selectedOrder.status === "in_progress" ? (
                  <Clock className="h-5 w-5 text-blue-500 mr-2" />
                ) : selectedOrder.status === "completed" ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500 mr-2" />
                )}
                <span>Order Details</span>
              </DialogTitle>
              <DialogDescription>
                Order #{selectedOrder.id} - {formatStatus(selectedOrder.status)}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Job Title</h4>
                <p className="text-base">{getJobById(selectedOrder.jobId)?.title || `Job #${selectedOrder.jobId}`}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Writer</h4>
                  <p className="text-base">Writer #{selectedOrder.writerId}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Amount</h4>
                  <p className="text-base">${selectedOrder.amount.toFixed(2)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Created On</h4>
                  <p className="text-base">{format(new Date(selectedOrder.createdAt), "MMM d, yyyy")}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Deadline</h4>
                  <p className="text-base">{format(new Date(selectedOrder.deadline), "MMM d, yyyy")}</p>
                </div>
                
                {selectedOrder.completedAt && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Completed On</h4>
                    <p className="text-base">{format(new Date(selectedOrder.completedAt), "MMM d, yyyy")}</p>
                  </div>
                )}
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500">Status</h4>
                <div className="flex items-center mt-1">
                  <Badge className={getStatusBadgeColor(selectedOrder.status)}>
                    {formatStatus(selectedOrder.status)}
                  </Badge>
                </div>
              </div>
              
              {/* Order status alerts */}
              {selectedOrder.status === "in_progress" && (
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertTriangle className="h-4 w-4 text-blue-500" />
                  <AlertDescription className="text-blue-700">
                    This order is in progress. The writer will deliver it by {format(new Date(selectedOrder.deadline), "MMM d, yyyy")}.
                  </AlertDescription>
                </Alert>
              )}
              
              {selectedOrder.status === "completed" && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <AlertDescription className="text-green-700">
                    This order was completed on {format(new Date(selectedOrder.completedAt!), "MMM d, yyyy")}.
                  </AlertDescription>
                </Alert>
              )}
              
              {selectedOrder.status === "cancelled" && (
                <Alert className="bg-red-50 border-red-200">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <AlertDescription className="text-red-700">
                    This order was cancelled.
                  </AlertDescription>
                </Alert>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewOrderDetails(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  );
}
