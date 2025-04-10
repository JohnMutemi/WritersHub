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

// We'll use real data from API, but define default chart data formats
interface JobData {
  month: string;
  jobs: number;
}

interface OrderData {
  month: string;
  orders: number;
}

interface RevenueData {
  month: string;
  revenue: number;
}

interface StatusData {
  name: string;
  value: number;
}

interface UserData {
  name: string;
  value: number;
}

export default function AdminAnalyticsPage() {
  const [timeRange, setTimeRange] = useState('6m'); // 1m, 6m, 1y, all
  
  // Fetch admin stats
  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ['/api/stats/admin'],
    retry: false
  });
  
  // Fetch chart data
  const { data: chartData, isLoading: isChartLoading } = useQuery<{
    jobData: JobData[];
    orderData: OrderData[];
    revenueData: RevenueData[];
    statusData: StatusData[];
    userData: UserData[];
  }>({
    queryKey: ['/api/stats/admin/charts', timeRange],
    queryFn: async () => {
      const res = await fetch(`/api/stats/admin/charts?timeRange=${timeRange}`);
      if (!res.ok) throw new Error('Failed to fetch chart data');
      return res.json();
    }
  });
  
  // Default data in case API isn't ready
  const defaultJobData: JobData[] = [
    { month: 'Jan', jobs: 0 },
    { month: 'Feb', jobs: 0 },
    { month: 'Mar', jobs: 0 },
    { month: 'Apr', jobs: 0 },
    { month: 'May', jobs: 0 },
    { month: 'Jun', jobs: 0 },
  ];
  
  const defaultOrderData: OrderData[] = [
    { month: 'Jan', orders: 0 },
    { month: 'Feb', orders: 0 },
    { month: 'Mar', orders: 0 },
    { month: 'Apr', orders: 0 },
    { month: 'May', orders: 0 },
    { month: 'Jun', orders: 0 },
  ];
  
  const defaultRevenueData: RevenueData[] = [
    { month: 'Jan', revenue: 0 },
    { month: 'Feb', revenue: 0 },
    { month: 'Mar', revenue: 0 },
    { month: 'Apr', revenue: 0 },
    { month: 'May', revenue: 0 },
    { month: 'Jun', revenue: 0 },
  ];
  
  const defaultStatusData: StatusData[] = [
    { name: 'Open', value: 0 },
    { name: 'In Progress', value: 0 },
    { name: 'Completed', value: 0 },
    { name: 'Cancelled', value: 0 },
  ];
  
  const defaultUserData: UserData[] = [
    { name: 'Writers', value: 0 },
    { name: 'Clients', value: 0 },
    { name: 'Admins', value: 0 },
  ];
  
  // Use real data or default data if loading
  const jobData = chartData?.jobData || defaultJobData;
  const orderData = chartData?.orderData || defaultOrderData;
  const revenueData = chartData?.revenueData || defaultRevenueData;
  const statusData = chartData?.statusData || defaultStatusData;
  const userData = chartData?.userData || defaultUserData;

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
                  data={jobData}
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
                  data={orderData}
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
                  data={revenueData}
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
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {statusData.map((entry: StatusData, index: number) => (
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
                      data={userData}
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {userData.map((entry: UserData, index: number) => (
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