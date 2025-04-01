import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Validation schema for withdrawal
const withdrawalSchema = z.object({
  amount: z.number().min(1, "Amount must be at least $1"),
  paymentMethod: z.enum(["paypal", "mpesa", "bank_transfer"], {
    required_error: "Please select a payment method",
  }),
  paymentDetails: z.record(z.string()),
});

type WithdrawalFormValues = z.infer<typeof withdrawalSchema>;

export function WithdrawModal({ isOpen, onClose }: WithdrawModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedMethod, setSelectedMethod] = useState<string>("paypal");
  
  const form = useForm<WithdrawalFormValues>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      amount: 0,
      paymentMethod: "paypal",
      paymentDetails: {},
    },
  });
  
  const withdrawMutation = useMutation({
    mutationFn: async (values: WithdrawalFormValues) => {
      let paymentDetails: Record<string, string> = {};
      
      // Build payment details based on method
      if (values.paymentMethod === "paypal") {
        paymentDetails = {
          email: form.getValues("paymentDetails.email") || "",
        };
      } else if (values.paymentMethod === "mpesa") {
        paymentDetails = {
          phoneNumber: form.getValues("paymentDetails.phoneNumber") || "",
        };
      } else if (values.paymentMethod === "bank_transfer") {
        paymentDetails = {
          accountName: form.getValues("paymentDetails.accountName") || "",
          accountNumber: form.getValues("paymentDetails.accountNumber") || "",
          bankName: form.getValues("paymentDetails.bankName") || "",
        };
      }
      
      const data = {
        amount: values.amount,
        paymentMethod: values.paymentMethod,
        paymentDetails,
      };
      
      const response = await apiRequest("POST", "/api/withdrawals", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Withdrawal request submitted",
        description: "Your withdrawal request has been submitted and is being processed",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to submit withdrawal",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePaymentMethodChange = (value: string) => {
    setSelectedMethod(value);
    form.setValue("paymentMethod", value as any);
  };

  const onSubmit = (values: WithdrawalFormValues) => {
    if (!user) return;
    
    // Check if amount is greater than available balance
    if (values.amount > user.balance) {
      toast({
        title: "Insufficient balance",
        description: `You can only withdraw up to $${user.balance.toFixed(2)}`,
        variant: "destructive",
      });
      return;
    }
    
    withdrawMutation.mutate(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Withdraw Funds</DialogTitle>
          <DialogDescription>
            Available balance: <span className="font-medium">${user?.balance.toFixed(2)}</span>
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount to Withdraw ($)</FormLabel>
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
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <Select
                    onValueChange={handlePaymentMethodChange}
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
            
            {/* PayPal Fields */}
            {selectedMethod === "paypal" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="paypal-email">PayPal Email</Label>
                  <Input
                    id="paypal-email"
                    type="email"
                    placeholder="Enter PayPal email"
                    {...form.register("paymentDetails.email")}
                  />
                </div>
              </div>
            )}
            
            {/* M-Pesa Fields */}
            {selectedMethod === "mpesa" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone-number">Phone Number</Label>
                  <Input
                    id="phone-number"
                    type="text"
                    placeholder="Enter phone number"
                    {...form.register("paymentDetails.phoneNumber")}
                  />
                </div>
              </div>
            )}
            
            {/* Bank Transfer Fields */}
            {selectedMethod === "bank_transfer" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="account-name">Account Name</Label>
                  <Input
                    id="account-name"
                    type="text"
                    placeholder="Enter account name"
                    {...form.register("paymentDetails.accountName")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account-number">Account Number</Label>
                  <Input
                    id="account-number"
                    type="text"
                    placeholder="Enter account number"
                    {...form.register("paymentDetails.accountNumber")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank-name">Bank Name</Label>
                  <Input
                    id="bank-name"
                    type="text"
                    placeholder="Enter bank name"
                    {...form.register("paymentDetails.bankName")}
                  />
                </div>
              </div>
            )}
            
            <DialogFooter className="sm:justify-between">
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
              >
                {withdrawMutation.isPending ? "Processing..." : "Withdraw"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
