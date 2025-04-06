import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Job } from '@shared/schema';
import { Calendar, Clock, DollarSign, Eye, FileEdit, FileText, Info as InfoIcon } from 'lucide-react';
import { format } from "date-fns";

interface JobCardProps {
  job: Job;
  onBid: (job: Job) => void;
  onView: (job: Job) => void;
}

export function JobCard({ job, onBid, onView }: JobCardProps) {
  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Truncate description
  const truncateDescription = (text: string, maxLength = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Calculate days until deadline
  const daysDifference = Math.ceil(
    (new Date(job.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  // Determine color for deadline display
  const getLabelColor = (days: number) => {
    if (days <= 2) return "text-red-500";
    if (days <= 5) return "text-orange-500";
    return "text-green-500";
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="pb-3 border-b">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl">{job.title}</CardTitle>
              <Badge 
                className={
                  job.status === "open"
                    ? "bg-green-500"
                    : job.status === "in_progress"
                    ? "bg-blue-500"
                    : job.status === "completed"
                    ? "bg-gray-500"
                    : "bg-red-500"
                }
              >
                {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
              </Badge>
            </div>
            <CardDescription className="mt-1 flex items-center gap-2">
              <span className="text-xs inline-flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                Posted: {format(new Date(job.createdAt), "MMM d, yyyy")}
              </span>
              <span className="text-xs inline-flex items-center">
                <span className="h-1 w-1 rounded-full bg-muted-foreground inline-block mx-1"></span>
                Job ID: #{job.id}
              </span>
            </CardDescription>
          </div>
          
          <div className="text-right">
            <div className="rounded-md border px-2 py-1 inline-flex flex-col items-center">
              <p className="text-xs font-medium text-muted-foreground">Due in</p>
              <p className={`text-sm font-semibold ${getLabelColor(daysDifference)}`}>
                {daysDifference} {daysDifference === 1 ? "day" : "days"}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="max-h-[200px] overflow-y-auto pr-1 mb-4">
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2">Project Description</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {job.description}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
            <div className="rounded-md border p-3">
              <h4 className="text-xs font-medium text-muted-foreground mb-1">Budget</h4>
              <p className="text-lg font-semibold flex items-center">
                <DollarSign className="h-4 w-4 mr-1 text-green-500" />
                ${job.budget.toFixed(2)}
              </p>
            </div>
            
            <div className="rounded-md border p-3">
              <h4 className="text-xs font-medium text-muted-foreground mb-1">Category</h4>
              <p className="text-sm font-medium">
                {job.category || "General Writing"}
              </p>
            </div>
            
            <div className="rounded-md border p-3">
              <h4 className="text-xs font-medium text-muted-foreground mb-1">Word Count</h4>
              <p className="text-sm font-medium">
                ~{(job.pages || 1) * 500} words ({job.pages || 1} {(job.pages || 1) === 1 ? "page" : "pages"})
              </p>
            </div>
          </div>
        </div>
        
        <div className="border-t pt-4 flex gap-2 justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onView(job)}
          >
            <Eye className="h-4 w-4 mr-1" />
            View Details
          </Button>
          
          <Button 
            size="sm" 
            onClick={() => onBid(job)}
            disabled={job.status !== "open"}
          >
            <FileEdit className="h-4 w-4 mr-1" />
            Place Bid
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}