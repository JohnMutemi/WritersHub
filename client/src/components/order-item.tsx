import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Order, OrderWithDetails } from "@shared/schema";
import { 
  CalendarIcon, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  DollarSign, 
  FileText, 
  ExternalLink,
  MoreHorizontal,
  Eye
} from "lucide-react";
import { format, formatDistance, isAfter } from "date-fns";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

interface OrderItemProps {
  order: Order | OrderWithDetails;
  onViewDetails: (order: Order | OrderWithDetails) => void;
  onDeliver?: (order: Order | OrderWithDetails) => void;
}

export function OrderItem({ order, onViewDetails, onDeliver }: OrderItemProps) {
  const deadlineDate = order.deadline ? new Date(order.deadline) : new Date();
  const createdDate = order.createdAt ? new Date(order.createdAt) : new Date();
  const timeUntilDeadline = formatDistance(deadlineDate, new Date());
  const isOverdue = isAfter(new Date(), deadlineDate) && order.status !== 'completed';
  
  const getStatusBadge = () => {
    switch (order.status) {
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200">In Progress</Badge>;
      case 'revision':
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200">Revision Needed</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Handle different order types (basic Order vs OrderWithDetails)
  const isOrderWithDetails = (
    order: Order | OrderWithDetails
  ): order is OrderWithDetails => {
    return 'jobTitle' in order;
  };

  const orderTitle = isOrderWithDetails(order) 
    ? order.jobTitle || `Order #${order.id}`
    : `Order #${order.id}`;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">{orderTitle}</CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              Order #{order.id} {getStatusBadge()}
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="px-2 py-1 rounded-full bg-muted flex items-center text-sm">
              <DollarSign className="h-3.5 w-3.5 text-muted-foreground mr-1" />
              <span className="font-medium">${order.amount}</span>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Order Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onViewDetails(order)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                {(order.status === 'in_progress' || order.status === 'revision') && onDeliver && (
                  <DropdownMenuItem onClick={() => onDeliver(order)}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Deliver Work
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-2">
        <div className="max-h-32 overflow-y-auto pr-2 text-sm text-muted-foreground">
          <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Writer ID: #{order.writerId}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Created: {format(createdDate, 'MMM d, yyyy')}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5">
              <Clock className={`h-4 w-4 ${isOverdue ? 'text-red-500' : 'text-muted-foreground'}`} />
              <span className={`text-sm ${isOverdue ? 'text-red-500 font-medium' : ''}`}>
                {order.status === 'completed' 
                  ? 'Completed on ' + format(new Date(order.completedAt || new Date()), 'MMM d, yyyy')
                  : isOverdue 
                    ? 'Overdue by ' + timeUntilDeadline 
                    : 'Due in ' + timeUntilDeadline
                }
              </span>
            </div>
            
            {isOrderWithDetails(order) && order.revisionNotes && (
              <div className="mt-2 pt-2 border-t">
                <h4 className="text-xs font-medium mb-1">Revision Notes:</h4>
                <p className="text-sm text-muted-foreground">
                  {order.revisionNotes}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="border-t pt-3 flex flex-col sm:flex-row gap-2">
        <Button 
          variant="outline" 
          className="w-full sm:w-auto flex-1"
          onClick={() => onViewDetails(order)}
        >
          <Eye className="mr-2 h-4 w-4" />
          View Details
        </Button>
        {(order.status === 'in_progress' || order.status === 'revision') && onDeliver && (
          <Button 
            className="w-full sm:w-auto flex-1"
            onClick={() => onDeliver(order)}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Deliver Work
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}