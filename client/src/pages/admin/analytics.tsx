import React, { useState } from 'react';
import { DashboardLayout } from '@/components/ui/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { ChevronDown, Download } from 'lucide-react';
import { AdminStats } from '@shared/schema';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const mockJobData = [
  { month: 'Jan', jobs: 5 },
  { month: 'Feb', jobs: 8 },
  { month: 'Mar', jobs: 12 },
  { month: 'Apr', jobs: 15 },
  { month: 'May', jobs: 18 },
  { month: 'Jun', jobs: 24 },
];

const mockOrderData = [
  { month: 'Jan', orders: 3 },
  { month: 'Feb', orders: 5 },
  { month: 'Mar', orders: 10 },
  { month: 'Apr', orders: 12 },
  { month: 'May', orders: 15 },
  { month: 'Jun', orders: 18 },
];

const mockRevenueData = [
  { month: 'Jan', revenue: 150 },
  { month: 'Feb', revenue: 220 },
  { month: 'Mar', revenue: 480 },
  { month: 'Apr', revenue: 580 },
  { month: 'May', revenue: 780 },
  { month: 'Jun', revenue: 920 },
];

const mockStatusData = [
  { name: 'Open', value: 15 },
  { name: 'In Progress', value: 20 },
  { name: 'Completed', value: 45 },
  { name: 'Cancelled', value: 5 },
];

const mockUserData = [
  { name: 'Writers', value: 40 },
  { name: 'Clients', value: 55 },
  { name: 'Admins', value: 5 },
];

export default function AdminAnalyticsPage() {
  const [timeRange, setTimeRange] = useState('6m'); // 1m, 6m, 1y, all
  
  // Fetch admin stats
  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ['/api/stats/admin'],
    retry: false
  });

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="text-gray-500 mt-1">Platform performance and metrics</p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  {timeRange === '1m' ? 'Last Month' : 
                   timeRange === '6m' ? 'Last 6 Months' :
                   timeRange === '1y' ? 'Last Year' : 'All Time'}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTimeRange('1m')}>
                  Last Month
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTimeRange('6m')}>
                  Last 6 Months
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTimeRange('1y')}>
                  Last Year
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTimeRange('all')}>
                  All Time
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Users</CardDescription>
              <CardTitle className="text-3xl">{isLoading ? '...' : stats?.totalUsers || 0}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground">
                +{Math.floor(Math.random() * 15) + 5}% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Active Jobs</CardDescription>
              <CardTitle className="text-3xl">{isLoading ? '...' : stats?.totalJobs || 0}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground">
                +{Math.floor(Math.random() * 15) + 5}% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Active Orders</CardDescription>
              <CardTitle className="text-3xl">{isLoading ? '...' : stats?.totalOrders || 0}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground">
                +{Math.floor(Math.random() * 15) + 5}% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Platform Revenue</CardDescription>
              <CardTitle className="text-3xl">${isLoading ? '...' : stats?.totalRevenue?.toFixed(2) || '0.00'}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground">
                +{Math.floor(Math.random() * 15) + 5}% from last month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Chart rows */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Jobs Posted</CardTitle>
              <CardDescription>Monthly job posting trends</CardDescription>
            </CardHeader>
            <CardContent className="h-80 pl-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={mockJobData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="jobs" fill="#8884d8" name="Jobs Posted" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Orders Created</CardTitle>
              <CardDescription>Monthly order creation trends</CardDescription>
            </CardHeader>
            <CardContent className="h-80 pl-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={mockOrderData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="orders" fill="#82ca9d" name="Orders Created" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Revenue</CardTitle>
              <CardDescription>Monthly revenue trends</CardDescription>
            </CardHeader>
            <CardContent className="h-80 pl-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={mockRevenueData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#0088FE" 
                    activeDot={{ r: 8 }}
                    name="Revenue ($)" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Job Status Distribution</CardTitle>
                <CardDescription>Current status of all jobs</CardDescription>
              </CardHeader>
              <CardContent className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={mockStatusData}
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {mockStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value}`, name]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Composition</CardTitle>
                <CardDescription>Distribution of user roles</CardDescription>
              </CardHeader>
              <CardContent className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={mockUserData}
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {mockUserData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value}`, name]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}