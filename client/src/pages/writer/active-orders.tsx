import React, { useState } from "react";
import { DashboardLayout } from "@/components/ui/dashboard-layout";
import { OrderItem } from "@/components/order-item";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Order, Job } from "@shared/schema";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileUp } from "lucide-react";

export default function WriterActiveOrders() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDeliverModalOpen, setIsDeliverModalOpen] = useState(false);
  const [deliveryNote, setDeliveryNote] = useState("");
  const { toast } = useToast();

  // Fetch writer's active orders
  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    select: (data) => 
      data
        .filter(order => order.status === "in_progress")
        .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
  });

  // Complete order mutation
  const completeOrderMutation = useMutation({
    mutationFn: async (orderId: number) => {
      const response = await apiRequest("POST", `/api/orders/${orderId}/complete`, { 
        deliveryNote 
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/writer"] });
      toast({
        title: "Order completed",
        description: "Your work has been delivered successfully",
      });
      setIsDeliverModalOpen(false);
      setSelectedOrder(null);
      setDeliveryNote("");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to complete order",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDeliverOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsDeliverModalOpen(true);
  };

  const handleSubmitDelivery = () => {
    if (!selectedOrder) return;
    completeOrderMutation.mutate(selectedOrder.id);
  };

  return (
    <DashboardLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">Active Orders</h1>
          
          <div className="mt-6">
            {isLoading ? (
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {[1, 2, 3].map((item) => (
                    <li key={item} className="p-6 animate-pulse">
                      <div className="flex justify-between mb-4">
                        <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-5 bg-gray-200 rounded w-1/6"></div>
                      </div>
                      <div className="flex justify-between">
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-8 bg-gray-200 rounded w-1/6"></div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : orders && orders.length > 0 ? (
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul role="list" className="divide-y divide-gray-200">
                  {orders.map((order) => (
                    <OrderItem
                      key={order.id}
                      order={order}
                      onViewDetails={() => setSelectedOrder(order)}
                      onDeliver={handleDeliverOrder}
                    />
                  ))}
                </ul>
              </div>
            ) : (
              <div className="bg-white shadow overflow-hidden sm:rounded-md p-8 text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No active orders</h3>
                <p className="text-gray-500 mb-4">
                  You don't have any active orders at the moment.
                </p>
                <Button variant="default" onClick={() => window.location.href = "/writer/available-jobs"}>
                  Browse Available Jobs
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Deliver Order Modal */}
      <Dialog open={isDeliverModalOpen} onOpenChange={setIsDeliverModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Deliver Order</DialogTitle>
            <DialogDescription>
              Submit your completed work to the client.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="delivery-note">Delivery Note</Label>
              <Textarea
                id="delivery-note"
                placeholder="Add a note to the client about your submission..."
                rows={4}
                value={deliveryNote}
                onChange={(e) => setDeliveryNote(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="file-upload">Upload File (Coming Soon)</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
                <div className="flex justify-center">
                  <FileUp className="h-8 w-8 text-gray-400" />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  File upload functionality will be available soon. For now, please include any link to your work in the delivery note.
                </p>
              </div>
            </div>
          </div>
          
          <DialogFooter className="sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDeliverModalOpen(false);
                setDeliveryNote("");
              }}
              disabled={completeOrderMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              onClick={handleSubmitDelivery}
              disabled={completeOrderMutation.isPending}
            >
              {completeOrderMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Delivery"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
