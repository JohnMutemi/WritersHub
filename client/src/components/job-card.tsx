import React from "react";
import { Job } from "@shared/schema";
import { Clock, FileText, DollarSign, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface JobCardProps {
  job: Job;
  onBid: (job: Job) => void;
  onView: (job: Job) => void;
}

export function JobCard({ job, onBid, onView }: JobCardProps) {
  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case "Academic":
        return "bg-blue-100 text-blue-800";
      case "Technical":
        return "bg-purple-100 text-purple-800";
      case "Creative":
        return "bg-green-100 text-green-800";
      case "Business":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex justify-between">
          <h3 className="text-lg leading-6 font-medium text-gray-900">{job.title}</h3>
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getCategoryBadgeClass(job.category)}`}>
            {job.category}
          </span>
        </div>
        <div className="mt-2 max-w-xl text-sm text-gray-500">
          <p>{job.description}</p>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-4">
          <div className="flex items-center text-sm text-gray-500">
            <Clock className="text-gray-400 h-4 w-4 mr-1" />
            Deadline: {job.deadline} days
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <FileText className="text-gray-400 h-4 w-4 mr-1" />
            {job.pages} pages
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <DollarSign className="text-gray-400 h-4 w-4 mr-1" />
            Budget: ${job.budget}
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <User className="text-gray-400 h-4 w-4 mr-1" />
            Client ID: {job.clientId}
          </div>
        </div>
        <div className="mt-5 flex">
          <Button
            onClick={() => onBid(job)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Place Bid
          </Button>
          <Button
            onClick={() => onView(job)}
            variant="outline"
            className="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            View Details
          </Button>
        </div>
      </div>
    </div>
  );
}
