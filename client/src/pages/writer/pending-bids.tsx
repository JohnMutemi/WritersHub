import React, { useState } from "react";
import { DashboardLayout } from "@/components/ui/dashboard-layout";
import { useQuery } from "@tanstack/react-query";
import { Bid, Job } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Clock, DollarSign, FileText, Calendar, CheckCircle, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function WriterPendingBids() {
  const [selectedBid, setSelectedBid] = useState<Bid | null>(null);
  const [viewBidDetails, setViewBidDetails] = useState(false);

  // Fetch all writer's bids
  const { data: bids, isLoading: isBidsLoading } = useQuery<Bid[]>({
    queryKey: ["/api/bids"],
    select: (data) => data.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ),
  });

  // Fetch jobs data
  const { data: jobs, isLoading: isJobsLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  const isLoading = isBidsLoading || isJobsLoading;

  const getJobById = (jobId: number) => {
    return jobs?.find(job => job.id === jobId);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "accepted":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const handleViewBid = (bid: Bid) => {
    setSelectedBid(bid);
    setViewBidDetails(true);
  };

  return (
    <DashboardLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">Pending Bids</h1>
          
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
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded"></div>
                      </div>
                      <div className="flex justify-end">
                        <div className="h-8 bg-gray-200 rounded w-24"></div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : bids && bids.length > 0 ? (
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {bids.map((bid) => {
                    const job = getJobById(bid.jobId);
                    return (
                      <li key={bid.id} className="px-6 py-4 hover:bg-gray-50">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2">
                          <div className="flex items-center mb-2 sm:mb-0">
                            <h3 className="text-md font-medium text-primary-600 mr-3">
                              {job?.title || `Job #${bid.jobId}`}
                            </h3>
                            <Badge className={getStatusBadgeColor(bid.status)}>
                              {formatStatus(bid.status)}
                            </Badge>
                          </div>
                          <span className="text-sm text-gray-500">
                            Submitted {formatDistanceToNow(new Date(bid.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm text-gray-500 mt-3 mb-3">
                          <div className="flex items-center">
                            <DollarSign className="mr-1 h-4 w-4 text-gray-400" />
                            <span>Bid: ${bid.amount}</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="mr-1 h-4 w-4 text-gray-400" />
                            <span>{bid.deliveryTime} days</span>
                          </div>
                          <div className="flex items-center">
                            <FileText className="mr-1 h-4 w-4 text-gray-400" />
                            <span>{job?.pages || "N/A"} pages</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="mr-1 h-4 w-4 text-gray-400" />
                            <span>Budget: ${job?.budget || "N/A"}</span>
                          </div>
                        </div>
                        
                        <div className="flex justify-end">
                          <Button
                            variant="outline"
                            onClick={() => handleViewBid(bid)}
                          >
                            View Details
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : (
              <div className="bg-white shadow overflow-hidden sm:rounded-md p-8 text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No pending bids</h3>
                <p className="text-gray-500 mb-4">
                  You haven't placed any bids yet or all your bids have been processed.
                </p>
                <Button variant="default" onClick={() => window.location.href = "/writer/available-jobs"}>
                  Browse Available Jobs
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Bid Details Dialog */}
      {selectedBid && (
        <Dialog open={viewBidDetails} onOpenChange={setViewBidDetails}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Bid Details</DialogTitle>
              <DialogDescription>
                Submitted {formatDistanceToNow(new Date(selectedBid.createdAt), { addSuffix: true })}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Job Title</h4>
                <p className="text-base">{getJobById(selectedBid.jobId)?.title || `Job #${selectedBid.jobId}`}</p>
              </div>
              
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
                <p className="text-base whitespace-pre-wrap">{selectedBid.coverLetter}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500">Status</h4>
                <div className="flex items-center mt-1">
                  {selectedBid.status === "pending" ? (
                    <Clock className="h-5 w-5 text-yellow-500 mr-2" />
                  ) : selectedBid.status === "accepted" ? (
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500 mr-2" />
                  )}
                  <span className={`inline-flex text-sm font-medium rounded-full px-2 py-1 ${getStatusBadgeColor(selectedBid.status)}`}>
                    {formatStatus(selectedBid.status)}
                  </span>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewBidDetails(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  );
}
