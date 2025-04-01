import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Job } from "@shared/schema";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface BidModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
}

// Validation schema for bid form
const bidFormSchema = z.object({
  amount: z.number().min(1, "Bid amount must be at least $1"),
  deliveryTime: z.number().int().min(1, "Delivery time must be at least 1 day"),
  coverLetter: z.string().min(10, "Cover letter must be at least 10 characters"),
});

type BidFormValues = z.infer<typeof bidFormSchema>;

export function BidModal({ job, isOpen, onClose }: BidModalProps) {
  const { toast } = useToast();
  
  const form = useForm<BidFormValues>({
    resolver: zodResolver(bidFormSchema),
    defaultValues: {
      amount: job?.budget || 0,
      deliveryTime: job?.deadline || 1,
      coverLetter: ""
    },
  });
  
  // Update form when job changes
  React.useEffect(() => {
    if (job) {
      form.reset({
        amount: job.budget || 0,
        deliveryTime: job.deadline || 1,
        coverLetter: ""
      });
    }
  }, [job, form]);

  const bidMutation = useMutation({
    mutationFn: async (values: BidFormValues) => {
      if (!job) throw new Error("No job selected");
      
      const data = {
        ...values,
        jobId: job.id,
      };
      
      const response = await apiRequest("POST", "/api/bids", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Bid submitted successfully",
        description: "Your bid has been submitted and is awaiting client review",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bids"] });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to submit bid",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: BidFormValues) => {
    bidMutation.mutate(values);
  };

  if (!job) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Place a Bid</DialogTitle>
          <DialogDescription>
            Please enter your bid details for <span className="font-medium">{job?.title}</span>
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Bid Amount ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      step="0.01"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="deliveryTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Delivery Time (days)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter days"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="coverLetter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cover Letter</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      placeholder="Explain why you're the best fit for this job..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="sm:justify-between">
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
