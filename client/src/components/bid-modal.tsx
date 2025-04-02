import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Job, insertBidSchema } from '@shared/schema';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

interface BidModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
}

// Validate bid amount and deadline
const bidFormSchema = insertBidSchema.extend({
  amount: z.number().min(1, {
    message: 'Bid amount must be at least $1.',
  }),
  deliveryTime: z.number().min(1, {
    message: 'Delivery time must be at least 1 day.',
  }),
  message: z.string().min(10, {
    message: 'Please provide a more detailed message to the client.',
  }),
});

type BidFormValues = z.infer<typeof bidFormSchema>;

export function BidModal({ job, isOpen, onClose }: BidModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<BidFormValues>({
    resolver: zodResolver(bidFormSchema),
    defaultValues: {
      jobId: job?.id || 0,
      writerId: user?.id || 0,
      amount: 0,
      deliveryTime: 1,
      message: '',
    },
  });

  // Update form values when job changes
  React.useEffect(() => {
    if (job) {
      form.setValue('jobId', job.id);
      form.setValue('writerId', user?.id || 0);
      
      // Set a reasonable default bid
      // For example, 90% of the job budget
      const defaultBid = Math.round(job.budget * 0.9 * 100) / 100;
      form.setValue('amount', defaultBid);
      
      // Set a reasonable default delivery time
      // For example, 80% of the deadline
      const defaultDeliveryTime = Math.max(1, Math.floor(job.deadline * 0.8));
      form.setValue('deliveryTime', defaultDeliveryTime);
    }
  }, [job, form, user]);

  const bidMutation = useMutation({
    mutationFn: async (values: BidFormValues) => {
      const res = await apiRequest('POST', '/api/bids', values);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bids'] });
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
      toast({
        title: 'Bid Submitted',
        description: 'Your bid has been successfully submitted.',
      });
      form.reset();
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit bid. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (values: BidFormValues) => {
    bidMutation.mutate(values);
  };
  
  // Dynamically update the display values based on form state
  const amount = form.watch('amount');
  const deliveryTime = form.watch('deliveryTime');

  if (!job) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Place a Bid</DialogTitle>
          <DialogDescription>
            Submit your proposal for "{job.title}"
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Bid Amount ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      Client's budget: ${job.budget.toFixed(2)}
                    </FormDescription>
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
                        min="1"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormDescription>
                      Client's deadline: {job.deadline} days
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cover Letter</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Explain why you're the best writer for this job..."
                        rows={5}
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
            </div>

            <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
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
                disabled={bidMutation.isPending || (user?.role === 'writer' && user.approvalStatus !== 'approved')}
                className={(bidMutation.isPending || (user?.role === 'writer' && user.approvalStatus !== 'approved')) ? "opacity-70" : ""}
                title={user?.role === 'writer' && user.approvalStatus !== 'approved' ? "Writer approval required" : ""}
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