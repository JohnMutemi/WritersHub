import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Order } from "@shared/schema";
import { FileText, Clock, ExternalLink } from "lucide-react";

interface OrderItemProps {
  order: Order;
  onViewDetails: (order: Order) => void;
  onDeliver?: (order: Order) => void;
}

export function OrderItem({ order, onViewDetails, onDeliver }: OrderItemProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Badge variant={
            order.status === 'in_progress' ? 'default' :
            order.status === 'revision' ? 'outline' :
            order.status === 'completed' ? 'default' :
            'destructive'
          }>
            {order.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
          </Badge>
          <p className="text-sm text-muted-foreground">
            <Clock className="inline-block mr-1 h-3 w-3" />
            Due in {order.deadline ? Math.max(0, Math.floor((new Date(order.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : '--'} days
          </p>
        </div>
        <CardTitle className="text-lg mt-2">Order #{order.id}</CardTitle>
        <CardDescription>
          Job title unavailable
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex items-center justify-between text-sm">
          <div>
            <p className="font-medium text-primary">${order.amount}</p>
            <p className="text-muted-foreground mt-1">
              Page count not specified
            </p>
          </div>
          <div className="text-right">
            <p className="font-medium">Client #{order.clientId}</p>
            <p className="text-muted-foreground mt-1">
              Created on {new Date(order.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <div className="flex gap-2 w-full">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onViewDetails(order)}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            View Details
          </Button>
          {onDeliver && order.status === 'in_progress' && (
            <Button 
              size="sm" 
              className="flex-1"
              onClick={() => onDeliver(order)}
            >
              <FileText className="mr-2 h-4 w-4" />
              Deliver Work
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}