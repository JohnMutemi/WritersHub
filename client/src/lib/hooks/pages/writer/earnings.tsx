import React, { useState } from "react";
import { DashboardLayout } from "@/components/ui/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WithdrawModal } from "@/components/withdraw-modal";
import { useQuery } from "@tanstack/react-query";
import { Transaction } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { Loader2, DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight, Calendar, CreditCard } from "lucide-react";

export default function WriterEarnings() {
  const { user } = useAuth();
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [timeFilter, setTimeFilter] = useState("all");
  const [transactionType, setTransactionType] = useState("all");

  // Fetch transactions
  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Filter transactions based on selected filters
  const filteredTransactions = transactions?.filter(transaction => {
    // Time filter
    if (timeFilter !== "all") {
      const today = new Date();
      const transactionDate = new Date(transaction.createdAt);
      
      if (timeFilter === "this-month") {
        return (
          transactionDate.getMonth() === today.getMonth() &&
          transactionDate.getFullYear() === today.getFullYear()
        );
      } else if (timeFilter === "last-month") {
        const lastMonth = new Date(today);
        lastMonth.setMonth(today.getMonth() - 1);
        return (
          transactionDate.getMonth() === lastMonth.getMonth() &&
          transactionDate.getFullYear() === lastMonth.getFullYear()
        );
      } else if (timeFilter === "this-year") {
        return transactionDate.getFullYear() === today.getFullYear();
      }
    }
    
    // Transaction type filter
    if (transactionType !== "all") {
      return transaction.type === transactionType;
    }
    
    return true;
  });

  // Calculate earnings metrics
  const calculateMetrics = () => {
    if (!filteredTransactions) return { total: 0, payments: 0, withdrawals: 0 };
    
    let total = 0;
    let payments = 0;
    let withdrawals = 0;
    
    filteredTransactions.forEach(transaction => {
      if (transaction.type === "payment") {
        total += transaction.amount;
        payments += transaction.amount;
      } else if (transaction.type === "withdrawal") {
        total -= Math.abs(transaction.amount);
        withdrawals += Math.abs(transaction.amount);
      }
    });
    
    return { total, payments, withdrawals };
  };

  const { total, payments, withdrawals } = calculateMetrics();

  const getPaymentMethodIcon = (method: string | null) => {
    switch (method) {
      case "paypal":
        return "PayPal";
      case "mpesa":
        return "M-Pesa";
      case "bank_transfer":
        return "Bank";
      default:
        return "System";
    }
  };

  return (
    <DashboardLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl font-semibold text-gray-900">Earnings</h1>
            <Button
              onClick={() => setIsWithdrawModalOpen(true)}
              className="mt-4 sm:mt-0"
            >
              <DollarSign className="mr-2 h-4 w-4" />
              Withdraw Funds
            </Button>
          </div>
          
          {/* Stats Cards */}
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Available Balance
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(user?.balance || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  Available for withdrawal
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Earnings
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(payments)}</div>
                <p className="text-xs text-muted-foreground">
                  {timeFilter === "all" 
                    ? "All time earnings" 
                    : timeFilter === "this-month" 
                      ? "This month"
                      : timeFilter === "last-month"
                        ? "Last month"
                        : "This year"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Withdrawals
                </CardTitle>
                <ArrowDownRight className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(withdrawals)}</div>
                <p className="text-xs text-muted-foreground">
                  {timeFilter === "all" 
                    ? "All time withdrawals" 
                    : timeFilter === "this-month" 
                      ? "This month"
                      : timeFilter === "last-month"
                        ? "Last month"
                        : "This year"}
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Transactions */}
          <div className="mt-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4 sm:mb-0">Transaction History</h2>
              <div className="flex flex-col sm:flex-row gap-4">
                <Select 
                  value={timeFilter} 
                  onValueChange={setTimeFilter}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Time Period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="this-month">This Month</SelectItem>
                    <SelectItem value="last-month">Last Month</SelectItem>
                    <SelectItem value="this-year">This Year</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select 
                  value={transactionType} 
                  onValueChange={setTransactionType}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Transaction Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="payment">Payments</SelectItem>
                    <SelectItem value="withdrawal">Withdrawals</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {isLoading ? (
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="animate-pulse p-6">
                  <div className="space-y-6">
                    {[1, 2, 3, 4].map(item => (
                      <div key={item} className="flex justify-between">
                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : filteredTransactions && filteredTransactions.length > 0 ? (
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Method
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTransactions.map(transaction => (
                      <tr key={transaction.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                            {format(new Date(transaction.createdAt), "MMM d, yyyy")}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {transaction.type === "payment" 
                            ? "Order Payment" 
                            : transaction.type === "withdrawal"
                              ? "Withdrawal"
                              : transaction.type}
                          {transaction.orderId && ` #${transaction.orderId}`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <CreditCard className="h-4 w-4 text-gray-400 mr-2" />
                            {getPaymentMethodIcon(transaction.paymentMethod)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            transaction.status === "completed" 
                              ? "bg-green-100 text-green-800" 
                              : transaction.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }`}>
                            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                          <span className={transaction.type === "payment" ? "text-green-600" : "text-red-600"}>
                            {transaction.type === "payment" ? "+" : "-"}
                            {formatCurrency(Math.abs(transaction.amount))}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-white overflow-hidden shadow rounded-lg p-8 text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
                <p className="text-gray-500 mb-4">
                  {transactionType === "all" 
                    ? "You don't have any transactions yet." 
                    : `You don't have any ${transactionType} transactions.`}
                </p>
                {(timeFilter !== "all" || transactionType !== "all") && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setTimeFilter("all");
                      setTransactionType("all");
                    }}
                  >
                    Reset Filters
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <WithdrawModal 
        isOpen={isWithdrawModalOpen} 
        onClose={() => setIsWithdrawModalOpen(false)} 
      />
    </DashboardLayout>
  );
}
