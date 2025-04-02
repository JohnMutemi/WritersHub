import React from 'react';
import { DashboardLayout } from '@/components/ui/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { AdminStats } from '@shared/schema';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function AdminAnalyticsPage() {
  // Fetch admin statistics
  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ['/api/admin/stats'],
    retry: false
  });

  // Mock data for charts (in a real app, this would come from the API)
  const monthlyRevenue = [
    { name: 'Jan', revenue: 4000 },
    { name: 'Feb', revenue: 3000 },
    { name: 'Mar', revenue: 5000 },
    { name: 'Apr', revenue: 4500 },
    { name: 'May', revenue: 6000 },
    { name: 'Jun', revenue: 8000 },
  ];

  const platformStats = [
    { name: 'Users', count: stats?.totalUsers || 0 },
    { name: 'Jobs', count: stats?.totalJobs || 0 },
    { name: 'Orders', count: stats?.totalOrders || 0 },
  ];

  const jobStatusData = [
    { name: 'Open', value: 40 },
    { name: 'In Progress', value: 30 },
    { name: 'Completed', value: 25 },
    { name: 'Cancelled', value: 5 },
  ];

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-gray-500 mt-1">Platform performance metrics and insights</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Overview</CardTitle>
              <CardDescription>Monthly revenue trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {isLoading ? (
                  <div className="h-full flex items-center justify-center">Loading...</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyRevenue}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip
                        formatter={(value) => [`$${value}`, 'Revenue']}
                        labelFormatter={(label) => `Month: ${label}`}
                      />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#8884d8"
                        activeDot={{ r: 8 }}
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Platform Statistics</CardTitle>
              <CardDescription>Key metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {isLoading ? (
                  <div className="h-full flex items-center justify-center">Loading...</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={platformStats}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Job Status Distribution</CardTitle>
              <CardDescription>Current job status overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {isLoading ? (
                  <div className="h-full flex items-center justify-center">Loading...</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={jobStatusData} layout="vertical"
                      margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" />
                      <Tooltip />
                      <Bar dataKey="value" fill="#82ca9d" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}