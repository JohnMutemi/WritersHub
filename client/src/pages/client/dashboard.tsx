import { useAuth } from "@/hooks/use-auth";
import { DashboardLayout } from "@/components/ui/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { Job, Order, Bid } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Check, Clock, X, Upload } from "lucide-react";
import { OrderItem } from "@/components/order-item";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Form schema for creating a new job
const jobFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  category: z.string().min(1, "Please select a category"),
  budget: z.number().min(10, "Budget must be at least $10"),
  deadline: z.number().min(1, "Deadline must be at least 1 day"),
  pages: z.number().optional(),
});

export default function ClientDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [createJobOpen, setCreateJobOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showBidsDialog, setShowBidsDialog] = useState(false);

  // Fetch client stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/client/stats'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/client/stats');
      return response.json();
    },
    enabled: !!user
  });

  // Fetch client's jobs
  const { data: myJobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['/api/client/jobs'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/client/jobs');
      return response.json();
    },
    enabled: !!user
  });

  // Fetch client's orders
  const { data: myOrders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['/api/client/orders'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/client/orders');
      return response.json();
    },
    enabled: !!user
  });

  // Fetch bids for a specific job
  const { data: jobBids = [], isLoading: bidsLoading, refetch: refetchBids } = useQuery({
    queryKey: ['/api/jobs/bids', selectedJob?.id],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/jobs/${selectedJob?.id}/bids`);
      return response.json();
    },
    enabled: !!selectedJob
  });

  // Create job mutation
  const createJobMutation = useMutation({
    mutationFn: async (data: z.infer<typeof jobFormSchema>) => {
      const response = await apiRequest('POST', '/api/jobs', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Job Created",
        description: "Your job posting has been created successfully.",
      });
      setCreateJobOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/client/jobs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/client/stats'] });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create job. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Accept bid mutation
  const acceptBidMutation = useMutation({
    mutationFn: async (bidId: number) => {
      const response = await apiRequest('POST', `/api/bids/${bidId}/accept`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Bid Accepted",
        description: "You have accepted the bid and created an order.",
      });
      setShowBidsDialog(false);
      queryClient.invalidateQueries({ queryKey: ['/api/client/jobs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/client/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/client/stats'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to accept bid. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Form for creating a new job
  const form = useForm<z.infer<typeof jobFormSchema>>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      budget: 0,
      deadline: 7,
      pages: 0,
    },
  });

  const onSubmit = (data: z.infer<typeof jobFormSchema>) => {
    createJobMutation.mutate(data);
  };

  const handleViewBids = (job: Job) => {
    setSelectedJob(job);
    setShowBidsDialog(true);
    if (selectedJob?.id !== job.id) {
      setTimeout(() => refetchBids(), 0);
    }
  };

  const handleAcceptBid = (bid: Bid) => {
    acceptBidMutation.mutate(bid.id);
  };

  const handleViewOrderDetails = (order: Order) => {
    // Implement order detail view
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Client Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {user?.fullName || user?.username}
            </p>
          </div>
          <Button onClick={() => setCreateJobOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Post New Job
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Posted Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.postedJobs || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.activeOrders || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Completed Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.completedOrders || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats?.totalSpent || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="my-jobs" className="space-y-4">
          <TabsList>
            <TabsTrigger value="my-jobs">My Jobs</TabsTrigger>
            <TabsTrigger value="active-orders">Active Orders</TabsTrigger>
            <TabsTrigger value="completed-orders">Completed Orders</TabsTrigger>
          </TabsList>
          
          {/* My Jobs Tab */}
          <TabsContent value="my-jobs" className="space-y-4">
            <div className="rounded-md border">
              {jobsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : myJobs.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">You haven't posted any jobs yet.</p>
                  <Button variant="outline" className="mt-4" onClick={() => setCreateJobOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Post Your First Job
                  </Button>
                </div>
              ) : (
                <div className="relative w-full overflow-auto">
                  <table className="w-full caption-bottom text-sm">
                    <thead className="[&_tr]:border-b">
                      <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        <th className="h-12 px-4 text-left align-middle font-medium">Title</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Budget</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Status</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Created</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                      {myJobs.map((job: Job) => (
                        <tr key={job.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                          <td className="p-4 align-middle font-medium">{job.title}</td>
                          <td className="p-4 align-middle">${job.budget}</td>
                          <td className="p-4 align-middle">
                            <Badge variant={
                              job.status === 'in_progress' ? 'default' :
                              job.status === 'completed' ? 'default' :
                              job.status === 'cancelled' ? 'destructive' :
                              'outline'
                            }>
                              {job.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                            </Badge>
                          </td>
                          <td className="p-4 align-middle">{new Date(job.createdAt).toLocaleDateString()}</td>
                          <td className="p-4 align-middle">
                            {job.status === 'open' && (
                              <Button variant="outline" size="sm" onClick={() => handleViewBids(job)}>
                                View Bids
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Active Orders Tab */}
          <TabsContent value="active-orders" className="space-y-4">
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
          <TabsContent value="completed-orders" className="space-y-4">
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

      {/* Create Job Dialog */}
      <Dialog open={createJobOpen} onOpenChange={setCreateJobOpen}>
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Post a New Job</DialogTitle>
            <DialogDescription>
              Fill in the details of your writing job to attract qualified writers.
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-[calc(85vh-120px)] overflow-y-auto pr-2">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Title <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Website Content for E-commerce Store" {...field} />
                      </FormControl>
                      <FormDescription>
                        A clear title helps attract the right writers
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category <span className="text-red-500">*</span></FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="blog">Blog Posts</SelectItem>
                            <SelectItem value="website">Website Content</SelectItem>
                            <SelectItem value="technical">Technical Writing</SelectItem>
                            <SelectItem value="social">Social Media</SelectItem>
                            <SelectItem value="marketing">Marketing</SelectItem>
                            <SelectItem value="creative">Creative Writing</SelectItem>
                            <SelectItem value="academic">Academic</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Choose the type of content you need
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="pages"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Word Count (approx)</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))} 
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select word count" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1">~500 words (1 page)</SelectItem>
                            <SelectItem value="2">~1000 words (2 pages)</SelectItem>
                            <SelectItem value="3">~1500 words (3 pages)</SelectItem>
                            <SelectItem value="4">~2000 words (4 pages)</SelectItem>
                            <SelectItem value="5">~2500 words (5 pages)</SelectItem>
                            <SelectItem value="10">~5000 words (10 pages)</SelectItem>
                            <SelectItem value="20">~10000 words (20 pages)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Estimate based on ~500 words per page
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Description <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Provide detailed requirements for your writing project. Include audience, purpose, tone, style guidelines, and any specific sections or topics that should be covered."
                          className="min-h-[150px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Be specific about your requirements, including target audience, tone, and any research needed
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="border rounded-md p-4">
                  <h4 className="text-sm font-medium mb-3">Reference Materials (Optional)</h4>
                  <div className="bg-muted/30 rounded-md p-3 mb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center">
                        <Upload className="h-4 w-4 text-muted-foreground mr-2" />
                        <span className="text-sm text-muted-foreground">Add files like examples, style guides, or other resources</span>
                      </div>
                      <Button variant="outline" size="sm" type="button" className="h-8 shrink-0">
                        <Upload className="h-4 w-4 mr-1" />
                        Upload Files
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Supported formats: PDF, DOC, DOCX, TXT, RTF, JPG, PNG (Max size: 10MB)
                  </p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FormField
                    control={form.control}
                    name="budget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Budget ($) <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={10}
                            step={5}
                            {...field}
                            onChange={e => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Your budget for this writing project
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="deadline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deadline (days) <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          How soon you need the work completed
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="pt-4 border-t flex flex-col sm:flex-row gap-3 justify-end items-center">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full sm:w-auto"
                    onClick={() => form.reset()}
                  >
                    Reset Form
                  </Button>
                  <Button 
                    type="submit" 
                    className="w-full sm:w-auto"
                    disabled={createJobMutation.isPending}
                  >
                    {createJobMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Posting Job...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Post New Job
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Bids Dialog */}
      <Dialog open={showBidsDialog} onOpenChange={setShowBidsDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Bids for {selectedJob?.title}</DialogTitle>
            <DialogDescription>
              Review and accept bids from writers for your job.
            </DialogDescription>
          </DialogHeader>
          {bidsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : jobBids.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No bids received yet. Check back later!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobBids.map((bid: any) => (
                <div key={bid.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium">{bid.writer.fullName || bid.writer.username}</h3>
                      <p className="text-sm text-muted-foreground">${bid.amount} • {bid.deliveryTime} days</p>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => handleAcceptBid(bid)}
                      disabled={acceptBidMutation.isPending}
                    >
                      {acceptBidMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Accept Bid
                    </Button>
                  </div>
                  <div className="text-sm mt-2">
                    <h4 className="font-medium mb-1">Cover Letter:</h4>
                    <p>{bid.coverLetter}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}