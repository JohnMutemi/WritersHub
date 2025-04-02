import React, { useState } from 'react';
import { DashboardLayout } from '@/components/ui/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { JobCard } from '@/components/job-card';
import { BidModal } from '@/components/bid-modal';
import { useQuery } from '@tanstack/react-query';
import { Job } from '@shared/schema';
import { useAuth } from '@/hooks/use-auth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Search, ArrowDownAZ, Banknote } from 'lucide-react';

export default function WriterJobs() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'deadline' | 'budget'>('deadline');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isBidModalOpen, setIsBidModalOpen] = useState(false);

  // Fetch jobs
  const { data: jobs, isLoading } = useQuery<Job[]>({
    queryKey: ['/api/jobs'],
    retry: false
  });

  // Filter and sort jobs
  const filteredJobs = React.useMemo(() => {
    if (!jobs) return [];
    
    // Only show open jobs
    let filtered = jobs.filter(job => job.status === 'open');
    
    // Apply search filter
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(
        job => 
          job.title.toLowerCase().includes(lowerSearchTerm) ||
          job.description.toLowerCase().includes(lowerSearchTerm)
      );
    }
    
    // Apply sorting
    return [...filtered].sort((a, b) => {
      if (sortBy === 'deadline') {
        return a.deadline - b.deadline;
      } else {
        return b.budget - a.budget;
      }
    });
  }, [jobs, searchTerm, sortBy]);

  const handleBidClick = (job: Job) => {
    setSelectedJob(job);
    setIsBidModalOpen(true);
  };
  
  const handleJobView = (job: Job) => {
    // In a real app, this would navigate to a job detail page
    setSelectedJob(job);
    setIsBidModalOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Available Jobs</h1>
            <p className="text-gray-500 mt-1">Find and bid on writing opportunities</p>
          </div>
        </div>

        {/* Writer approval status */}
        {user?.role === 'writer' && user.approvalStatus !== 'approved' && (
          <Alert className="mb-6 border-amber-500 text-amber-800 bg-amber-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Account Approval Required</AlertTitle>
            <AlertDescription>
              Your writer account is currently {user.approvalStatus === 'pending' ? 'pending approval' : 'not approved'}.
              You can browse jobs, but you'll need approval before placing bids.
            </AlertDescription>
          </Alert>
        )}

        {/* Search and filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search jobs..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={sortBy === 'deadline' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy('deadline')}
                >
                  <ArrowDownAZ className="mr-1 h-4 w-4" /> Deadline
                </Button>
                <Button
                  variant={sortBy === 'budget' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy('budget')}
                >
                  <Banknote className="mr-1 h-4 w-4" /> Budget
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Jobs list */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="spinner-border inline-block h-8 w-8 border-4 rounded-full text-primary" role="status">
                <span className="visually-hidden">Loading jobs...</span>
              </div>
              <p className="mt-2 text-muted-foreground">Loading available jobs...</p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No jobs found matching your criteria.</p>
                {searchTerm && (
                  <Button 
                    variant="outline" 
                    className="mt-2" 
                    onClick={() => setSearchTerm('')}
                  >
                    Clear Search
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredJobs.map(job => (
              <JobCard 
                key={job.id} 
                job={job} 
                onBid={handleBidClick} 
                onView={handleJobView} 
              />
            ))
          )}
        </div>
      </div>

      {/* Bid modal */}
      <BidModal 
        job={selectedJob} 
        isOpen={isBidModalOpen} 
        onClose={() => setIsBidModalOpen(false)} 
      />
    </DashboardLayout>
  );
}