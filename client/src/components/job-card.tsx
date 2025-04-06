import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Job } from '@shared/schema';
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  Eye, 
  FileEdit, 
  FileText, 
  Tag, 
  LayoutGrid,
  MoreHorizontal,
  Info
} from 'lucide-react';
import { format, formatDistance } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

interface JobCardProps {
  job: Job;
  onBid: (job: Job) => void;
  onView: (job: Job) => void;
}

export function JobCard({ job, onBid, onView }: JobCardProps) {
  // Calculate days until deadline
  const deadline = new Date(job.deadline);
  const createdAt = new Date(job.createdAt);
  const now = new Date();
  
  const daysDifference = Math.ceil(
    (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  const timeUntilDeadline = formatDistance(deadline, now);

  // Determine badge styles based on status
  const getStatusBadge = () => {
    switch (job.status) {
      case 'open':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">Open</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200">In Progress</Badge>;
      case 'completed':
        return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100 border-gray-200">Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Category display name mapping
  const getCategoryName = (category: string) => {
    const categoryMap: Record<string, string> = {
      'blog': 'Blog Posts',
      'website': 'Website Content',
      'technical': 'Technical Writing',
      'social': 'Social Media',
      'marketing': 'Marketing',
      'creative': 'Creative Writing',
      'academic': 'Academic',
    };
    
    return categoryMap[category] || category || 'General Writing';
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="pb-3 border-b">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-lg font-semibold">{job.title}</CardTitle>
              {getStatusBadge()}
            </div>
            <CardDescription className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className="text-xs inline-flex items-center">
                <Clock className="h-3 w-3 mr-1.5" />
                Posted {format(createdAt, "MMM d, yyyy")}
              </span>
              <span className="text-xs inline-flex items-center">
                <span className="h-1 w-1 rounded-full bg-muted-foreground inline-block mx-1"></span>
                ID: #{job.id}
              </span>
              <span className="text-xs inline-flex items-center">
                <span className="h-1 w-1 rounded-full bg-muted-foreground inline-block mx-1"></span>
                <Tag className="h-3 w-3 mr-1.5" />
                {getCategoryName(job.category)}
              </span>
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="rounded-md border px-2 py-1 inline-flex flex-col items-center">
              <p className="text-xs font-medium text-muted-foreground whitespace-nowrap">Due in</p>
              <p className={`text-sm font-medium ${daysDifference <= 2 ? "text-red-500" : daysDifference <= 5 ? "text-amber-500" : "text-green-600"}`}>
                {daysDifference} {daysDifference === 1 ? "day" : "days"}
              </p>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView(job)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                {job.status === "open" && (
                  <DropdownMenuItem onClick={() => onBid(job)}>
                    <FileEdit className="mr-2 h-4 w-4" />
                    Place Bid
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="max-h-[250px] overflow-y-auto p-4">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium">Project Description</h4>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">This job was posted on {format(createdAt, "MMMM d, yyyy")} with a {daysDifference}-day deadline.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {job.description}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
            <div className="rounded-md bg-muted/30 p-3">
              <h4 className="text-xs font-medium text-muted-foreground mb-1 flex items-center">
                <DollarSign className="h-3.5 w-3.5 mr-1" />
                Budget
              </h4>
              <p className="text-base font-semibold flex items-center">
                ${job.budget.toFixed(2)}
              </p>
            </div>
            
            <div className="rounded-md bg-muted/30 p-3">
              <h4 className="text-xs font-medium text-muted-foreground mb-1 flex items-center">
                <FileText className="h-3.5 w-3.5 mr-1" />
                Word Count
              </h4>
              <p className="text-sm font-medium">
                ~{(job.pages || 1) * 500} words
              </p>
              <p className="text-xs text-muted-foreground">
                ({job.pages || 1} {(job.pages || 1) === 1 ? "page" : "pages"})
              </p>
            </div>
            
            <div className="rounded-md bg-muted/30 p-3">
              <h4 className="text-xs font-medium text-muted-foreground mb-1 flex items-center">
                <Calendar className="h-3.5 w-3.5 mr-1" />
                Deadline
              </h4>
              <p className="text-sm font-medium">
                {format(deadline, "MMM d, yyyy")}
              </p>
              <p className="text-xs text-muted-foreground">
                ({daysDifference} days from now)
              </p>
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="border-t p-4 flex flex-col sm:flex-row gap-2">
        <Button 
          variant="outline" 
          className="w-full sm:w-auto flex-1"
          onClick={() => onView(job)}
        >
          <Eye className="mr-2 h-4 w-4" />
          View Details
        </Button>
        
        <Button 
          className="w-full sm:w-auto flex-1"
          onClick={() => onBid(job)}
          disabled={job.status !== "open"}
        >
          <FileEdit className="mr-2 h-4 w-4" />
          Place Bid
        </Button>
      </CardFooter>
    </Card>
  );
}