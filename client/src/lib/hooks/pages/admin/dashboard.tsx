import React, { useState } from 'react';
import { DashboardLayout } from '@/components/ui/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { AdminStats } from '@shared/schema';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { BadgePlus, BarChart3, Users, FileText, ClipboardCheck, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function AdminDashboard() {
  const { user } = useAuth();
  
  // Fetch admin stats
  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ['/api/stats/admin'],
    retry: false
  });

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.fullName || user?.username}
          </p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? '...' : stats?.totalUsers || 0}</div>
              <p className="text-xs text-muted-foreground">Platform members</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${isLoading ? '...' : stats?.totalRevenue?.toFixed(2) || '0.00'}
              </div>
              <p className="text-xs text-muted-foreground">Platform earnings</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? '...' : stats?.totalJobs || 0}</div>
              <p className="text-xs text-muted-foreground">Open job postings</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
              <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? '...' : stats?.totalOrders || 0}</div>
              <p className="text-xs text-muted-foreground">In-progress work</p>
            </CardContent>
          </Card>
        </div>

        {/* Action cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Pending writers card */}
          <Card className="hover:shadow-md transition-all">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Pending Writers</CardTitle>
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </div>
              <CardDescription>Writers awaiting approval</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-amber-500 border-amber-500">
                    {isLoading ? '...' : stats?.pendingWriters || 0} waiting
                  </Badge>
                </div>
                <Link href="/admin/users">
                  <Button variant="secondary" size="sm">
                    Manage
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* User management card */}
          <Card className="hover:shadow-md transition-all">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">User Management</CardTitle>
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <CardDescription>Manage platform users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-4">
                  View and manage all users, approve or reject writers, and monitor user activity.
                </p>
                <Link href="/admin/users">
                  <div className="text-primary font-medium hover:underline cursor-pointer">
                    Manage users →
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Jobs management card */}
          <Card className="hover:shadow-md transition-all">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Job Management</CardTitle>
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
              <CardDescription>Monitor platform jobs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-4">
                  View all jobs on the platform, monitor status, and manage issues with job listings.
                </p>
                <Link href="/admin/jobs">
                  <div className="text-primary font-medium hover:underline cursor-pointer">
                    Manage jobs →
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Orders management card */}
          <Card className="hover:shadow-md transition-all">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Order Management</CardTitle>
                <ClipboardCheck className="h-5 w-5 text-muted-foreground" />
              </div>
              <CardDescription>Track active orders</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-4">
                  Monitor all orders, handle disputes, track progress, and ensure on-time delivery.
                </p>
                <Link href="/admin/orders">
                  <div className="text-primary font-medium hover:underline cursor-pointer">
                    Manage orders →
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Analytics card */}
          <Card className="hover:shadow-md transition-all">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Platform Analytics</CardTitle>
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
              </div>
              <CardDescription>View detailed platform statistics and trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-4">
                  Access comprehensive metrics about platform performance, user activity, and financial data.
                </p>
                <Link href="/admin/analytics">
                  <div className="text-primary font-medium hover:underline cursor-pointer">
                    View detailed analytics →
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}