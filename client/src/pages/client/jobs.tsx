import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { DashboardLayout } from "@/components/ui/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { JobForm } from "@/components/job-form";
import { ClientJobList } from "@/components/client-job-list";
import { ClientOrderList } from "@/components/client-order-list";
import { z } from "zod";
import { insertJobSchema, Job, BidWithDetails, OrderWithDetails } from "@shared/schema";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

type JobFormValues = z.infer<typeof insertJobSchema>;

export default function ClientJobs() {
  const { user } = useAuth();
  const [showNewJobDialog, setShowNewJobDialog] = useState(false);
  const queryClient = useQueryClient();

  // Get client's jobs
  const {
    data: jobs = [],
    isLoading: isLoadingJobs,
    refetch: refetchJobs,
  } = useQuery<Job[]>({
    queryKey: ["/api/client/jobs"],
    queryFn: async () => {
      const res = await fetch("/api/client/jobs");
      if (!res.ok) throw new Error("Failed to fetch jobs");
      return res.json();
    },
  });

  // Get client's orders
  const {
    data: orders = [],
    isLoading: isLoadingOrders,
  } = useQuery<OrderWithDetails[]>({
    queryKey: ["/api/client/orders"],
    queryFn: async () => {
      const res = await fetch("/api/client/orders");
      if (!res.ok) throw new Error("Failed to fetch orders");
      return res.json();
    },
  });

  // Get bids for each job
  const {
    data: jobBids = {},
    isLoading: isLoadingBids,
  } = useQuery<Record<number, BidWithDetails[]>>({
    queryKey: ["/api/client/bids"],
    queryFn: async () => {
      // If no jobs, return empty object
      if (jobs.length === 0) return {};

      // Create an object to store bids for each job
      const bidsByJob: Record<number, BidWithDetails[]> = {};
      
      // Fetch bids for each job
      const bidsPromises = jobs.map(async (job) => {
        try {
          const res = await fetch(`/api/jobs/${job.id}/bids`);
          if (!res.ok) throw new Error(`Failed to fetch bids for job ${job.id}`);
          const bids = await res.json();
          bidsByJob[job.id] = bids;
        } catch (error) {
          console.error(`Error fetching bids for job ${job.id}:`, error);
          bidsByJob[job.id] = [];
        }
      });
      
      await Promise.all(bidsPromises);
      return bidsByJob;
    },
    enabled: jobs.length > 0,
  });

  // Create a new job
  const createJobMutation = useMutation({
    mutationFn: async (job: JobFormValues) => {
      const res = await apiRequest("POST", "/api/jobs", job);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/client/stats"] });
      setShowNewJobDialog(false);
      toast({
        title: "Job created",
        description: "Your job has been posted and is now available for writers to bid on.",
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

  const handleCreateJob = async (values: JobFormValues & {
    exactTime: boolean;
    hour: string;
    minute: string;
    ampm: string;
    attachmentFile: File | null;
  }) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to post a job.",
        variant: "destructive",
      });
      return;
    }

    try {
      // If exact time is specified, adjust the deadline date to include the time
      let finalDeadline = new Date(values.deadline);
      
      if (values.exactTime) {
        // Convert 12-hour format to 24-hour format
        let hour24 = parseInt(values.hour);
        if (values.ampm === "PM" && hour24 < 12) {
          hour24 += 12;
        } else if (values.ampm === "AM" && hour24 === 12) {
          hour24 = 0;
        }
        
        // Set the hours and minutes
        finalDeadline.setHours(hour24, parseInt(values.minute), 0, 0);
        
        // Format the time for display in 12-hour format with leading zeros
        const formattedHour = values.hour.padStart(2, '0');
        const formattedMinute = values.minute.padStart(2, '0');
        const exactTimeString = `EXACT DEADLINE TIME: ${formattedHour}:${formattedMinute} ${values.ampm}`;
        
        // Add to additional instructions
        if (values.additionalInstructions) {
          values.additionalInstructions += `\n\n${exactTimeString}`;
        } else {
          values.additionalInstructions = exactTimeString;
        }
      } else {
        // If exact time is not specified, set time to end of day (11:59 PM)
        finalDeadline.setHours(23, 59, 59, 999);
      }
      
      // Handle file upload if present
      let attachmentUrl = "";
      let additionalInstructions = values.additionalInstructions || "";
      
      if (values.attachmentFile) {
        // For demo purposes, include file information in the additional instructions
        const fileInfo = `
          
FILE ATTACHMENT INFO:
Filename: ${values.attachmentFile.name}
Size: ${(values.attachmentFile.size / 1024).toFixed(1)} KB
Type: ${values.attachmentFile.type}
`;
        
        // Append file info to additional instructions
        additionalInstructions += fileInfo;
        
        // Note: In a real app, implement actual file upload to a service like S3 here
        attachmentUrl = `placeholder-${values.attachmentFile.name.replace(/\s+/g, '-')}`;
      }
      
      // Create job data to submit, matching the server schema expectations
      const jobData = {
        title: values.title,
        description: values.description,
        budget: values.budget,
        deadline: finalDeadline,
        category: values.category,
        clientId: user.id,
        status: 'open',
        additionalInstructions,
        attachmentUrl
      };
      
      // Submit the job with the correctly formatted data
      createJobMutation.mutate(jobData);
      
    } catch (error) {
      console.error("Error processing job submission:", error);
      toast({
        title: "Error",
        description: "There was a problem processing your job submission. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Manage Jobs</h1>
            <p className="text-muted-foreground">
              Post new jobs and manage your existing listings
            </p>
          </div>
          <Button onClick={() => setShowNewJobDialog(true)}>
            <Plus className="mr-2 h-4 w-4" /> Post New Job
          </Button>
        </div>

        <Tabs defaultValue="jobs" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="jobs">Active Jobs</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
          </TabsList>
          <TabsContent value="jobs" className="space-y-4">
            <ClientJobList
              jobs={jobs}
              bids={jobBids}
              isLoading={isLoadingJobs || isLoadingBids}
              refetch={refetchJobs}
            />
          </TabsContent>
          <TabsContent value="orders" className="space-y-4">
            <ClientOrderList orders={orders} isLoading={isLoadingOrders} />
          </TabsContent>
        </Tabs>
      </div>

      {/* New Job Dialog */}
      <Dialog open={showNewJobDialog} onOpenChange={setShowNewJobDialog}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Post a New Job</DialogTitle>
            <DialogDescription>
              Create a detailed job posting to attract qualified writers. Be specific about your requirements, 
              deadline, and provide supporting materials to get the best results.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <JobForm
              onSubmit={handleCreateJob}
              isPending={createJobMutation.isPending}
            />
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}