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
import { Loader2, MoreVertical, Calendar, DollarSign, Users, Clock, Paperclip } from "lucide-react";
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
              {job.additionalInstructions && job.additionalInstructions.includes('EXACT DEADLINE TIME') && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>
                    {job.additionalInstructions.match(/EXACT DEADLINE TIME: ([0-9]{2}:[0-9]{2} [AP]M)/)?.[1] || 'Exact time specified'}
                  </span>
                </div>
              )}
              {job.additionalInstructions && job.additionalInstructions.includes('FILE ATTACHMENT INFO') && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Paperclip className="h-4 w-4" />
                  <span>File attached</span>
                </div>
              )}
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
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Job Details & Bids</DialogTitle>
            <DialogDescription>
              Review job details and bids from writers.
            </DialogDescription>
          </DialogHeader>
          
          {selectedJob && (
            <div className="mb-4">
              <div className="bg-muted p-3 rounded-md mb-3">
                <h4 className="text-sm font-semibold mb-2">Job Details</h4>
                <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                  <div>
                    <span className="text-muted-foreground">Title:</span> {selectedJob.title}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Budget:</span> ${selectedJob.budget}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Category:</span> {selectedJob.category}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Due:</span> {format(new Date(selectedJob.deadline), "MMM d, yyyy")}
                  </div>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Description:</span>
                  <p className="mt-1 line-clamp-3">{selectedJob.description}</p>
                </div>
                
                {/* Show exact time if available */}
                {selectedJob.additionalInstructions && selectedJob.additionalInstructions.includes('EXACT DEADLINE TIME') && (
                  <div className="flex items-center gap-2 mt-2 text-sm">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Exact Time:</span>
                    <span>
                      {selectedJob.additionalInstructions.match(/EXACT DEADLINE TIME: ([0-9]{2}:[0-9]{2} [AP]M)/)?.[1] || 'Exact time specified'}
                    </span>
                  </div>
                )}
                
                {/* Show attachment info if available */}
                {selectedJob.additionalInstructions && selectedJob.additionalInstructions.includes('FILE ATTACHMENT INFO') && (
                  <div className="flex items-start gap-2 mt-2 text-sm">
                    <Paperclip className="h-3 w-3 text-muted-foreground mt-0.5" />
                    <div>
                      <span className="text-muted-foreground">Attachment:</span>
                      <span className="block">
                        {selectedJob.additionalInstructions.match(/Filename: ([^\n]+)/)?.[1] || 'File attached'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <h4 className="text-sm font-semibold mb-2">Bids</h4>
          <div className="py-2">
            {selectedJob && bids[selectedJob.id]?.length > 0 ? (
              <ScrollArea className="h-[250px] pr-4">
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
                      <p className="text-sm mb-3">{bid.proposal || bid.coverLetter}</p>
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