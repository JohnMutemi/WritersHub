import React from "react";
import { Order, Job } from "@shared/schema";
import { Clock, FileText, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

interface OrderItemProps {
  order: Order;
  onViewDetails: (order: Order) => void;
  onDeliver?: (order: Order) => void;
}

export function OrderItem({ order, onViewDetails, onDeliver }: OrderItemProps) {
  const { data: job } = useQuery<Job>({
    queryKey: [`/api/jobs/${order.jobId}`],
  });

  if (!job) {
    return (
      <div className="block hover:bg-gray-50 animate-pulse">
        <div className="px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="bg-gray-200 h-4 w-1/3 rounded"></div>
            <div className="bg-gray-200 h-4 w-1/4 rounded"></div>
          </div>
          <div className="mt-2 sm:flex sm:justify-between">
            <div className="bg-gray-200 h-4 w-1/2 rounded"></div>
            <div className="bg-gray-200 h-4 w-1/3 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      case "revision":
        return "bg-orange-100 text-orange-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Format the status for display
  const formatStatus = (status: string) => {
    return status.replace("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
  };

  // Calculate days remaining
  const daysRemaining = () => {
    const deadline = new Date(order.deadline);
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  return (
    <li>
      <div className="block hover:bg-gray-50">
        <div className="px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <p className="text-sm font-medium text-primary-600 truncate">{job.title}</p>
              <div className="ml-2 flex-shrink-0 flex">
                <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(order.status)}`}>
                  {formatStatus(order.status)}
                </p>
              </div>
            </div>
            <div className="ml-2 flex-shrink-0 flex">
              <p className="text-sm text-gray-700">
                Due in <span className="font-medium">{daysRemaining()} days</span>
              </p>
            </div>
          </div>
          <div className="mt-2 sm:flex sm:justify-between">
            <div className="sm:flex">
              <p className="flex items-center text-sm text-gray-500">
                <FileText className="text-gray-400 h-4 w-4 mr-1" />
                {job.pages} pages
              </p>
              <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                <DollarSign className="text-gray-400 h-4 w-4 mr-1" />
                ${order.amount.toFixed(2)}
              </p>
            </div>
            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
              <Button
                variant="link"
                onClick={() => onViewDetails(order)}
                className="font-medium text-primary-600 hover:text-primary-500 mr-4"
              >
                View Details
              </Button>
              {onDeliver && order.status === "in_progress" && (
                <Button
                  onClick={() => onDeliver(order)}
                  className="px-3 py-1 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-500 focus:outline-none"
                >
                  Deliver
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}
