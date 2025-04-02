import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Order } from "@shared/schema";
import { CalendarIcon, Clock, AlertCircle, CheckCircle, DollarSign } from "lucide-react";
import { format, formatDistance, isAfter } from "date-fns";

interface OrderItemProps {
  order: Order;
  onViewDetails: (order: Order) => void;
  onDeliver?: (order: Order) => void;
}

export function OrderItem({ order, onViewDetails, onDeliver }: OrderItemProps) {
  const deadlineDate = order.deadline ? new Date(order.deadline) : new Date();
  const createdDate = order.createdAt ? new Date(order.createdAt) : new Date();
  const timeUntilDeadline = formatDistance(deadlineDate, new Date());
  const isOverdue = isAfter(new Date(), deadlineDate) && order.status !== 'completed';
  
  const getStatusBadge = () => {
    switch (order.status) {
      case 'in_progress':
        return <Badge variant="outline" className="bg-blue-50 text-blue-600 hover:bg-blue-50">In Progress</Badge>;
      case 'revision':
        return <Badge variant="outline" className="bg-amber-50 text-amber-600 hover:bg-amber-50">Revision</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-600 hover:bg-green-50">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-50 text-red-600 hover:bg-red-50">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">Order #{order.id}</h3>
              {getStatusBadge()}
            </div>
            <div className="text-sm text-muted-foreground">
              <p>Job ID: #{order.jobId}</p>
              <p>Client ID: #{order.clientId}</p>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">${order.amount}</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 text-sm">
              <div className="flex items-center gap-1">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <span>Created: {format(createdDate, 'MMM d, yyyy')}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className={`h-4 w-4 ${isOverdue ? 'text-red-500' : 'text-muted-foreground'}`} />
                <span className={isOverdue ? 'text-red-500 font-medium' : ''}>
                  {order.status === 'completed' 
                    ? 'Completed on ' + format(new Date(order.completedAt || new Date()), 'MMM d, yyyy')
                    : isOverdue 
                      ? 'Overdue by ' + timeUntilDeadline 
                      : 'Due in ' + timeUntilDeadline
                  }
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-row sm:flex-col justify-end gap-2 sm:min-w-[160px]">
            <Button 
              variant="outline" 
              className="flex-1 sm:flex-auto"
              onClick={() => onViewDetails(order)}
            >
              View Details
            </Button>
            {(order.status === 'in_progress' || order.status === 'revision') && onDeliver && (
              <Button 
                className="flex-1 sm:flex-auto"
                onClick={() => onDeliver(order)}
              >
                Deliver Work
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}