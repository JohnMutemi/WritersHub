import React, { useState } from "react";
import { DashboardLayout } from "@/components/ui/dashboard-layout";
import { useQuery } from "@tanstack/react-query";
import { Order, Job } from "@shared/schema";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { format, formatDistanceToNow } from "date-fns";
import { ClipboardList, FileText, DollarSign, Calendar, Clock, User, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

export default function WriterOrderHistory() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [viewOrderDetails, setViewOrderDetails] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  // Fetch writer's orders
  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    select: (data) => 
      data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  });

  // Fetch jobs data to get titles
  const { data: jobs } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  const getJobById = (jobId: number): Job | undefined => {
    return jobs?.find(job => job.id === jobId);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      case "revision":
        return "bg-orange-100 text-orange-800";
      case "completed":
        return "bg-green-100 text-green-800";
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
      case "in_progress":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "revision":
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "cancelled":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <ClipboardList className="h-5 w-5 text-gray-500" />;
    }
  };

  const filteredOrders = orders?.filter(order => {
    if (activeTab === "all") return true;
    return order.status === activeTab.replace("-", "_");
  });

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setViewOrderDetails(true);
  };

  return (
    <DashboardLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">Order History</h1>
          
          <div className="mt-6">
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="all">All Orders</TabsTrigger>
                <TabsTrigger value="in-progress">In Progress</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
              </TabsList>
              
              <TabsContent value={activeTab}>
                {isLoading ? (
                  <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map(item => (
                      <Card key={item} className="animate-pulse">
                        <CardHeader className="pb-2">
                          <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        </CardHeader>
                        <CardContent className="pt-2">
                          <div className="space-y-3">
                            <div className="h-4 bg-gray-200 rounded w-full"></div>
                            <div className="h-4 bg-gray-200 rounded w-full"></div>
                            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                          </div>
                        </CardContent>
                        <CardFooter>
                          <div className="h-8 bg-gray-200 rounded w-full"></div>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : filteredOrders && filteredOrders.length > 0 ? (
                  <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {filteredOrders.map(order => {
                      const job = getJobById(order.jobId);
                      return (
                        <Card key={order.id}>
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-lg text-primary-600 mr-2">
                                {job?.title || `Order #${order.id}`}
                              </CardTitle>
                              <Badge className={getStatusBadgeColor(order.status)}>
                                {formatStatus(order.status)}
                              </Badge>
                            </div>
                            <CardDescription>
                              Created {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="pt-2">
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center">
                                <DollarSign className="h-4 w-4 text-gray-400 mr-2" />
                                <span>${order.amount.toFixed(2)}</span>
                              </div>
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                                <span>
                                  {order.status === "completed" && order.completedAt 
                                    ? `Completed on ${format(new Date(order.completedAt), "MMM d, yyyy")}`
                                    : `Due on ${format(new Date(order.deadline), "MMM d, yyyy")}`
                                  }
                                </span>
                              </div>
                              <div className="flex items-center">
                                <FileText className="h-4 w-4 text-gray-400 mr-2" />
                                <span>{job?.pages || "N/A"} pages</span>
                              </div>
                            </div>
                          </CardContent>
                          <CardFooter>
                            <Button 
                              variant="outline" 
                              className="w-full"
                              onClick={() => handleViewOrder(order)}
                            >
                              View Details
                            </Button>
                          </CardFooter>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-white shadow rounded-lg p-8 text-center">
                    <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
                    <p className="text-gray-500 mb-4">
                      {activeTab === "all" 
                        ? "You don't have any orders yet."
                        : `You don't have any ${activeTab.replace("-", " ")} orders.`}
                    </p>
                    {activeTab !== "all" && (
                      <Button variant="outline" onClick={() => setActiveTab("all")}>
                        View All Orders
                      </Button>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      
      {/* Order Details Dialog */}
      {selectedOrder && (
        <Dialog open={viewOrderDetails} onOpenChange={setViewOrderDetails}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                {getStatusIcon(selectedOrder.status)}
                <span className="ml-2">Order Details</span>
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
                <h4 className="text-sm font-medium text-gray-500">Description</h4>
                <p className="text-base">
                  {getJobById(selectedOrder.jobId)?.description || "No description available."}
                </p>
              </div>
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
