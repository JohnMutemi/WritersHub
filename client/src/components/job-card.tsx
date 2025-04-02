import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Job } from "@shared/schema";
import { CalendarIcon, DollarSign, FileText, Clock } from "lucide-react";
import { formatDistance, format } from "date-fns";

interface JobCardProps {
  job: Job;
  onBid: (job: Job) => void;
  onView: (job: Job) => void;
}

export function JobCard({ job, onBid, onView }: JobCardProps) {
  const postedDate = job.createdAt ? new Date(job.createdAt) : new Date();
  const timeAgo = formatDistance(postedDate, new Date(), { addSuffix: true });

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="line-clamp-2 text-lg font-semibold">
            {job.title}
          </CardTitle>
          <Badge variant="outline" className="capitalize">{job.category}</Badge>
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
          <CalendarIcon className="h-3 w-3" />
          <span>Posted {timeAgo}</span>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
          {job.description}
        </p>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-1">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">${job.budget}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{job.deadline} days</span>
          </div>
          {job.pages && (
            <div className="flex items-center gap-1">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{job.pages} pages</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-2 flex gap-2">
        <Button variant="outline" className="w-1/2" onClick={() => onView(job)}>
          View Details
        </Button>
        <Button className="w-1/2" onClick={() => onBid(job)}>
          Place Bid
        </Button>
      </CardFooter>
    </Card>
  );
}