import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { OrderWithDetails } from "@shared/schema";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, MoreVertical, CheckCircle, AlertCircle, FileText } from "lucide-react";

interface ClientOrderListProps {
  orders: OrderWithDetails[];
  isLoading: boolean;
}

export function ClientOrderList({ orders, isLoading }: ClientOrderListProps) {
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showReleasePayment, setShowReleasePayment] = useState(false);
  const [showRequestRevision, setShowRequestRevision] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState("");
  const queryClient = useQueryClient();

  const completeOrderMutation = useMutation({
    mutationFn: async (orderId: number) => {
      const res = await apiRequest("PATCH", `/api/orders/${orderId}/status`, { status: "completed" });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/client/stats"] });
      setShowReleasePayment(false);
      toast({
        title: "Order completed",
        description: "Payment has been released to the writer.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const requestRevisionMutation = useMutation({
    mutationFn: async ({ orderId, notes }: { orderId: number; notes: string }) => {
      const res = await apiRequest("PATCH", `/api/orders/${orderId}/status`, {
        status: "revision",
        revisionNotes: notes,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client/orders"] });
      setShowRequestRevision(false);
      setRevisionNotes("");
      toast({
        title: "Revision requested",
        description: "Your revision request has been sent to the writer.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "in_progress":
        return <Badge className="bg-blue-500">In Progress</Badge>;
      case "revision":
        return <Badge className="bg-yellow-500">Revision</Badge>;
      case "completed":
        return <Badge className="bg-green-500">Completed</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <Card className="mt-4">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground mb-4">You don't have any active orders yet.</p>
          <p className="text-sm text-muted-foreground">
            When you accept a bid, it will create an order that will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <Card key={order.id} className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl">{order.jobTitle}</CardTitle>
                <CardDescription className="mt-1">
                  Order created on {format(new Date(order.createdAt), "MMM d, yyyy")}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(order.status)}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowOrderDetails(true);
                      }}
                    >
                      View Details
                    </DropdownMenuItem>
                    {order.status === "in_progress" && (
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowRequestRevision(true);
                        }}
                      >
                        Request Revision
                      </DropdownMenuItem>
                    )}
                    {(order.status === "in_progress" || order.status === "revision") && (
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowReleasePayment(true);
                        }}
                      >
                        Release Payment
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-1 text-muted-foreground">
                <span className="font-semibold">Writer:</span> {order.writerUsername}
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <span className="font-semibold">Amount:</span> ${order.amount}
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <span className="font-semibold">Due date:</span> {format(new Date(order.deadline), "MMM d, yyyy")}
              </div>
            </div>
          </CardContent>
          <CardFooter className="pt-2">
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedOrder(order);
                  setShowOrderDetails(true);
                }}
              >
                <FileText className="h-4 w-4 mr-1" /> Details
              </Button>
              {order.status === "in_progress" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedOrder(order);
                    setShowRequestRevision(true);
                  }}
                >
                  <AlertCircle className="h-4 w-4 mr-1" /> Request Revision
                </Button>
              )}
              {(order.status === "in_progress" || order.status === "revision") && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    setSelectedOrder(order);
                    setShowReleasePayment(true);
                  }}
                >
                  <CheckCircle className="h-4 w-4 mr-1" /> Release Payment
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      ))}

      {/* Order Details Dialog */}
      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              View the details of your order.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedOrder && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-sm">Job Title</h3>
                  <p>{selectedOrder.jobTitle}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm">Writer</h3>
                  <p>{selectedOrder.writerUsername}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm">Amount</h3>
                  <p>${selectedOrder.amount}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm">Status</h3>
                  <p>{getStatusBadge(selectedOrder.status)}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm">Created Date</h3>
                  <p>{format(new Date(selectedOrder.createdAt), "PPP")}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm">Deadline</h3>
                  <p>{format(new Date(selectedOrder.deadline), "PPP")}</p>
                </div>
                {selectedOrder.revisionNotes && (
                  <div>
                    <h3 className="font-medium text-sm">Revision Notes</h3>
                    <p className="text-sm bg-muted p-3 rounded">
                      {selectedOrder.revisionNotes}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Release Payment Dialog */}
      <Dialog open={showReleasePayment} onOpenChange={setShowReleasePayment}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Release Payment</DialogTitle>
            <DialogDescription>
              Are you satisfied with the work and ready to release payment to the writer?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-2">
              When you release payment, the order will be marked as complete and the writer will
              receive payment for their work.
            </p>
            <p className="text-sm font-medium">Amount: ${selectedOrder?.amount}</p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowReleasePayment(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedOrder) {
                  completeOrderMutation.mutate(selectedOrder.id);
                }
              }}
              disabled={completeOrderMutation.isPending}
            >
              {completeOrderMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Release Payment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Revision Dialog */}
      <Dialog open={showRequestRevision} onOpenChange={(open) => {
        setShowRequestRevision(open);
        if (!open) setRevisionNotes("");
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Revision</DialogTitle>
            <DialogDescription>
              Request changes to the delivered work.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Please describe in detail what changes you would like the writer to make.
            </p>
            <Textarea
              placeholder="Describe the revisions needed..."
              value={revisionNotes}
              onChange={(e) => setRevisionNotes(e.target.value)}
              className="min-h-[150px]"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRequestRevision(false);
                setRevisionNotes("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedOrder && revisionNotes.trim()) {
                  requestRevisionMutation.mutate({
                    orderId: selectedOrder.id,
                    notes: revisionNotes,
                  });
                } else {
                  toast({
                    title: "Error",
                    description: "Please provide details for the revision request.",
                    variant: "destructive",
                  });
                }
              }}
              disabled={requestRevisionMutation.isPending || !revisionNotes.trim()}
            >
              {requestRevisionMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Request Revision"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}