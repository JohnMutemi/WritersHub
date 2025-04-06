import { useState } from "react";
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
import { CalendarIcon, Clock, Loader2, Paperclip, X } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";

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
  // Additional fields
  additionalInstructions: z.string().optional(),
});

// For the file upload and time, we'll add them separately to the form state
interface ExtendedFormValues {
  exactTime: boolean;
  hour: string;
  minute: string;
  ampm: string;
  attachmentFile: File | null;
}

type JobFormValues = z.infer<typeof jobFormSchema>;

interface JobFormProps {
  onSubmit: (values: JobFormValues & ExtendedFormValues) => void;
  isPending: boolean;
  defaultValues?: Partial<JobFormValues>;
}

export function JobForm({ onSubmit, isPending, defaultValues }: JobFormProps) {
  // State for the extended form values
  const [exactTime, setExactTime] = useState(false);
  const [hour, setHour] = useState("12");
  const [minute, setMinute] = useState("00");
  const [ampm, setAmpm] = useState("PM");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      title: defaultValues?.title || "",
      description: defaultValues?.description || "",
      budget: defaultValues?.budget || 50,
      deadline: defaultValues?.deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 1 week from now
      category: defaultValues?.category || "General",
      additionalInstructions: defaultValues?.additionalInstructions || "",
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setFileError("File size must be less than 5MB");
        return;
      }
      
      // Check file type (only allow common document types)
      const allowedTypes = [
        'application/pdf', 
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'image/jpeg',
        'image/png'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        setFileError("Only document files, images, and PDFs are allowed");
        return;
      }
      
      setAttachmentFile(file);
      setFileError(null);
    }
  };
  
  const removeFile = () => {
    setAttachmentFile(null);
  };

  const handleFormSubmit = (values: JobFormValues) => {
    // Combine the regular form values with our extended values
    const extendedValues: ExtendedFormValues = {
      exactTime,
      hour,
      minute,
      ampm,
      attachmentFile
    };

    // This will pass all values to the parent's onSubmit handler
    onSubmit({
      ...values,
      ...extendedValues
    });
  };

  // Generate hour options (1-12)
  const hourOptions = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  
  // Generate minute options (00-55 in 5-minute increments)
  const minuteOptions = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Job Title</FormLabel>
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
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Detailed requirements, word count, style guidelines, etc."
                  className="min-h-[150px]"
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
        
        <div className="flex flex-col sm:flex-row gap-5">
          <FormField
            control={form.control}
            name="budget"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Budget ($)</FormLabel>
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
            name="category"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Category</FormLabel>
                <Select 
                  defaultValue={field.value} 
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Academic">Academic</SelectItem>
                    <SelectItem value="Business">Business</SelectItem>
                    <SelectItem value="Creative">Creative</SelectItem>
                    <SelectItem value="Technical">Technical</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="General">General</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Select the type of writing needed.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Deadline section with time */}
        <div className="border rounded-lg p-5 bg-muted/30">
          <h3 className="text-lg font-medium mb-4 flex items-center">
            <CalendarIcon className="h-5 w-5 mr-2 text-primary" />
            Set Deadline
          </h3>
          
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="deadline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deadline Date</FormLabel>
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
                            format(field.value, "PPP")
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
                    Select the date when you need this project completed.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="bg-background p-3 rounded-md">
              <div className="flex items-center space-x-2 mb-4">
                <Switch 
                  id="exact-time" 
                  checked={exactTime}
                  onCheckedChange={setExactTime}
                />
                <Label htmlFor="exact-time" className="flex items-center cursor-pointer">
                  <Clock className="h-4 w-4 mr-2 text-amber-600" />
                  Specify exact time (recommended)
                </Label>
              </div>

              {exactTime ? (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label htmlFor="deadline-hour">Hour</Label>
                    <Select value={hour} onValueChange={setHour}>
                      <SelectTrigger id="deadline-hour">
                        <SelectValue placeholder="Hour" />
                      </SelectTrigger>
                      <SelectContent>
                        {hourOptions.map(h => (
                          <SelectItem key={h} value={h}>{h}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="deadline-minute">Minute</Label>
                    <Select value={minute} onValueChange={setMinute}>
                      <SelectTrigger id="deadline-minute">
                        <SelectValue placeholder="Minute" />
                      </SelectTrigger>
                      <SelectContent>
                        {minuteOptions.map(m => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="deadline-ampm">AM/PM</Label>
                    <Select value={ampm} onValueChange={setAmpm}>
                      <SelectTrigger id="deadline-ampm">
                        <SelectValue placeholder="AM/PM" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AM">AM</SelectItem>
                        <SelectItem value="PM">PM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Without a specific time, deadline will default to 11:59 PM on the selected date.
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* File attachment */}
        <div className="border rounded-lg p-5 bg-muted/30">
          <h3 className="text-lg font-medium mb-4 flex items-center">
            <Paperclip className="h-5 w-5 mr-2 text-primary" />
            Additional Information & Attachments
          </h3>
          
          <div className="space-y-4">
            <div className="bg-background p-4 rounded-md">
              <Label htmlFor="attachment" className="block mb-2 font-medium">Job Resources</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors">
                <div className="mb-4">
                  {!attachmentFile ? (
                    <Paperclip className="h-8 w-8 mx-auto text-muted-foreground" />
                  ) : (
                    <div className="flex justify-center">
                      <div className="relative w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                        <Paperclip className="h-8 w-8 text-primary" />
                        <div className="absolute -top-2 -right-2">
                          <Button 
                            type="button" 
                            variant="destructive" 
                            size="icon" 
                            className="h-6 w-6 rounded-full"
                            onClick={removeFile}
                          >
                            <X className="h-3 w-3" />
                            <span className="sr-only">Remove file</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {attachmentFile ? (
                  <div className="text-sm">
                    <p className="font-semibold truncate">{attachmentFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(attachmentFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                ) : (
                  <>
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="flex items-center gap-2 mx-auto"
                      onClick={() => document.getElementById('attachment-input')?.click()}
                    >
                      <Paperclip className="h-4 w-4" />
                      Attach File
                    </Button>
                    <Input 
                      id="attachment-input"
                      type="file" 
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Max 5MB. Supported formats: PDF, DOCX, XLSX, TXT, JPG, PNG.
                    </p>
                  </>
                )}
                
                {fileError && (
                  <p className="text-sm text-destructive mt-2">{fileError}</p>
                )}
              </div>
            </div>

            {/* Additional instructions */}
            <FormField
              control={form.control}
              name="additionalInstructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Instructions</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Include any specific requirements, references, sources to be used, or special instructions for the writer. If you've attached a file, describe what it contains and how it should be used."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Providing clear instructions helps writers deliver exactly what you need.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <Button type="submit" className="w-full sm:w-auto" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Posting...
            </>
          ) : (
            "Post Job"
          )}
        </Button>
      </form>
    </Form>
  );
}