import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Form schema for withdrawal
const withdrawalSchema = z.object({
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => !isNaN(Number(val)), "Amount must be a number")
    .refine((val) => Number(val) > 0, "Amount must be greater than 0"),
  paymentMethod: z.enum(["paypal", "mpesa", "bank_transfer"], {
    required_error: "Please select a payment method",
  }),
  paymentDetails: z
    .string()
    .min(5, "Payment details are required"),
});

type WithdrawalFormValues = z.infer<typeof withdrawalSchema>;

export function WithdrawModal({ isOpen, onClose }: WithdrawModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  // Initialize react-hook-form
  const form = useForm<WithdrawalFormValues>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      amount: "",
      paymentMethod: "paypal",
      paymentDetails: "",
    },
  });

  // Withdrawal submission mutation
  const withdrawMutation = useMutation({
    mutationFn: async (values: WithdrawalFormValues) => {
      if (!user) throw new Error("User information is missing");
      
      const withdrawalData = {
        userId: user.id,
        amount: Number(values.amount),
        type: "withdrawal",
        status: "pending",
        paymentMethod: values.paymentMethod,
        paymentDetails: values.paymentDetails,
      };
      
      const response = await apiRequest("POST", "/api/transactions/withdraw", withdrawalData);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Withdrawal Requested",
        description: "Your withdrawal request has been submitted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      form.reset();
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Withdrawal Failed",
        description: error.message || "There was an error processing your withdrawal request.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: WithdrawalFormValues) => {
    // Check if withdrawal amount is greater than available balance
    if (user && Number(values.amount) > user.balance) {
      toast({
        title: "Insufficient Balance",
        description: "Your withdrawal amount exceeds your available balance.",
        variant: "destructive",
      });
      return;
    }
    
    withdrawMutation.mutate(values);
  };

  const getPaymentDetailsPlaceholder = (method: string) => {
    switch (method) {
      case "paypal":
        return "Enter your PayPal email address";
      case "mpesa":
        return "Enter your M-Pesa phone number";
      case "bank_transfer":
        return "Enter your bank account details (Bank name, Account number, Account name)";
      default:
        return "Enter payment details";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Withdraw Funds</DialogTitle>
          <DialogDescription>
            Request a withdrawal of your available balance.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount ($)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormDescription>
                    Available balance: ${user?.balance || 0}
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
              name="paymentDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Details</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={getPaymentDetailsPlaceholder(form.watch("paymentMethod"))} 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the details for your selected payment method.
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
                disabled={withdrawMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={withdrawMutation.isPending}
                className={withdrawMutation.isPending ? "opacity-70" : ""}
              >
                {withdrawMutation.isPending ? "Processing..." : "Withdraw Funds"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}