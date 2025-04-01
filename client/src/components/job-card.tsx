import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Job } from "@shared/schema";
import { ExternalLink, Clock } from "lucide-react";

interface JobCardProps {
  job: Job;
  onBid: (job: Job) => void;
  onView: (job: Job) => void;
}

export function JobCard({ job, onBid, onView }: JobCardProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex justify-between">
          <Badge variant="outline">{job.category}</Badge>
          <p className="text-sm text-muted-foreground">
            <Clock className="inline-block mr-1 h-3 w-3" />
            {job.deadline} days
          </p>
        </div>
        <CardTitle className="text-lg mt-2 line-clamp-2">{job.title}</CardTitle>
        <CardDescription className="font-medium text-primary">
          ${job.budget}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2 flex-grow">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {job.description}
        </p>
      </CardContent>
      <CardFooter className="pt-1">
        <div className="flex gap-2 w-full">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onView(job)}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Details
          </Button>
          <Button 
            size="sm" 
            className="flex-1"
            onClick={() => onBid(job)}
          >
            Place Bid
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}