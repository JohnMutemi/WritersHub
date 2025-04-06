import { useState } from "react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, MoreVertical, Calendar, DollarSign, Users } from "lucide-react";
import { Job, Order, BidWithDetails } from "@shared/schema";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

interface ClientJobListProps {
  jobs: Job[];
  bids: Record<number, BidWithDetails[]>;
  isLoading: boolean;
  refetch: () => void;
}

export function ClientJobList({ jobs, bids, isLoading, refetch }: ClientJobListProps) {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showBids, setShowBids] = useState(false);
  const queryClient = useQueryClient();

  const cancelJobMutation = useMutation({
    mutationFn: async (jobId: number) => {
      const res = await apiRequest("PATCH", `/api/jobs/${jobId}/status`, { status: "cancelled" });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/client/stats"] });
      toast({
        title: "Job cancelled",
        description: "The job has been cancelled successfully.",
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

  const acceptBidMutation = useMutation({
    mutationFn: async ({ jobId, bidId }: { jobId: number; bidId: number }) => {
      const res = await apiRequest("PATCH", `/api/bids/${bidId}/status`, { status: "accepted" });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/client/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/client/stats"] });
      setShowBids(false);
      toast({
        title: "Bid accepted",
        description: "The bid has been accepted and an order has been created.",
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
      case "open":
        return <Badge className="bg-green-500">Open</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-500">In Progress</Badge>;
      case "completed":
        return <Badge className="bg-purple-500">Completed</Badge>;
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

  if (jobs.length === 0) {
    return (
      <Card className="mt-4">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground mb-4">You haven't posted any jobs yet.</p>
          <p className="text-sm text-muted-foreground">
            Get started by creating your first job listing.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <Card key={job.id} className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl">{job.title}</CardTitle>
                <CardDescription className="mt-1">
                  Posted on {format(new Date(job.createdAt), "MMM d, yyyy")}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(job.status)}
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
                    {job.status === "open" && (
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedJob(job);
                          setShowBids(true);
                        }}
                      >
                        View Bids ({(bids[job.id] || []).length})
                      </DropdownMenuItem>
                    )}
                    {job.status === "open" && (
                      <DropdownMenuItem
                        onClick={() => {
                          if (window.confirm("Are you sure you want to cancel this job?")) {
                            cancelJobMutation.mutate(job.id);
                          }
                        }}
                      >
                        Cancel Job
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-3">
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {job.description}
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-1 text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span>${job.budget}</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Due: {format(new Date(job.deadline), "MMM d, yyyy")}</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{(bids[job.id] || []).length} bids</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="pt-2">
            {job.status === "open" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedJob(job);
                  setShowBids(true);
                }}
                disabled={(bids[job.id] || []).length === 0}
              >
                View {(bids[job.id] || []).length} Bids
              </Button>
            )}
          </CardFooter>
        </Card>
      ))}

      {/* Bids Dialog */}
      <Dialog open={showBids} onOpenChange={setShowBids}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Bids for {selectedJob?.title}</DialogTitle>
            <DialogDescription>
              Review and accept bids from writers for this job.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedJob && bids[selectedJob.id]?.length > 0 ? (
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-4">
                  {bids[selectedJob.id].map((bid) => (
                    <div key={bid.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{bid.writerUsername}</h4>
                          <p className="text-sm text-muted-foreground">
                            Bid: ${bid.amount} • {format(new Date(bid.createdAt), "MMM d, yyyy")}
                          </p>
                        </div>
                        <Badge
                          className={
                            bid.status === "pending"
                              ? "bg-yellow-500"
                              : bid.status === "accepted"
                              ? "bg-green-500"
                              : "bg-red-500"
                          }
                        >
                          {bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-sm mb-3">{bid.proposal}</p>
                      {bid.status === "pending" && (
                        <Button
                          className="w-full"
                          size="sm"
                          onClick={() =>
                            acceptBidMutation.mutate({
                              jobId: selectedJob.id,
                              bidId: bid.id,
                            })
                          }
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
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <p className="text-center py-8 text-muted-foreground">
                No bids have been placed on this job yet.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}