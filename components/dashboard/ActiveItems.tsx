"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { BookOpen, Target, Package, Calendar, ArrowRight } from "lucide-react";
import { Skeleton } from "../ui/skeleton";

interface ActiveItem {
  id: string;
  title: string;
  description?: string;
  price: number;
  createdAt: string;
  enrolledAt?: string;
  subscribedAt?: string;
  type: 'course' | 'mockTest' | 'mockBundle';
  mockCount?: number;
}

interface ActiveItemsData {
  courses: ActiveItem[];
  mockTests: ActiveItem[];
  mockBundles: ActiveItem[];
}

export function ActiveItems() {
  const { user } = useUser();
  const [activeItems, setActiveItems] = useState<ActiveItemsData>({
    courses: [],
    mockTests: [],
    mockBundles: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchActiveItems() {
      if (!user) return;
      
      try {
        const res = await fetch(`/api/dashboard/active-items?userId=${user.id}`, {
          cache: "no-store"
        });
        const data = await res.json();
        
        if (res.ok && data.activeItems) {
          setActiveItems(data.activeItems);
        }
      } catch (err) {
        // console.error("Error fetching active items:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchActiveItems();
  }, [user]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderItemCard = (item: ActiveItem) => {
    const getIcon = () => {
      switch (item.type) {
        case 'course':
          return <BookOpen className="h-5 w-5 text-blue-500" />;
        case 'mockTest':
          return <Target className="h-5 w-5 text-green-500" />;
        case 'mockBundle':
          return <Package className="h-5 w-5 text-purple-500" />;
        default:
          return <BookOpen className="h-5 w-5 text-gray-500" />;
      }
    };

    const getBadgeColor = () => {
      switch (item.type) {
        case 'course':
          return "bg-blue-100 text-blue-800 border-blue-200";
        case 'mockTest':
          return "bg-green-100 text-green-800 border-green-200";
        case 'mockBundle':
          return "bg-purple-100 text-purple-800 border-purple-200";
        default:
          return "bg-gray-100 text-gray-800 border-gray-200";
      }
    };

    const getTypeLabel = () => {
      switch (item.type) {
        case 'course':
          return "Course";
        case 'mockTest':
          return "Mock Test";
        case 'mockBundle':
          return `Bundle (${item.mockCount || 0} tests)`;
        default:
          return "Item";
      }
    };

    return (
      <div
        key={`${item.type}-${item.id}`}
        className="p-4 border border-border rounded-xl bg-muted/30 dark:bg-zinc-800/40 hover:shadow-md transition-all"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {getIcon()}
            <h4 className="font-semibold text-sm">{item.title}</h4>
          </div>
          <Badge className={`h-6 px-2 py-1 text-xs ${getBadgeColor()}`}>
            {getTypeLabel()}
          </Badge>
        </div>
        
        {item.description && (
          <p className="text-xs text-muted-foreground mb-2 truncate">
            {item.description}
          </p>
        )}
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>
              {item.type === 'course' 
                ? `Enrolled: ${formatDate(item.enrolledAt || item.createdAt)}` 
                : `Purchased: ${formatDate(item.subscribedAt || item.createdAt)}`
              }
            </span>
          </div>
          <span className="font-medium text-primary">₹{item.price}</span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Card className="shadow-lg bg-background dark:bg-zinc-900/60 border border-border rounded-2xl">
        <CardHeader>
          <CardTitle>My Active Subscriptions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 border border-border rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              <Skeleton className="h-3 w-full" />
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const totalItems = activeItems.courses.length + activeItems.mockTests.length + activeItems.mockBundles.length;
  
  // Combine all items and deduplicate by unique ID
  const allItems = [...activeItems.courses, ...activeItems.mockTests, ...activeItems.mockBundles];
  const uniqueItems = allItems.filter((item, index, self) => 
    index === self.findIndex(t => t.id === item.id)
  );
  
  // Sort items by date (most recent first)
  const sortedItems = [...uniqueItems].sort((a, b) => 
    new Date(b.enrolledAt || b.subscribedAt || b.createdAt).getTime() - 
    new Date(a.enrolledAt || a.subscribedAt || a.createdAt).getTime()
  );

  return (
    <Card className="shadow-lg bg-background dark:bg-zinc-900/60 border border-border rounded-2xl hover:shadow-xl transition-all">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>My Active Subscriptions</CardTitle>
          <Badge variant="secondary" className="bg-emerald-400/20 text-white">
            {totalItems} Active
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {totalItems > 0 ? (
          <>
            <p className="text-sm text-muted-foreground">
              You have access to {activeItems.courses.length} course{activeItems.courses.length !== 1 ? 's' : ''}, {activeItems.mockTests.length} individual mock test{activeItems.mockTests.length !== 1 ? 's' : ''}, and {activeItems.mockBundles.length} mock bundle{activeItems.mockBundles.length !== 1 ? 's' : ''}.
            </p>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {sortedItems.map(renderItemCard)}
            </div>
            
            {totalItems > 5 && (
              <div className="pt-3 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full py-2"
                  onClick={() => {
                    window.location.href = `/dashboard/subscriptions`;
                  }}
                >
                  View All Subscriptions
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 space-y-4">
            <Package className="mx-auto w-8 h-8 text-muted-foreground" />
            <div className="space-y-2">
              <p className="text-muted-foreground">
                No active subscriptions yet.
              </p>
              <p className="text-xs text-muted-foreground">
                Explore our courses and mock tests to get started!
              </p>
            </div>
            <div className="flex gap-2 justify-center">
              <Button
                size="sm"
                onClick={() => (window.location.href = "/courses")}
              >
                Browse Courses
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => (window.location.href = "/mocks")}
              >
                Browse Mocks
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}