import { useState, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
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
import { insertJobSchema } from "@shared/schema";
import { CalendarIcon, Loader2, AlertCircle, FileIcon, X, Upload, Paperclip } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Extend the job schema with client validation
const jobFormSchema = insertJobSchema.extend({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  budget: z.coerce.number().min(10, "Budget must be at least $10"),
  // For the form we use a Date object, but we'll convert to days when submitting
  deadline: z.date().refine((date) => date > new Date(), {
    message: "Deadline must be in the future",
  }),
  // We'll provide a default category if not selected
  category: z.string().default("General"),
});

export type JobFormValues = z.infer<typeof jobFormSchema>;

interface JobFormProps {
  onSubmit: (values: JobFormValues) => void;
  isPending: boolean;
  defaultValues?: Partial<JobFormValues>;
}

export function JobForm({ onSubmit, isPending, defaultValues }: JobFormProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{filename: string, originalName: string, path: string}>>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      title: defaultValues?.title || "",
      description: defaultValues?.description || "",
      budget: defaultValues?.budget || 50,
      deadline: defaultValues?.deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 1 week from now
    },
  });

  const categories = [
    { value: "blog", label: "Blog Post" },
    { value: "article", label: "Article" },
    { value: "technical", label: "Technical Writing" },
    { value: "creative", label: "Creative Writing" },
    { value: "academic", label: "Academic Writing" },
    { value: "copywriting", label: "Copywriting" },
    { value: "content", label: "Content Writing" },
    { value: "seo", label: "SEO Content" },
    { value: "general", label: "General" },
  ];
  
  const handleSubmitWithFiles = (values: JobFormValues) => {
    // Create file paths string
    const attachments = uploadedFiles.map(file => file.path.replace(/^\/uploads\//, '')).join(',');
    
    // Call the parent onSubmit with file attachments
    onSubmit({
      ...values,
      attachments
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmitWithFiles)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Job Title <span className="text-red-500">*</span></FormLabel>
              <FormControl>
                <Input placeholder="E.g., Technical Blog Post on AI Development" {...field} />
              </FormControl>
              <FormDescription>
                A clear, descriptive title will attract qualified writers.
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
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Choose the type of content you need.
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
                  Estimate based on ~500 words per page.
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
              <FormLabel>Description <span className="text-red-500">*</span></FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Provide detailed requirements for your writing project. Include audience, purpose, tone, style guidelines, and any specific sections or topics that should be covered."
                  className="min-h-[180px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Be specific about your requirements, including target audience, tone, and any research needed.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Reference Style Section */}
        <div className="border rounded-md p-4 mb-5">
          <h4 className="text-sm font-medium mb-3">Reference Style</h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h5 className="text-sm font-medium">Citation Style</h5>
              <Select 
                onValueChange={(value) => console.log(value)} 
                defaultValue="none"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select citation style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apa">APA</SelectItem>
                  <SelectItem value="mla">MLA</SelectItem>
                  <SelectItem value="chicago">Chicago</SelectItem>
                  <SelectItem value="harvard">Harvard</SelectItem>
                  <SelectItem value="ieee">IEEE</SelectItem>
                  <SelectItem value="none">None / Not Applicable</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Choose if you need specific citations
              </p>
            </div>
            
            <div className="space-y-2">
              <h5 className="text-sm font-medium">Reference Links</h5>
              <Textarea 
                placeholder="Paste links to reference materials (one per line)"
                className="min-h-[100px]"
              />
              <p className="text-xs text-muted-foreground">
                Add links to publicly accessible reference materials
              </p>
            </div>
          </div>
        </div>

        {/* File Uploads Section - Completely Separate */}
        <div className="border rounded-md p-4 mb-5">
          <h4 className="text-sm font-medium mb-3">File Attachments</h4>
          
          {uploadError && (
            <Alert variant="destructive" className="mb-3">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{uploadError}</AlertDescription>
            </Alert>
          )}
          
          {/* File uploader */}
          <div className="bg-muted/30 rounded-md p-3 mb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Upload className="text-muted-foreground mr-2 h-4 w-4" />
                <span className="text-sm text-muted-foreground">Upload files</span>
              </div>
              <div>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden" 
                  onChange={async (event) => {
                    if (!event.target.files || event.target.files.length === 0) return;
                    
                    // Check if adding more files would exceed the limit
                    if (uploadedFiles.length + event.target.files.length > 5) {
                      setUploadError(`You can only upload a maximum of 5 files.`);
                      toast({
                        title: "Too many files",
                        description: `You can only upload a maximum of 5 files.`,
                        variant: "destructive",
                      });
                      return;
                    }
                    
                    const files = Array.from(event.target.files);
                    const formData = new FormData();
                    
                    // Add each file to FormData
                    files.forEach(file => {
                      formData.append('files', file);
                    });
                    
                    setIsUploading(true);
                    setUploadError(null);
                    
                    try {
                      const response = await apiRequest("POST", "/api/upload/job-files", formData, undefined, true);
                      
                      if (response.ok) {
                        const data = await response.json();
                        setUploadedFiles(prev => [...prev, ...data]);
                        toast({
                          title: "Files uploaded successfully",
                          description: `${files.length} file${files.length > 1 ? 's' : ''} uploaded.`,
                        });
                      } else {
                        const errorData = await response.json();
                        throw new Error(errorData.message || "Failed to upload files");
                      }
                    } catch (error: any) {
                      console.error("File upload error:", error);
                      setUploadError(error.message || "An error occurred while uploading files");
                      toast({
                        title: "Upload failed",
                        description: error.message || "Failed to upload files. Please try again.",
                        variant: "destructive",
                      });
                    } finally {
                      setIsUploading(false);
                      // Reset the file input
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }
                  }}
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.rtf,.jpg,.jpeg,.png"
                />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  type="button" 
                  className="h-8"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || uploadedFiles.length >= 5}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Paperclip className="mr-1 h-4 w-4" />
                      {uploadedFiles.length >= 5 ? 'Max files reached' : 'Upload'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
          
          {/* Display uploaded files */}
          {uploadedFiles.length > 0 && (
            <div className="mb-3 space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground">Uploaded Files:</h4>
              <div className="space-y-2">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-muted/20 rounded p-2 text-sm">
                    <div className="flex items-center">
                      <FileIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="truncate max-w-[200px]">{file.originalName}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0" 
                      onClick={() => {
                        const newFiles = [...uploadedFiles];
                        newFiles.splice(index, 1);
                        setUploadedFiles(newFiles);
                      }}
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Remove</span>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
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
                  <Input type="number" min={10} step={5} {...field} />
                </FormControl>
                <FormDescription>
                  Your budget for this writing project.
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
                <FormLabel>Deadline <span className="text-red-500">*</span></FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "EEEE, MMMM d, yyyy")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  When you need this project completed.
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
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
  );
}