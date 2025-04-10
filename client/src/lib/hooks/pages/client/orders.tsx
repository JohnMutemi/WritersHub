import { useAuth } from "@/hooks/use-auth";
import { DashboardLayout } from "@/components/ui/dashboard-layout";

export default function ClientOrders() {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">My Orders</h1>
          <p className="text-muted-foreground">
            Manage your active and completed orders
          </p>
        </div>
        
        <div className="p-8 text-center">
          <p className="text-lg">Client Orders page - Under construction</p>
        </div>
      </div>
    </DashboardLayout>
  );
}