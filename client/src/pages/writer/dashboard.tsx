import React, { useState } from 'react';
import { DashboardLayout } from '@/components/ui/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FileText, ShoppingCart, ArrowRight, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { WithdrawModal } from '@/components/withdraw-modal';

interface WriterStats {
  balance: number;
  completedOrders: number;
  activeOrders: number;
  pendingBids: number;
}

export default function WriterDashboard() {
  const { user } = useAuth();
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

  // Fetch writer stats
  const { data: stats, isLoading } = useQuery<WriterStats>({
    queryKey: ['/api/stats/writer'],
    retry: false
  });

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Writer Dashboard</h1>
            <p className="text-gray-500 mt-1">Welcome back, {user?.fullName || user?.username}</p>
          </div>
          <div className="mt-4 md:mt-0">
            <Link href="/writer/jobs">
              <Button className="mr-2">
                Find Jobs <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Writer approval status */}
        {user?.role === 'writer' && user.approvalStatus !== 'approved' && (
          <Alert className="mb-6 border-amber-500 text-amber-800 bg-amber-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Account Approval Required</AlertTitle>
            <AlertDescription>
              Your writer account is currently {user.approvalStatus === 'pending' ? 'pending approval' : 'not approved'}.
              {user.approvalStatus === 'pending' 
                ? " An administrator will review your application soon. You'll be able to bid on jobs once approved."
                : " Please contact an administrator for more information."}
            </AlertDescription>
          </Alert>
        )}

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Available Balance</CardDescription>
              <CardTitle className="text-3xl">${user?.balance?.toFixed(2) || '0.00'}</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsWithdrawModalOpen(true)}
                disabled={!user?.balance || user.balance <= 0}
              >
                Withdraw
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Active Orders</CardDescription>
              <CardTitle className="text-3xl">{isLoading ? '...' : stats?.activeOrders || 0}</CardTitle>
            </CardHeader>
            <CardContent>
              <Link href="/writer/orders">
                <Button variant="ghost" size="sm" className="text-primary">
                  View Orders <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Completed Orders</CardDescription>
              <CardTitle className="text-3xl">{isLoading ? '...' : stats?.completedOrders || 0}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                <CheckCircle className="mr-1 h-4 w-4 text-green-500" />
                Successfully delivered
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending Bids</CardDescription>
              <CardTitle className="text-3xl">{isLoading ? '...' : stats?.pendingBids || 0}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="mr-1 h-4 w-4 text-amber-500" />
                Awaiting client response
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Find Jobs</CardTitle>
              <CardDescription>Browse available writing opportunities</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Find new writing opportunities that match your skills and experience. Place bids on jobs you're interested in.
              </p>
              <Link href="/writer/jobs">
                <Button>
                  <FileText className="mr-2 h-4 w-4" /> Browse Jobs
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Manage Orders</CardTitle>
              <CardDescription>Track and complete your current orders</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Track your active orders, submit deliverables, and manage your ongoing projects all in one place.
              </p>
              <Link href="/writer/orders">
                <Button>
                  <ShoppingCart className="mr-2 h-4 w-4" /> View Orders
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Withdraw Modal */}
      <WithdrawModal 
        isOpen={isWithdrawModalOpen} 
        onClose={() => setIsWithdrawModalOpen(false)} 
      />
    </DashboardLayout>
  );
}