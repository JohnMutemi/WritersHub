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

  const handleCreateJob = (values: JobFormValues) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to post a job.",
        variant: "destructive",
      });
      return;
    }

    // For raw form data without files, we can process it here
    // The job-form component now handles file uploads directly and passes the resulting
    // filedata to us in the form of correct attachments paths
    
    createJobMutation.mutate({
      ...values,
      clientId: user.id
    });
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
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Post a New Job</DialogTitle>
            <DialogDescription>
              Fill out the form below to create a new writing job.
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