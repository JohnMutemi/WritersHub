import React from 'react';
import { DashboardLayout } from '@/components/ui/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { Job } from '@shared/schema';

export default function AdminJobsPage() {
  // Fetch jobs
  const { data: jobs, isLoading } = useQuery<Job[]>({
    queryKey: ['/api/admin/jobs'],
    retry: false
  });

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'in_progress':
        return 'bg-amber-100 text-amber-800 hover:bg-amber-200';
      case 'completed':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const formatDate = (timestamp: Date) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Job Management</h1>
          <Button>Export Jobs</Button>
        </div>

        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle>All Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading jobs...</div>
            ) : jobs?.length === 0 ? (
              <div className="text-center py-8">No jobs found</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Deadline (Days)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs?.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium">{job.id}</TableCell>
                      <TableCell>{job.title}</TableCell>
                      <TableCell>{job.clientId}</TableCell>
                      <TableCell>${job.budget.toFixed(2)}</TableCell>
                      <TableCell>{job.deadline}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(job.status)}>
                          {job.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(job.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">View</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}