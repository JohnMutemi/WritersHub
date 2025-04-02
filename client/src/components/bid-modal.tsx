import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Job } from "@shared/schema";
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
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useEffect } from "react";

interface BidModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
}

// Form schema for bid submission
const bidFormSchema = z.object({
  amount: z
    .string()
    .min(1, "Bid amount is required")
    .refine((val) => !isNaN(Number(val)), "Bid amount must be a number")
    .refine((val) => Number(val) > 0, "Bid amount must be greater than 0"),
  proposal: z
    .string()
    .min(50, "Proposal must be at least 50 characters")
    .max(1000, "Proposal must not exceed 1000 characters"),
  deliveryDays: z
    .string()
    .min(1, "Delivery days are required")
    .refine((val) => !isNaN(Number(val)), "Delivery days must be a number")
    .refine((val) => Number(val) > 0, "Delivery days must be greater than 0"),
});

type BidFormValues = z.infer<typeof bidFormSchema>;

export function BidModal({ job, isOpen, onClose }: BidModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  // Initialize react-hook-form
  const form = useForm<BidFormValues>({
    resolver: zodResolver(bidFormSchema),
    defaultValues: {
      amount: job ? job.budget.toString() : "",
      proposal: "",
      deliveryDays: job ? job.deadline.toString() : "",
    },
  });

  // Bid submission mutation
  const bidMutation = useMutation({
    mutationFn: async (values: BidFormValues) => {
      if (!job || !user) throw new Error("Missing job or user information");
      
      const bidData = {
        jobId: job.id,
        writerId: user.id,
        amount: Number(values.amount),
        proposal: values.proposal,
        deliveryDays: Number(values.deliveryDays),
        status: "pending"
      };
      
      const response = await apiRequest("POST", "/api/bids", bidData);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Bid Submitted",
        description: "Your bid has been submitted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/writer/bids'] });
      form.reset();
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Submission Failed",
        description: error.message || "There was an error submitting your bid.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: BidFormValues) => {
    bidMutation.mutate(values);
  };

  // When the modal opens, reset form with job defaults
  useEffect(() => {
    if (isOpen && job) {
      form.reset({
        amount: job.budget.toString(),
        proposal: "",
        deliveryDays: job.deadline.toString(),
      });
    }
  }, [isOpen, job, form]);

  if (!job) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Place a Bid on "{job.title}"</DialogTitle>
          <DialogDescription>
            Submit your proposal and bid amount for this job.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bid Amount ($)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormDescription>
                      Client budget: ${job.budget}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="deliveryDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Delivery Days</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormDescription>
                      Deadline: {job.deadline} days
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="proposal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Proposal</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe why you're the best person for this job and how you plan to approach it..."
                      className="min-h-[150px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Be specific about your experience and approach.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={bidMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={bidMutation.isPending}
                className={bidMutation.isPending ? "opacity-70" : ""}
              >
                {bidMutation.isPending ? "Submitting..." : "Submit Bid"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}