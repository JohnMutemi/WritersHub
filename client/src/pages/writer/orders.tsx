import { useAuth } from "@/hooks/use-auth";
import { DashboardLayout } from "@/components/ui/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { Order } from "@shared/schema";
import { OrderItem } from "@/components/order-item";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export default function WriterOrders() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [deliveryDialogOpen, setDeliveryDialogOpen] = useState(false);

  // Mock data for writer's orders
  const mockOrders: Order[] = [
    {
      id: 1,
      jobId: 1,
      bidId: 1,
      clientId: 3,
      writerId: user?.id || 1,
      status: "in_progress",
      amount: 300,
      deadline: new Date("2025-04-10"),
      completedAt: null,
      createdAt: new Date("2025-03-25")
    },
    {
      id: 2,
      jobId: 3,
      bidId: 3,
      clientId: 4,
      writerId: user?.id || 1,
      status: "revision",
      amount: 250,
      deadline: new Date("2025-04-05"),
      completedAt: null,
      createdAt: new Date("2025-03-20")
    },
    {
      id: 3,
      jobId: 5,
      bidId: 5,
      clientId: 1,
      writerId: user?.id || 1,
      status: "completed",
      amount: 180,
      deadline: new Date("2025-03-28"),
      completedAt: new Date("2025-03-27"),
      createdAt: new Date("2025-03-15")
    },
    {
      id: 4,
      jobId: 2,
      bidId: 2,
      clientId: 2,
      writerId: user?.id || 1,
      status: "completed",
      amount: 200,
      deadline: new Date("2025-03-20"),
      completedAt: new Date("2025-03-18"),
      createdAt: new Date("2025-03-10")
    }
  ];

  // Fetch writer's orders
  const { data: myOrders = mockOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ['/api/writer/orders'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/writer/orders');
        return await response.json();
      } catch (error) {
        // Fallback to mock data if API fails
        return mockOrders;
      }
    },
    enabled: !!user
  });

  const handleViewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    // In a real app, this would navigate to an order detail page or open a dialog
  };

  const handleDeliverOrder = (order: Order) => {
    setSelectedOrder(order);
    setDeliveryDialogOpen(true);
  };

  const handleSubmitDelivery = () => {
    // In a real app, this would submit the delivery to the API
    toast({
      title: "Order Delivered",
      description: "Your work has been submitted to the client for review.",
    });
    setDeliveryDialogOpen(false);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">My Orders</h1>
          <p className="text-muted-foreground">
            Manage your active and completed orders
          </p>
        </div>

        <Tabs defaultValue="active" className="space-y-4">
          <TabsList>
            <TabsTrigger value="active">Active Orders</TabsTrigger>
            <TabsTrigger value="completed">Completed Orders</TabsTrigger>
          </TabsList>
          
          {/* Active Orders Tab */}
          <TabsContent value="active" className="space-y-4">
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
          <TabsContent value="completed" className="space-y-4">
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

      {/* Delivery Dialog */}
      <Dialog open={deliveryDialogOpen} onOpenChange={setDeliveryDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Deliver Order #{selectedOrder?.id}</DialogTitle>
            <DialogDescription>
              Submit your completed work to the client for review.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Upload Files</label>
              <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Drag and drop your files here, or click to browse
                </p>
                <Button variant="outline" className="mt-2">Select Files</Button>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Message to Client</label>
              <textarea 
                className="min-h-[100px] w-full border rounded-md p-2"
                placeholder="Add any additional notes or instructions for the client..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeliveryDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitDelivery}>
              Submit Delivery
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}