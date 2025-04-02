import { useAuth } from "@/hooks/use-auth";
import { DashboardLayout } from "@/components/ui/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { Job } from "@shared/schema";
import { BidModal } from "@/components/bid-modal";
import { JobCard } from "@/components/job-card";
import { Loader2, AlertCircle, CheckCircle, Clock } from "lucide-react";

export default function WriterJobs() {
  const { user } = useAuth();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [bidModalOpen, setBidModalOpen] = useState(false);

  // Mock data for available jobs
  const mockJobs: Job[] = [
    {
      id: 1,
      clientId: 3,
      title: "Technical Writing for Software Documentation",
      description: "We need comprehensive documentation for our new API. The writer should be familiar with REST APIs and have experience documenting technical content for developers.",
      category: "Technical",
      budget: 300,
      deadline: 14,
      pages: 20,
      status: "open",
      createdAt: new Date("2025-03-10")
    },
    {
      id: 2,
      clientId: 2,
      title: "Blog Content for Health and Wellness Website",
      description: "Looking for a writer to create engaging blog content about nutrition, fitness, and mental health. Topics will be provided but writer should be able to research and provide factual information.",
      category: "Blog",
      budget: 200,
      deadline: 7,
      pages: 10,
      status: "open",
      createdAt: new Date("2025-03-15")
    },
    {
      id: 3,
      clientId: 4,
      title: "Product Descriptions for E-commerce Store",
      description: "Need compelling product descriptions for our fashion e-commerce store. The writer should be able to convert features into benefits and write persuasive copy that encourages purchases.",
      category: "E-commerce",
      budget: 250,
      deadline: 10,
      pages: 15,
      status: "open",
      createdAt: new Date("2025-03-18")
    },
    {
      id: 4,
      clientId: 5,
      title: "Academic Research Paper on Environmental Science",
      description: "Need a well-researched paper on climate change impacts on marine ecosystems. The writer should have a background in environmental science or related field and be able to cite credible sources.",
      category: "Academic",
      budget: 400,
      deadline: 21,
      pages: 25,
      status: "open",
      createdAt: new Date("2025-03-20")
    },
    {
      id: 5,
      clientId: 1,
      title: "Social Media Content Calendar",
      description: "Looking for a creative writer to develop a month's worth of social media content for our brand. The content should be engaging, on-brand, and drive user interaction.",
      category: "Social Media",
      budget: 180,
      deadline: 7,
      pages: null,
      status: "open",
      createdAt: new Date("2025-03-22")
    }
  ];

  // Fetch available jobs
  const { data: availableJobs = mockJobs, isLoading: jobsLoading } = useQuery({
    queryKey: ['/api/jobs/available'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/jobs/available');
        return await response.json();
      } catch (error) {
        // Fallback to mock data if API fails
        return mockJobs;
      }
    },
    enabled: !!user
  });

  const handlePlaceBid = (job: Job) => {
    setSelectedJob(job);
    setBidModalOpen(true);
  };

  const handleViewJob = (job: Job) => {
    setSelectedJob(job);
    // In a real app, this would open a job detail view
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Available Jobs</h1>
          <p className="text-muted-foreground">
            Browse and bid on available writing jobs
          </p>
        </div>

        {/* Filter controls could go here */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobsLoading ? (
            <div className="col-span-full flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : availableJobs.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <p className="text-muted-foreground">No available jobs found. Check back later!</p>
            </div>
          ) : (
            availableJobs.map((job: Job) => (
              <JobCard 
                key={job.id} 
                job={job} 
                onBid={handlePlaceBid}
                onView={handleViewJob}
              />
            ))
          )}
        </div>
      </div>

      {/* Bid Modal */}
      <BidModal 
        job={selectedJob} 
        isOpen={bidModalOpen} 
        onClose={() => setBidModalOpen(false)} 
      />
    </DashboardLayout>
  );
}