import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Job } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface BidModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
}

const bidFormSchema = z.object({
  amount: z.coerce.number().min(5, "Bid amount must be at least $5"),
  deliveryTime: z.coerce.number().min(1, "Delivery time must be at least 1 day"),
  coverLetter: z.string().min(20, "Cover letter must be at least 20 characters"),
});

type BidFormValues = z.infer<typeof bidFormSchema>;

export function BidModal({ job, isOpen, onClose }: BidModalProps) {
  const { toast } = useToast();
  
  const form = useForm<BidFormValues>({
    resolver: zodResolver(bidFormSchema),
    defaultValues: {
      amount: job?.budget || 0,
      deliveryTime: job?.deadline || 7,
      coverLetter: "",
    },
  });

  // Reset form when job changes
  useState(() => {
    if (job) {
      form.reset({
        amount: job.budget,
        deliveryTime: job.deadline ? Math.floor((new Date(job.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 7,
        coverLetter: "",
      });
    }
  });

  const createBidMutation = useMutation({
    mutationFn: async (values: BidFormValues) => {
      const response = await apiRequest('POST', `/api/jobs/${job?.id}/bids`, values);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Bid Submitted",
        description: "Your bid has been submitted successfully.",
      });
      onClose();
      queryClient.invalidateQueries({ queryKey: ['/api/writer/bids'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit bid. Please try again.",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (values: BidFormValues) => {
    if (job) {
      createBidMutation.mutate(values);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Place a Bid</DialogTitle>
          <DialogDescription>
            {job?.title || "Loading job details..."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Bid ($)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={5} 
                        step={1} 
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
                name="deliveryTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Delivery (Days)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={1} 
                        {...field} 
                        onChange={e => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="coverLetter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cover Letter</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Explain why you're the right person for this job..." 
                      className="min-h-[120px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Convince the client why you're the best writer for this job.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={createBidMutation.isPending}>
                {createBidMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Bid
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}