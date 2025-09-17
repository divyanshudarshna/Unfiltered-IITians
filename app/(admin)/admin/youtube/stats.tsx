"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FolderIcon, 
  VideoIcon, 
  TrendingUpIcon,
  BarChart3Icon
} from "lucide-react";

interface YoutubeStatsProps {
  refreshTrigger?: number;
}

export default function YoutubeStats({ refreshTrigger }: YoutubeStatsProps) {
  const [categoriesCount, setCategoriesCount] = useState(0);
  const [videosCount, setVideosCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [refreshTrigger]); // This effect will run whenever refreshTrigger changes

  async function fetchStats() {
    setIsLoading(true);
    try {
      const [categoriesRes, videosRes] = await Promise.all([
        fetch("/api/admin/youtube/category"),
        fetch("/api/admin/youtube/video")
      ]);

      const categories = await categoriesRes.json();
      const videos = await videosRes.json();

      setCategoriesCount(categories.length);
      setVideosCount(videos.length);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const stats = [
    {
      title: "Total Categories",
      value: categoriesCount,
      icon: FolderIcon,
      description: "Content categories",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/20"
    },
    {
      title: "Total Videos",
      value: videosCount,
      icon: VideoIcon,
      description: "YouTube videos",
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-100 dark:bg-red-900/20"
    },
    {
      title: "Average per Category",
      value: categoriesCount > 0 ? (videosCount / categoriesCount).toFixed(1) : "0",
      icon: BarChart3Icon,
      description: "Videos per category",
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/20"
    },
    {
      title: "Growth",
      value: "+12.5%",
      icon: TrendingUpIcon,
      description: "Since last month",
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-900/20"
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {stats.map((stat, index) => (
        <Card key={index} className="overflow-hidden transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${stat.bgColor}`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <>
                <Skeleton className="h-7 w-16 mb-1" />
                <Skeleton className="h-4 w-24" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}