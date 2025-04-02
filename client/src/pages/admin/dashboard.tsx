import React from 'react';
import { DashboardLayout } from '@/components/ui/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { AdminStats } from '@shared/schema';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { 
  Users, 
  FileText, 
  ShoppingCart, 
  DollarSign,
  UserCheck
} from 'lucide-react';

export default function AdminDashboard() {
  // Fetch admin statistics
  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ['/api/admin/stats'],
    retry: false
  });

  // Use these values for the cards
  const totalUsers = stats?.totalUsers || 0;
  const totalJobs = stats?.totalJobs || 0;
  const totalOrders = stats?.totalOrders || 0;
  const totalRevenue = stats?.totalRevenue || 0;
  const pendingWriters = stats?.pendingWriters || 0;

  // Colors for the pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  // Sample data for pie chart (real data would come from API)
  const data = [
    { name: 'Writer', value: 40 },
    { name: 'Client', value: 50 },
    { name: 'Admin', value: 10 },
  ];

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">Overview of platform metrics and activities</p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Users</CardDescription>
              <CardTitle className="text-3xl">{totalUsers}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground flex items-center">
                <Users className="h-4 w-4 mr-1" />
                <span className="text-sm">All registered users</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Jobs</CardDescription>
              <CardTitle className="text-3xl">{totalJobs}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground flex items-center">
                <FileText className="h-4 w-4 mr-1" />
                <span className="text-sm">Jobs posted</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Orders</CardDescription>
              <CardTitle className="text-3xl">{totalOrders}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground flex items-center">
                <ShoppingCart className="h-4 w-4 mr-1" />
                <span className="text-sm">Orders placed</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Revenue</CardDescription>
              <CardTitle className="text-3xl">${totalRevenue.toFixed(2)}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground flex items-center">
                <DollarSign className="h-4 w-4 mr-1" />
                <span className="text-sm">Total earnings</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending Writers</CardDescription>
              <CardTitle className="text-3xl">{pendingWriters}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground flex items-center">
                <UserCheck className="h-4 w-4 mr-1" />
                <span className="text-sm">Awaiting approval</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>User Distribution</CardTitle>
              <CardDescription>Breakdown of user roles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {isLoading ? (
                  <div className="h-full flex items-center justify-center">Loading...</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {data.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Platform Activity</CardTitle>
              <CardDescription>Jobs and orders comparison</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {isLoading ? (
                  <div className="h-full flex items-center justify-center">Loading...</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: 'Jobs', count: totalJobs },
                        { name: 'Orders', count: totalOrders },
                        { name: 'Active Users', count: totalUsers },
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8884d8" radius={[4, 4, 0, 0]} />
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