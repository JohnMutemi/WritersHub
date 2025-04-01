import React from "react";
import { DashboardLayout } from "@/components/ui/dashboard-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { InfoIcon } from "lucide-react";

// Form schema for job creation
const jobSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100, "Title must be less than 100 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  category: z.string().min(1, "Please select a category"),
  budget: z.number().min(10, "Budget must be at least $10"),
  deadline: z.number().int().min(1, "Deadline must be at least 1 day"),
  pages: z.number().int().min(1, "Number of pages must be at least 1"),
});

type JobFormValues = z.infer<typeof jobSchema>;

export default function ClientPostJob() {
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Job form
  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "Academic",
      budget: 50,
      deadline: 7,
      pages: 5,
    },
  });

  // Create job mutation
  const createJobMutation = useMutation({
    mutationFn: async (values: JobFormValues) => {
      const response = await apiRequest("POST", "/api/jobs", values);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/client"] });
      toast({
        title: "Job posted successfully",
        description: "Writers can now bid on your job",
      });
      navigate("/client/manage-orders");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to post job",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: JobFormValues) => {
    createJobMutation.mutate(values);
  };

  return (
    <DashboardLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">Post a New Job</h1>
          
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Job Form */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Job Details</CardTitle>
                <CardDescription>Provide the details of your writing job</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Job Title</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., Academic Research Paper on Climate Change" 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            A clear title helps attract the right writers
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Job Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Provide a detailed description of the writing task, including specific requirements, style preferences, and any other relevant information."
                              rows={6}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Be as specific as possible to get the best results
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Academic">Academic</SelectItem>
                                <SelectItem value="Business">Business</SelectItem>
                                <SelectItem value="Technical">Technical</SelectItem>
                                <SelectItem value="Creative">Creative</SelectItem>
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
                            <FormLabel>Number of Pages</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={1}
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormDescription>
                              1 page ≈ 275 words
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="budget"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Budget (USD)</FormLabel>
                          <div className="flex items-center space-x-4">
                            <Input
                              type="number"
                              min={10}
                              className="w-24"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            />
                            <div className="flex-1">
                              <Slider
                                defaultValue={[50]}
                                min={10}
                                max={500}
                                step={5}
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                              />
                              <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>$10</span>
                                <span>$500+</span>
                              </div>
                            </div>
                          </div>
                          <FormDescription>
                            Writers can bid above or below this amount
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
                          <FormLabel>Deadline (days)</FormLabel>
                          <div className="flex items-center space-x-4">
                            <Input
                              type="number"
                              min={1}
                              className="w-24"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                            <div className="flex-1">
                              <Slider
                                defaultValue={[7]}
                                min={1}
                                max={30}
                                step={1}
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                              />
                              <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>1 day</span>
                                <span>30 days</span>
                              </div>
                            </div>
                          </div>
                          <FormDescription>
                            How soon you need the work completed
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end">
                      <Button 
                        type="submit"
                        disabled={createJobMutation.isPending}
                      >
                        {createJobMutation.isPending ? "Posting..." : "Post Job"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
            
            {/* Tips and Information */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Tips for Great Results</CardTitle>
                <CardDescription>How to get the best responses from writers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium mb-2">Be Specific</h3>
                  <p className="text-sm text-gray-500">
                    Clearly outline your requirements, formatting preferences, and any specific sources or research needed.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Set a Reasonable Budget</h3>
                  <p className="text-sm text-gray-500">
                    Higher quality work typically commands higher rates. Consider the complexity and expertise required.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Allow Sufficient Time</h3>
                  <p className="text-sm text-gray-500">
                    Rush jobs may cost more or attract fewer bids. Give writers reasonable time to deliver quality work.
                  </p>
                </div>
                
                <Alert className="bg-blue-50 border-blue-200">
                  <InfoIcon className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-700 text-sm">
                    Once you post a job, writers will begin submitting bids. You can review each bid and accept the one that best matches your needs.
                  </AlertDescription>
                </Alert>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/client/manage-orders">View My Current Jobs</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
