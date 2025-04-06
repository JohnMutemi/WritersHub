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
          <CardHeader className="pb-3 border-b">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-xl">{job.title}</CardTitle>
                  {getStatusBadge(job.status)}
                </div>
                <CardDescription className="mt-1 flex items-center gap-2">
                  <span className="text-xs inline-flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    Posted: {format(new Date(job.createdAt), "MMM d, yyyy 'at' h:mm a")}
                  </span>
                  <span className="text-xs inline-flex items-center">
                    <span className="h-1 w-1 rounded-full bg-muted-foreground inline-block mx-1"></span>
                    Job ID: #{job.id}
                  </span>
                </CardDescription>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 px-2">
                    <span className="mr-1">Actions</span>
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Job Actions</DropdownMenuLabel>
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
                  <DropdownMenuItem
                    onClick={() => {
                      navigator.clipboard.writeText(job.description);
                      toast({
                        title: "Description copied",
                        description: "Job description copied to clipboard",
                      });
                    }}
                  >
                    Copy Description
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="py-4">
            <div className="flex flex-col gap-4">
              <div className="bg-muted/40 p-3 rounded-md">
                <h4 className="text-sm font-medium mb-2">Description:</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {job.description}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-md border p-3">
                  <h4 className="text-xs font-medium text-muted-foreground mb-1">Budget</h4>
                  <p className="text-lg font-semibold flex items-center">
                    <DollarSign className="h-4 w-4 mr-1 text-green-500" />
                    ${job.budget.toFixed(2)}
                  </p>
                </div>
                
                <div className="rounded-md border p-3">
                  <h4 className="text-xs font-medium text-muted-foreground mb-1">Deadline</h4>
                  <p className="text-sm font-medium flex items-center">
                    <Calendar className="h-4 w-4 mr-1 text-blue-500" />
                    {format(new Date(job.deadline), "MMMM d, yyyy")}
                    <span className="text-xs ml-1 text-muted-foreground">
                      ({Math.ceil((new Date(job.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left)
                    </span>
                  </p>
                </div>
                
                <div className="rounded-md border p-3">
                  <h4 className="text-xs font-medium text-muted-foreground mb-1">Proposals</h4>
                  <p className="text-sm font-medium flex items-center">
                    <Users className="h-4 w-4 mr-1 text-purple-500" />
                    {(bids[job.id] || []).length} writer bid{(bids[job.id] || []).length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              
              <div className="border rounded-md p-3">
                <h4 className="text-xs font-medium text-muted-foreground mb-2">Attachments & References</h4>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between py-1 px-3 bg-muted/40 rounded text-sm">
                    <span className="flex items-center text-muted-foreground">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                        <path d="M12 2H2v10h10V2z"></path>
                        <path d="M7 12v10h15V12H7z"></path>
                      </svg>
                      No attachments yet
                    </span>
                    <Button variant="ghost" size="sm" className="h-7 px-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                      </svg>
                      Add Files
                    </Button>
                  </div>
                </div>
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
        <DialogContent className="sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <span className="mr-2">Bids for Job:</span> 
              <span className="text-primary font-normal">{selectedJob?.title}</span>
            </DialogTitle>
            <DialogDescription className="flex justify-between items-center">
              <span>Review and compare bids from qualified writers</span>
              {selectedJob && (
                <Badge variant="outline" className="ml-2">
                  {(bids[selectedJob.id] || []).length} Proposal{(bids[selectedJob.id] || []).length !== 1 ? 's' : ''}
                </Badge>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-3">
            {selectedJob && bids[selectedJob.id]?.length > 0 ? (
              <>
                <div className="flex justify-between text-xs text-muted-foreground px-2 pb-2 mb-3 border-b">
                  <span>Writer</span>
                  <div className="flex gap-8">
                    <span>Price</span>
                    <span>Delivery</span>
                    <span>Status</span>
                  </div>
                </div>
                
                <ScrollArea className="h-[350px] pr-4">
                  <div className="space-y-5">
                    {bids[selectedJob.id].map((bid) => (
                      <div key={bid.id} className="border rounded-lg overflow-hidden">
                        <div className="flex justify-between items-center p-3 bg-muted/30">
                          <div className="flex items-center">
                            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold mr-3">
                              {bid.writerUsername?.charAt(0).toUpperCase() || 'W'}
                            </div>
                            <div>
                              <h4 className="font-medium leading-tight">{bid.writerUsername}</h4>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Bid submitted {format(new Date(bid.createdAt), "MMM d, yyyy 'at' h:mm a")}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-6">
                            <div className="flex flex-col items-end">
                              <span className="font-semibold">${bid.amount.toFixed(2)}</span>
                              <span className="text-xs text-muted-foreground">
                                {bid.amount > selectedJob.budget ? (
                                  <span className="text-red-500">+${(bid.amount - selectedJob.budget).toFixed(2)}</span>
                                ) : bid.amount < selectedJob.budget ? (
                                  <span className="text-green-500">-${(selectedJob.budget - bid.amount).toFixed(2)}</span>
                                ) : (
                                  "Exact budget"
                                )}
                              </span>
                            </div>
                            
                            <div className="flex flex-col items-end w-[80px]">
                              <span className="font-medium">{bid.deliveryTime} days</span>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {format(new Date(Date.now() + bid.deliveryTime * 24 * 60 * 60 * 1000), "MMM d, yyyy")}
                              </span>
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
                        </div>
                        
                        <div className="p-4">
                          <h5 className="text-sm font-medium mb-2">Proposal:</h5>
                          <div className="mb-4 text-sm bg-muted/20 p-3 rounded whitespace-pre-line text-muted-foreground">
                            {bid.proposal || bid.coverLetter}
                          </div>
                          
                          {bid.status === "pending" && (
                            <div className="flex justify-end space-x-2 mt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  // You could implement a decline bid function here
                                  if (window.confirm("Are you sure you want to decline this bid?")) {
                                    // Logic for declining bid
                                  }
                                }}
                              >
                                Decline
                              </Button>
                              <Button
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
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </>
            ) : (
              <div className="text-center py-12 px-6">
                <div className="inline-flex justify-center items-center rounded-full bg-muted/50 w-12 h-12 mb-4">
                  <Users className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="font-medium mb-1">No bids received yet</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-6">
                  Your job is live and writers can bid on it. Check back later or consider adjusting your job description or budget.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setShowBids(false)}
                >
                  Close
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}