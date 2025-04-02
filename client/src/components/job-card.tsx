import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Job } from '@shared/schema';
import { Calendar, Clock, DollarSign, FileText } from 'lucide-react';

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

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-start gap-4">
          <div className="flex-1">
            <div className="flex flex-wrap gap-2 items-center mb-2">
              <h3 className="text-xl font-semibold mr-2">{job.title}</h3>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                {job.status}
              </Badge>
            </div>
            
            <p className="text-muted-foreground mb-4">
              {truncateDescription(job.description)}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-2">
              <div className="flex items-center">
                <DollarSign className="h-4 w-4 mr-2 text-green-600" />
                <span>
                  <span className="font-medium">${job.budget.toFixed(2)}</span> budget
                </span>
              </div>
              
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-amber-600" />
                <span>
                  <span className="font-medium">{job.deadline}</span> days deadline
                </span>
              </div>
              
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                <span>Posted {formatDate(job.createdAt)}</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-2 sm:flex-row lg:flex-col mt-4 lg:mt-0">
            <Button onClick={() => onBid(job)}>
              Place Bid
            </Button>
            <Button variant="outline" onClick={() => onView(job)}>
              <FileText className="h-4 w-4 mr-2" />
              View Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}