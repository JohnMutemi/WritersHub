import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Validate withdrawal details
const withdrawalSchema = z.object({
  amount: z.number().min(10, {
    message: 'Minimum withdrawal amount is $10.',
  }).max(5000, {
    message: 'Maximum withdrawal amount is $5,000.',
  }),
  paymentMethod: z.enum(['paypal', 'mpesa', 'bank_transfer'], {
    required_error: 'Please select a payment method.',
  }),
  accountDetails: z.string().min(5, {
    message: 'Please provide valid account details.',
  }),
});

type WithdrawalFormValues = z.infer<typeof withdrawalSchema>;

export function WithdrawModal({ isOpen, onClose }: WithdrawModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<WithdrawalFormValues>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      amount: 0,
      paymentMethod: 'paypal',
      accountDetails: '',
    },
  });

  const withdrawalMutation = useMutation({
    mutationFn: async (values: WithdrawalFormValues) => {
      const res = await apiRequest('POST', '/api/transactions/withdraw', values);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats/writer'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      toast({
        title: 'Withdrawal Requested',
        description: 'Your withdrawal request has been submitted successfully.',
      });
      form.reset();
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to process withdrawal. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (values: WithdrawalFormValues) => {
    // Check if user has enough balance
    if (user && values.amount > user.balance) {
      form.setError('amount', {
        type: 'manual',
        message: 'Insufficient balance for this withdrawal.',
      });
      return;
    }
    
    withdrawalMutation.mutate(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Withdraw Funds</DialogTitle>
          <DialogDescription>
            Withdraw your earnings to your preferred payment method.
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
                    <FormLabel>Amount ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      Available balance: ${user?.balance.toFixed(2) || '0.00'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="paypal">PayPal</SelectItem>
                        <SelectItem value="mpesa">M-Pesa</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accountDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Details</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={
                          form.watch('paymentMethod') === 'paypal'
                            ? 'PayPal email address'
                            : form.watch('paymentMethod') === 'mpesa'
                            ? 'M-Pesa phone number'
                            : 'Bank account details'
                        }
                        {...field}
                      />
                    </FormControl>
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
                disabled={withdrawalMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={withdrawalMutation.isPending}
              >
                {withdrawalMutation.isPending ? "Processing..." : "Withdraw Funds"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}