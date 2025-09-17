"use client";

import YoutubeStats from "./stats";
import DataTable from "./dataTable";
import { Button } from "@/components/ui/button";
import { RefreshCwIcon } from "lucide-react";
import { useState } from "react";

export default function YoutubeAdminPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefresh = () => {
    console.log("Manual refresh triggered");
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="p-6 w-full mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-800 to-red-700 bg-clip-text text-transparent">
            YouTube Admin Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage your YouTube content and categories
          </p>
        </div>
        
        <Button onClick={handleRefresh} className="gap-2 shrink-0">
          <RefreshCwIcon className="h-4 w-4" />
          Refresh Stats
        </Button>
      </div>
      
      <YoutubeStats refreshTrigger={refreshTrigger} />
      
      <section className="bg-card rounded-xl border shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Categories</h2>
          <p className="text-muted-foreground text-sm mt-1 sm:mt-0">
            Manage your video categories
          </p>
        </div>
        <DataTable type="category" onDataChange={handleRefresh} />
      </section>
      
      <section className="bg-card rounded-xl border shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Videos</h2>
          <p className="text-muted-foreground text-sm mt-1 sm:mt-0">
            Manage your video content
          </p>
        </div>
        <DataTable type="video" onDataChange={handleRefresh} />
      </section>
    </div>
  );
}