import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function WriterDashboard() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Writer Dashboard</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Welcome to SharpQuill Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">The application is currently in maintenance mode. Please check back later.</p>
          <Button asChild>
            <a href="/auth">Go to Login Page</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
