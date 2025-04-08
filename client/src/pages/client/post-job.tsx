import React, { useState } from "react";
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
import { useLocation, Link } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { InfoIcon, Upload } from "lucide-react";
import { FileUpload, FileData } from "@/components/file-upload";

// Form schema for job creation
const jobSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100, "Title must be less than 100 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  category: z.string().min(1, "Please select a category"),
  budget: z.number().min(10, "Budget must be at least $10"),
  deadline: z.number().int().min(1, "Deadline must be at least 1 day"),
  pages: z.number().int().min(1, "Number of pages must be at least 1"),
  referenceFiles: z.array(z.any()).optional(),
});

type JobFormValues = z.infer<typeof jobSchema>;

export default function ClientPostJob() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [uploadedFiles, setUploadedFiles] = useState<FileData[]>([]);

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
      referenceFiles: [],
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
      navigate("/client/jobs");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to post job",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // No automatic form update when files are uploaded
  // Only update the form value when submitting
  
  const onSubmit = (values: JobFormValues) => {
    // Add uploaded files to the job data
    const jobData = {
      ...values,
      referenceFiles: uploadedFiles
    };
    
    // Validate that we have a title and description before submitting
    if (!values.title.trim()) {
      toast({
        title: "Missing title",
        description: "Please provide a job title",
        variant: "destructive",
      });
      return;
    }
    
    if (!values.description.trim()) {
      toast({
        title: "Missing description",
        description: "Please provide a job description",
        variant: "destructive",
      });
      return;
    }
    
    createJobMutation.mutate(jobData);
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
                    
                    <div className="grid grid-cols-1 gap-6">
                      <FormField
                        control={form.control}
                        name="budget"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Budget (USD)</FormLabel>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
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
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
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
                      
                      <FormField
                        control={form.control}
                        name="referenceFiles"
                        render={() => (
                          <FormItem>
                            <FileUpload
                              uploadedFiles={uploadedFiles}
                              setUploadedFiles={setUploadedFiles}
                              maxFiles={5}
                              allowedFileTypes={['.pdf', '.doc', '.docx', '.txt', '.rtf', '.jpg', '.jpeg', '.png']}
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="mt-4 pt-4 border-t flex flex-col sm:flex-row gap-3 justify-end items-center">
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
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Posting Job...
                          </>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                              <path d="M12 5v14"></path>
                              <path d="M5 12h14"></path>
                            </svg>
                            Post New Job
                          </>
                        )}
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
                  <Link href="/client/jobs">View My Current Jobs</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
