import React, { useState } from "react";
import { DashboardLayout } from "@/components/ui/dashboard-layout";
import { JobCard } from "@/components/job-card";
import { BidModal } from "@/components/bid-modal";
import { useQuery } from "@tanstack/react-query";
import { Job } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";

export default function WriterAvailableJobs() {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isBidModalOpen, setIsBidModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [jobCategory, setJobCategory] = useState("All Categories");

  // Fetch jobs
  const { data: jobs, isLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
    select: (data) => {
      let filteredJobs = data.filter((job) => job.status === "open");
      
      // Filter by category if not "All Categories"
      if (jobCategory !== "All Categories") {
        filteredJobs = filteredJobs.filter((job) => job.category === jobCategory);
      }
      
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredJobs = filteredJobs.filter(
          (job) => 
            job.title.toLowerCase().includes(query) || 
            job.description.toLowerCase().includes(query)
        );
      }
      
      return filteredJobs;
    },
  });

  const openBidModal = (job: Job) => {
    setSelectedJob(job);
    setIsBidModalOpen(true);
  };

  const closeBidModal = () => {
    setIsBidModalOpen(false);
    setSelectedJob(null);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <DashboardLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">Available Jobs</h1>
          
          {/* Filter and search controls */}
          <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative w-full sm:w-64">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="Search jobs..."
                className="pl-10"
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
            
            <Select
              value={jobCategory}
              onValueChange={setJobCategory}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Categories">All Categories</SelectItem>
                <SelectItem value="Academic">Academic</SelectItem>
                <SelectItem value="Business">Business</SelectItem>
                <SelectItem value="Technical">Technical</SelectItem>
                <SelectItem value="Creative">Creative</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Job listings */}
          <div className="mt-6">
            {isLoading ? (
              <div className="grid gap-5 grid-cols-1 lg:grid-cols-2">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="bg-white overflow-hidden shadow rounded-lg p-6 animate-pulse">
                    <div className="flex justify-between mb-4">
                      <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-5 bg-gray-200 rounded w-1/6"></div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-8"></div>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded"></div>
                    </div>
                    <div className="flex">
                      <div className="h-8 bg-gray-200 rounded w-24"></div>
                      <div className="h-8 bg-gray-200 rounded w-24 ml-3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : jobs && jobs.length > 0 ? (
              <div className="grid gap-5 grid-cols-1 lg:grid-cols-2">
                {jobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onBid={openBidModal}
                    onView={() => openBidModal(job)}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white overflow-hidden shadow rounded-lg p-8 text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery || jobCategory !== "All Categories"
                    ? "Try changing your search criteria or category filter"
                    : "There are no available jobs at the moment. Please check back later."}
                </p>
                {(searchQuery || jobCategory !== "All Categories") && (
                  <div className="flex justify-center gap-4">
                    {searchQuery && (
                      <Button variant="outline" onClick={() => setSearchQuery("")}>
                        Clear Search
                      </Button>
                    )}
                    {jobCategory !== "All Categories" && (
                      <Button variant="outline" onClick={() => setJobCategory("All Categories")}>
                        Show All Categories
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <BidModal
        job={selectedJob}
        isOpen={isBidModalOpen}
        onClose={closeBidModal}
      />
    </DashboardLayout>
  );
}
