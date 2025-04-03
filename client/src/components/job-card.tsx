import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Job } from '@shared/schema';
import { Calendar, Clock, DollarSign, FileText, Timer } from 'lucide-react';
import { DeadlineCountdown } from './deadline-countdown';

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
  const truncateDescription = (text: string, maxLength = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex flex-col gap-2">
          <div className="flex-1">
            <div className="flex flex-wrap gap-1 items-center mb-1">
              <h3 className="text-lg font-semibold mr-1">{job.title}</h3>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                {job.status}
              </Badge>
            </div>
            
            <p className="text-muted-foreground mb-2 text-sm">
              {truncateDescription(job.description)}
            </p>
            
            <div className="grid grid-cols-2 gap-2 text-xs mb-2">
              <div className="flex items-center">
                <DollarSign className="h-4 w-4 mr-2 text-green-600" />
                <span>
                  <span className="font-medium">${job.budget.toFixed(2)}</span> budget
                </span>
              </div>
              
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-amber-600" />
                <span>
                  <span className="font-medium">{formatDate(new Date(job.deadline))}</span> deadline
                </span>
              </div>
              
              <div className="flex items-center">
                <Timer className="h-4 w-4 mr-2 text-red-600" />
                <DeadlineCountdown deadline={job.deadline} />
              </div>
              
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                <span>Posted {formatDate(job.createdAt)}</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-row justify-between gap-2 mt-2">
            <Button onClick={() => onBid(job)} size="sm" className="flex-1">
              Place Bid
            </Button>
            <Button variant="outline" onClick={() => onView(job)} size="sm" className="flex-1">
              <FileText className="h-4 w-4 mr-1" />
              Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}