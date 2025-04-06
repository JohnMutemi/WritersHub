import { useAuth } from "@/hooks/use-auth";
import { DashboardLayout } from "@/components/ui/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { Job, Order, Bid } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Check, Clock, X, Upload, Tag, FileText, DollarSign } from "lucide-react";
import { format } from "date-fns";
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
            {jobsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : myJobs.length === 0 ? (
              <div className="text-center py-8 border rounded-lg bg-muted/10 p-8">
                <div className="max-w-md mx-auto">
                  <h3 className="text-lg font-semibold mb-2">No Jobs Posted Yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Post your first writing job to attract qualified writers.
                  </p>
                  <Button onClick={() => setCreateJobOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Post Your First Job
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                {myJobs.map((job: Job) => (
                  <Card key={job.id} className="overflow-hidden transition-all hover:shadow-md">
                    <CardHeader className="pb-3 border-b">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <CardTitle className="text-lg font-semibold">{job.title}</CardTitle>
                            <Badge className={
                              job.status === 'open' 
                                ? "bg-green-100 text-green-700 hover:bg-green-100 border-green-200"
                                : job.status === 'in_progress' 
                                ? "bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200"
                                : job.status === 'completed' 
                                ? "bg-gray-100 text-gray-700 hover:bg-gray-100 border-gray-200"
                                : "bg-red-100 text-red-700 hover:bg-red-100 border-red-200"
                            }>
                              {job.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                            </Badge>
                          </div>
                          <CardDescription className="mt-1.5 flex flex-wrap items-center gap-2">
                            <span className="text-xs inline-flex items-center">
                              <Clock className="h-3 w-3 mr-1.5" />
                              Posted {format(new Date(job.createdAt), "MMM d, yyyy")}
                            </span>
                            <span className="text-xs inline-flex items-center">
                              <span className="h-1 w-1 rounded-full bg-muted-foreground inline-block mx-1"></span>
                              ID: #{job.id}
                            </span>
                          </CardDescription>
                        </div>
                        
                        <div className="flex items-center">
                          <div className="px-2 py-1 rounded-full bg-muted flex items-center text-sm">
                            <DollarSign className="h-3.5 w-3.5 text-muted-foreground mr-1" />
                            <span className="font-medium">${job.budget}</span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="p-4">
                      <div className="text-sm text-muted-foreground mb-3 max-h-16 overflow-hidden">
                        {job.description.substring(0, 120)}
                        {job.description.length > 120 && '...'}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-sm flex items-center">
                          <Tag className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                          <span>
                            {job.category.charAt(0).toUpperCase() + job.category.slice(1)}
                          </span>
                        </div>
                        <div className="text-sm flex items-center">
                          <FileText className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                          <span>
                            {job.pages || 1} {(job.pages || 1) === 1 ? 'page' : 'pages'}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                    
                    <CardFooter className="border-t p-3 flex justify-end">
                      {job.status === 'open' ? (
                        <Button size="sm" onClick={() => handleViewBids(job)}>
                          View Bids
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" disabled>
                          {job.status === 'in_progress' ? 'In Progress' : 
                            job.status === 'completed' ? 'Completed' : 'Cancelled'}
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
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
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Post a New Job</DialogTitle>
            <DialogDescription>
              Fill in the details to create your writing job.
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-[calc(85vh-120px)] overflow-y-auto pr-2">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Title <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Website Content for E-commerce Store" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category <span className="text-red-500">*</span></FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="pages"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pages (~500 words each)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1" 
                            placeholder="5" 
                            {...field} 
                            onChange={e => field.onChange(parseInt(e.target.value) || 1)}
                          />
                        </FormControl>
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
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Reference style and attachments */}
                <div className="border rounded-md p-3">
                  <h4 className="text-sm font-medium mb-2">Reference Style & Files</h4>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Citation Style</label>
                        <Select>
                          <SelectTrigger className="h-9 mt-1">
                            <SelectValue placeholder="Select style" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="apa">APA (7th edition)</SelectItem>
                            <SelectItem value="mla">MLA</SelectItem>
                            <SelectItem value="chicago">Chicago/Turabian</SelectItem>
                            <SelectItem value="harvard">Harvard</SelectItem>
                            <SelectItem value="none">None/Not Applicable</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Due Time</label>
                        <div className="flex items-center mt-1">
                          <div className="relative border rounded-md flex-1">
                            <input 
                              type="time" 
                              className="h-9 w-full rounded-md border-input px-3 py-1 text-sm" 
                              defaultValue="23:59" 
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-muted/30 rounded-md p-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground flex items-center">
                          <Upload className="h-3.5 w-3.5 mr-1.5" />
                          Attach reference files (optional)
                        </span>
                        <Button variant="outline" size="sm" className="h-7 text-xs px-2">Upload</Button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
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
                            placeholder="100"
                            {...field}
                            onChange={e => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
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
                            placeholder="7"
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="text-xs text-muted-foreground mt-2">
                  <Clock className="h-3.5 w-3.5 inline mr-1" />
                  Current time: {new Date().toLocaleString()} - Jobs posted now will be visible to writers immediately.
                </div>
                
                <div className="pt-4 border-t flex flex-row gap-3 justify-end items-center">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-auto"
                    onClick={() => form.reset()}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="w-auto"
                    disabled={createJobMutation.isPending}
                  >
                    {createJobMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Post Job
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