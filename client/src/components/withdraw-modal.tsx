import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const withdrawalSchema = z.object({
  amount: z.coerce.number().min(10, "Withdrawal amount must be at least $10"),
  method: z.enum(["paypal", "bank_transfer", "mpesa"], {
    required_error: "Please select a payment method",
  }),
  accountDetails: z.string().min(5, "Please provide valid account details"),
});

type WithdrawalFormValues = z.infer<typeof withdrawalSchema>;

export function WithdrawModal({ isOpen, onClose }: WithdrawModalProps) {
  const { toast } = useToast();
  
  const form = useForm<WithdrawalFormValues>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      amount: 50,
      method: "paypal",
      accountDetails: "",
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: async (values: WithdrawalFormValues) => {
      const response = await apiRequest('POST', '/api/transactions/withdraw', values);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Withdrawal Requested",
        description: "Your withdrawal has been submitted and is pending approval.",
      });
      onClose();
      queryClient.invalidateQueries({ queryKey: ['/api/writer/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process withdrawal. Please try again.",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (values: WithdrawalFormValues) => {
    withdrawMutation.mutate(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Withdraw Funds</DialogTitle>
          <DialogDescription>
            Request a withdrawal of your earnings to your preferred payment method.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount ($)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min={10} 
                      step={1} 
                      {...field} 
                      onChange={e => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Minimum withdrawal amount is $10
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="paypal">PayPal</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="mpesa">M-Pesa</SelectItem>
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
                      placeholder={form.watch("method") === "paypal" ? "PayPal email address" : 
                                form.watch("method") === "mpesa" ? "Phone number" : 
                                "Bank account details"} 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the details for your selected payment method
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={withdrawMutation.isPending}>
                {withdrawMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Request Withdrawal
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}