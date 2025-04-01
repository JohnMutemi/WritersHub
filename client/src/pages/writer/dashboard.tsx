import React, { useState } from "react";
import { DashboardLayout } from "@/components/ui/dashboard-layout";
import { StatCard } from "@/components/ui/stat-card";
import { OrderItem } from "@/components/order-item";
import { JobCard } from "@/components/job-card";
import { WithdrawModal } from "@/components/withdraw-modal";
import { BidModal } from "@/components/bid-modal";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Job, Order, Bid } from "@shared/schema";
import { Link } from "wouter";
import { Loader2, Wallet, CheckCircle, BookOpen, ClipboardList, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function WriterDashboard() {
  const { user } = useAuth();
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isBidModalOpen, setIsBidModalOpen] = useState(false);
  const [jobCategory, setJobCategory] = useState("All Categories");

  const { data: writerStats, isLoading: isStatsLoading } = useQuery({
    queryKey: ["/api/stats/writer"],
  });

  const { data: activeOrders, isLoading: isOrdersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    select: (data) => data.filter((order) => order.status === "in_progress").slice(0, 5),
  });

  const { data: jobs, isLoading: isJobsLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
    select: (data) => {
      let filteredJobs = data.filter((job) => job.status === "open");
      
      if (jobCategory !== "All Categories") {
        filteredJobs = filteredJobs.filter((job) => job.category === jobCategory);
      }
      
      return filteredJobs.slice(0, 4);
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

  return (
    <DashboardLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">Writer Dashboard</h1>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          {/* Stats overview */}
          {isStatsLoading ? (
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="bg-white overflow-hidden shadow rounded-lg p-5 animate-pulse">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-gray-200 rounded-md p-3 h-12 w-12"></div>
                    <div className="ml-5 w-0 flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Available Balance"
                value={`$${user?.balance.toFixed(2)}`}
                icon={<Wallet />}
                iconBgColor="bg-primary-100"
                iconColor="text-primary-600"
                actionText="Withdraw funds"
                onClick={() => setIsWithdrawModalOpen(true)}
              />
              
              <StatCard
                title="Completed Orders"
                value={writerStats?.completedOrders || 0}
                icon={<CheckCircle />}
                iconBgColor="bg-green-100"
                iconColor="text-green-600"
                actionText="View history"
                actionHref="/writer/order-history"
              />
              
              <StatCard
                title="Active Orders"
                value={writerStats?.activeOrders || 0}
                icon={<BookOpen />}
                iconBgColor="bg-blue-100"
                iconColor="text-blue-600"
                actionText="Manage orders"
                actionHref="/writer/active-orders"
              />
              
              <StatCard
                title="Pending Bids"
                value={writerStats?.pendingBids || 0}
                icon={<ClipboardList />}
                iconBgColor="bg-yellow-100"
                iconColor="text-yellow-600"
                actionText="View all bids"
                actionHref="/writer/pending-bids"
              />
            </div>
          )}
          
          {/* Active Orders section */}
          <div className="mt-8">
            <h2 className="text-lg leading-6 font-medium text-gray-900">Active Orders</h2>
            <div className="mt-4 bg-white shadow overflow-hidden sm:rounded-md">
              {isOrdersLoading ? (
                <div className="animate-pulse p-6">
                  <div className="space-y-6">
                    {[1, 2].map((item) => (
                      <div key={item} className="flex justify-between">
                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : activeOrders && activeOrders.length > 0 ? (
                <ul role="list" className="divide-y divide-gray-200">
                  {activeOrders.map((order) => (
                    <OrderItem
                      key={order.id}
                      order={order}
                      onViewDetails={() => {}}
                      onDeliver={() => {}}
                    />
                  ))}
                </ul>
              ) : (
                <div className="p-6 text-center">
                  <p className="text-gray-500">No active orders at the moment.</p>
                  <Link href="/writer/available-jobs">
                    <a className="mt-2 inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-500">
                      Browse available jobs <ChevronRight className="ml-1 h-4 w-4" />
                    </a>
                  </Link>
                </div>
              )}
            </div>
          </div>
          
          {/* Available Jobs section */}
          <div className="mt-8">
            <div className="flex items-center justify-between">
              <h2 className="text-lg leading-6 font-medium text-gray-900">Available Jobs</h2>
              <div className="flex">
                <Select
                  value={jobCategory}
                  onValueChange={setJobCategory}
                >
                  <SelectTrigger className="w-[180px]">
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
            </div>
            
            {isJobsLoading ? (
              <div className="mt-4 grid gap-5 grid-cols-1 lg:grid-cols-2">
                {[1, 2].map((item) => (
                  <div key={item} className="bg-white overflow-hidden shadow rounded-lg p-6 animate-pulse">
                    <div className="flex justify-between mb-4">
                      <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-5 bg-gray-200 rounded w-1/6"></div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : jobs && jobs.length > 0 ? (
              <div className="mt-4 grid gap-5 grid-cols-1 lg:grid-cols-2">
                {jobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onBid={openBidModal}
                    onView={() => {}}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-4 bg-white overflow-hidden shadow rounded-lg">
                <div className="p-6 text-center">
                  <p className="text-gray-500">No available jobs matching your criteria.</p>
                  <Button
                    variant="link"
                    className="mt-2 text-primary-600 hover:text-primary-500"
                    onClick={() => setJobCategory("All Categories")}
                  >
                    View all categories
                  </Button>
                </div>
              </div>
            )}
            
            <div className="mt-5 text-center">
              <Button
                variant="outline"
                onClick={() => {}}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <Link href="/writer/available-jobs">View All Jobs</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modals */}
      <WithdrawModal 
        isOpen={isWithdrawModalOpen} 
        onClose={() => setIsWithdrawModalOpen(false)} 
      />
      
      <BidModal
        job={selectedJob}
        isOpen={isBidModalOpen}
        onClose={closeBidModal}
      />
    </DashboardLayout>
  );
}
