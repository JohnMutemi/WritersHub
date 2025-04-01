import React, { useState } from "react";
import { DashboardLayout } from "@/components/ui/dashboard-layout";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Job, Order, Bid } from "@shared/schema";
import { Link } from "wouter";
import { FilePlus, BookOpen, CheckCircle, CreditCard, Clock, User, FileText, DollarSign, Calendar } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

export default function ClientDashboard() {
  const [selectedBid, setSelectedBid] = useState<Bid | null>(null);
  const [viewBidDetails, setViewBidDetails] = useState(false);

  // Fetch client stats
  const { data: clientStats, isLoading: isStatsLoading } = useQuery({
    queryKey: ["/api/stats/client"],
  });

  // Fetch client's active orders
  const { data: activeOrders, isLoading: isOrdersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    select: (data) => 
      data
        .filter(order => order.status === "in_progress")
        .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
        .slice(0, 3)
  });

  // Fetch client's active jobs with bids
  const { data: jobs, isLoading: isJobsLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
    select: (data) => 
      data
        .filter(job => job.status === "open")
        .slice(0, 3)
  });

  // Fetch bids for the client's jobs
  const { data: bids, isLoading: isBidsLoading } = useQuery<Bid[]>({
    queryKey: ["/api/bids"],
  });

  const getBidsForJob = (jobId: number) => {
    return bids?.filter(bid => bid.jobId === jobId && bid.status === "pending") || [];
  };

  const handleViewBid = (bid: Bid) => {
    setSelectedBid(bid);
    setViewBidDetails(true);
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

  return (
    <DashboardLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">Client Dashboard</h1>
          
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
                title="Posted Jobs"
                value={clientStats?.postedJobs || 0}
                icon={<FilePlus />}
                iconBgColor="bg-blue-100"
                iconColor="text-blue-600"
                actionText="Post new job"
                actionHref="/client/post-job"
              />
              
              <StatCard
                title="Active Orders"
                value={clientStats?.activeOrders || 0}
                icon={<BookOpen />}
                iconBgColor="bg-yellow-100"
                iconColor="text-yellow-600"
                actionText="Manage orders"
                actionHref="/client/manage-orders"
              />
              
              <StatCard
                title="Completed Orders"
                value={clientStats?.completedOrders || 0}
                icon={<CheckCircle />}
                iconBgColor="bg-green-100"
                iconColor="text-green-600"
                actionText="View history"
                actionHref="/client/manage-orders?tab=completed"
              />
              
              <StatCard
                title="Total Spent"
                value={`$${clientStats?.totalSpent.toFixed(2) || "0.00"}`}
                icon={<CreditCard />}
                iconBgColor="bg-purple-100"
                iconColor="text-purple-600"
                actionText="Payment history"
                actionHref="/client/manage-orders?tab=completed"
              />
            </div>
          )}
          
          {/* Active Orders and Open Jobs */}
          <div className="mt-8">
            <Tabs defaultValue="orders">
              <TabsList>
                <TabsTrigger value="orders">Active Orders</TabsTrigger>
                <TabsTrigger value="jobs">Open Jobs</TabsTrigger>
              </TabsList>
              
              <TabsContent value="orders" className="mt-4">
                {isOrdersLoading ? (
                  <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                    {[1, 2].map((item) => (
                      <Card key={item} className="animate-pulse">
                        <CardHeader className="pb-2">
                          <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="h-4 bg-gray-200 rounded w-full"></div>
                            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : activeOrders && activeOrders.length > 0 ? (
                  <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                    {activeOrders.map(order => (
                      <Card key={order.id}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">Order #{order.id}</CardTitle>
                            <Badge className={getStatusBadgeColor(order.status)}>
                              {formatStatus(order.status)}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-500">
                            Due: {format(new Date(order.deadline), "MMM d, yyyy")}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <User className="h-4 w-4 text-gray-400 mr-2" />
                                <span className="text-sm">Writer ID: {order.writerId}</span>
                              </div>
                              <div className="flex items-center">
                                <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
                                <span className="text-sm">${order.amount.toFixed(2)}</span>
                              </div>
                            </div>
                            <Button 
                              variant="outline"
                              size="sm"
                              className="w-full"
                              asChild
                            >
                              <Link href={`/client/manage-orders?id=${order.id}`}>
                                View Details
                              </Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white shadow rounded-lg p-8 text-center">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No active orders</h3>
                    <p className="text-gray-500 mb-4">
                      You don't have any active orders at the moment.
                    </p>
                    <Button asChild>
                      <Link href="/client/post-job">Post a New Job</Link>
                    </Button>
                  </div>
                )}
                {activeOrders && activeOrders.length > 0 && (
                  <div className="mt-4 text-center">
                    <Button variant="outline" asChild>
                      <Link href="/client/manage-orders">View All Orders</Link>
                    </Button>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="jobs" className="mt-4">
                {isJobsLoading || isBidsLoading ? (
                  <div className="grid gap-4 grid-cols-1">
                    {[1, 2].map((item) => (
                      <Card key={item} className="animate-pulse">
                        <CardHeader className="pb-2">
                          <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="h-4 bg-gray-200 rounded w-full"></div>
                            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                            <div className="h-10 bg-gray-200 rounded w-full"></div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : jobs && jobs.length > 0 ? (
                  <div className="grid gap-4 grid-cols-1">
                    {jobs.map(job => {
                      const jobBids = getBidsForJob(job.id);
                      return (
                        <Card key={job.id}>
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
                            <p className="text-sm text-gray-600 mb-4">{job.description}</p>
                            <div className="grid grid-cols-2 gap-4 mb-4">
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
                                <span className="text-sm">{jobBids.length} bids</span>
                              </div>
                            </div>
                            
                            {jobBids.length > 0 ? (
                              <div className="space-y-3">
                                <h4 className="text-sm font-medium">Recent Bids</h4>
                                <div className="space-y-2">
                                  {jobBids.slice(0, 2).map(bid => (
                                    <div key={bid.id} className="flex items-center justify-between border p-2 rounded-md">
                                      <div>
                                        <div className="text-sm font-medium">Writer #{bid.writerId}</div>
                                        <div className="text-xs text-gray-500">${bid.amount} • {bid.deliveryTime} days</div>
                                      </div>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleViewBid(bid)}
                                      >
                                        View
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                                {jobBids.length > 2 && (
                                  <div className="text-center">
                                    <Button variant="link" size="sm" asChild>
                                      <Link href={`/client/manage-orders?job=${job.id}`}>
                                        View all {jobBids.length} bids
                                      </Link>
                                    </Button>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-500 italic">No bids yet</div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-white shadow rounded-lg p-8 text-center">
                    <FilePlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No open jobs</h3>
                    <p className="text-gray-500 mb-4">
                      You don't have any open jobs at the moment.
                    </p>
                    <Button asChild>
                      <Link href="/client/post-job">Post a New Job</Link>
                    </Button>
                  </div>
                )}
                {jobs && jobs.length > 0 && (
                  <div className="mt-4 text-center">
                    <Button variant="outline" asChild>
                      <Link href="/client/post-job">Post a New Job</Link>
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      
      {/* Bid Details Dialog */}
      {selectedBid && (
        <Dialog open={viewBidDetails} onOpenChange={setViewBidDetails}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Bid Details</DialogTitle>
              <DialogDescription>
                Bid from Writer #{selectedBid.writerId}
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
            </div>
            
            <DialogFooter className="space-x-2">
              <Button variant="outline" onClick={() => setViewBidDetails(false)}>
                Close
              </Button>
              <Button asChild>
                <Link href={`/client/manage-orders?job=${selectedBid.jobId}&bid=${selectedBid.id}`}>
                  Accept Bid
                </Link>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  );
}
