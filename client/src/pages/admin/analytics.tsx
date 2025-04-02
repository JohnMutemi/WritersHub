import { useAuth } from "@/hooks/use-auth";
import { DashboardLayout } from "@/components/ui/dashboard-layout";

export default function AdminAnalytics() {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Platform statistics and performance data
          </p>
        </div>
        
        <div className="p-8 text-center">
          <p className="text-lg">Admin Analytics page - Under construction</p>
        </div>
      </div>
    </DashboardLayout>
  );
}