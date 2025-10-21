"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, 
  Target, 
  Package, 
  Calendar, 
  Clock,
  Users,
  ArrowLeft,
  ExternalLink,
  CheckCircle,
  XCircle
} from "lucide-react";
import { useRouter } from "next/navigation";

interface SubscriptionsClientProps {
  dbUser: {
    enrollments?: Array<{
      course: {
        id: string;
        title: string;
        description?: string;
        price: number;
        actualPrice?: number;
        createdAt: Date;
        status: string;
      };
      enrolledAt: Date;
    }>;
    subscriptions?: Array<{
      actualAmountPaid?: number | null;
      mockTest?: {
        id: string;
        title: string;
        description?: string;
        price: number;
        createdAt: Date;
      };
      mockBundle?: {
        id: string;
        title: string;
        description?: string;
        mockIds?: string[];
        basePrice: number;
        discountedPrice?: number;
        createdAt: Date;
      };
      createdAt: Date;
    }>;
    sessionEnrollments?: Array<{
      session: {
        id: string;
        title: string;
        description?: string;
        price: number;
        discountedPrice?: number;
        duration: number;
        expiryDate?: Date;
        createdAt: Date;
      };
      enrolledAt: Date;
    }>;
  };
}

export default function SubscriptionsClient({ 
  dbUser 
}: SubscriptionsClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("all");

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  // Process all subscriptions
  const courses = (dbUser.enrollments || []).map((enrollment, index) => ({
    id: `course-${enrollment.course.id}-${index}`,
    itemId: enrollment.course.id,
    title: enrollment.course.title,
    description: enrollment.course.description,
    price: enrollment.course.price,
    originalPrice: enrollment.course.actualPrice,
    purchaseDate: enrollment.enrolledAt,
    type: 'course',
    status: enrollment.course.status,
    mockCount: undefined,
    duration: undefined,
    expiryDate: undefined,
    icon: <BookOpen className="h-5 w-5 text-blue-500" />,
    badgeColor: "bg-blue-100 text-blue-800 border-blue-200"
  }));

  const mockTests = (dbUser.subscriptions || [])
    .filter((sub) => sub.mockTest)
    .map((subscription, index) => ({
      id: `mocktest-${subscription.mockTest!.id}-${index}`,
      itemId: subscription.mockTest!.id,
      title: subscription.mockTest!.title,
      description: subscription.mockTest!.description,
      price: subscription.actualAmountPaid 
        ? subscription.actualAmountPaid / 100 // Convert paise to rupees
        : subscription.mockTest!.price, // Fallback for old records
      originalPrice: subscription.mockTest!.price,
      purchaseDate: subscription.createdAt,
      type: 'mockTest',
      status: 'PUBLISHED',
      mockCount: undefined,
      duration: undefined,
      expiryDate: undefined,
      icon: <Target className="h-5 w-5 text-green-500" />,
      badgeColor: "bg-green-100 text-green-800 border-green-200"
    }));

  const mockBundles = (dbUser.subscriptions || [])
    .filter((sub) => sub.mockBundle)
    .map((subscription, index) => ({
      id: `bundle-${subscription.mockBundle!.id}-${index}`,
      itemId: subscription.mockBundle!.id,
      title: subscription.mockBundle!.title,
      description: subscription.mockBundle!.description,
      price: subscription.actualAmountPaid 
        ? subscription.actualAmountPaid / 100 // Convert paise to rupees
        : (subscription.mockBundle!.discountedPrice || subscription.mockBundle!.basePrice), // Fallback for old records
      originalPrice: subscription.mockBundle!.basePrice,
      purchaseDate: subscription.createdAt,
      type: 'mockBundle',
      status: 'PUBLISHED',
      mockCount: subscription.mockBundle!.mockIds?.length || 0,
      duration: undefined,
      expiryDate: undefined,
      icon: <Package className="h-5 w-5 text-purple-500" />,
      badgeColor: "bg-purple-100 text-purple-800 border-purple-200"
    }));

  const sessions = (dbUser.sessionEnrollments || []).map((enrollment, index) => ({
    id: `session-${enrollment.session.id}-${index}`,
    itemId: enrollment.session.id,
    title: enrollment.session.title,
    description: enrollment.session.description,
    price: enrollment.session.discountedPrice || enrollment.session.price,
    originalPrice: enrollment.session.price,
    purchaseDate: enrollment.enrolledAt,
    duration: enrollment.session.duration,
    expiryDate: enrollment.session.expiryDate,
    type: 'session',
    status: enrollment.session.expiryDate && new Date(enrollment.session.expiryDate) > new Date() ? 'ACTIVE' : 'EXPIRED',
    mockCount: undefined,
    icon: <Users className="h-5 w-5 text-orange-500" />,
    badgeColor: "bg-orange-100 text-orange-800 border-orange-200"
  }));

  const allItems = [...courses, ...mockTests, ...mockBundles, ...sessions].sort(
    (a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime()
  );

  const getFilteredItems = () => {
    switch (activeTab) {
      case "courses":
        return courses;
      case "mocks":
        return [...mockTests, ...mockBundles];
      case "sessions":
        return sessions;
      default:
        return allItems;
    }
  };

  const renderSubscriptionCard = (item: typeof allItems[0]) => {
    const getStatusIcon = () => {
      if (item.status === 'ACTIVE') {
        return <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />;
      } else if (item.status === 'EXPIRED') {
        return <XCircle className="h-4 w-4 text-red-500 ml-auto" />;
      }
      return null;
    };

    return (
      <Card 
        key={item.id} 
        className="hover:shadow-md transition-all duration-200 border border-border"
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              {item.icon}
              <div>
                <h3 className="font-semibold text-lg">{item.title}</h3>
                <p className="text-sm text-muted-foreground capitalize">
                  {item.type === 'mockBundle' ? `Bundle (${item.mockCount} tests)` : item.type}
                </p>
              </div>
            </div>
            <div className="text-right">
              <Badge className={`${item.badgeColor} mb-2`}>
                {item.status === 'EXPIRED' ? 'Expired' : 'Active'}
              </Badge>
              {getStatusIcon()}
            </div>
          </div>

        {item.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {item.description}
          </p>
        )}

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>Purchased: {formatDate(item.purchaseDate)}</span>
          </div>
          
          <div className="flex items-center gap-2 justify-end">
            <span className="font-semibold text-primary">
              {formatPrice(item.price)}
            </span>
            {item.originalPrice && item.originalPrice > item.price && (
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(item.originalPrice)}
              </span>
            )}
          </div>

          {item.type === 'session' && (
            <>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{item.duration} minutes</span>
              </div>
              {item.expiryDate && (
                <div className="flex items-center gap-2 justify-end">
                  <span className="text-xs text-muted-foreground">
                    Expires: {formatDate(item.expiryDate)}
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-border flex gap-2">
          {item.type === 'course' && (
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1"
              onClick={() => router.push(`/dashboard/courses`)}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Access Course
            </Button>
          )}
          {item.type === 'mockTest' && (
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1"
              onClick={() => router.push(`/mocks/${item.itemId}/start`)}
            >
              <Target className="h-4 w-4 mr-2" />
              Take Mock
            </Button>
          )}
          {item.type === 'mockBundle' && (
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1"
              onClick={() => router.push(`/mockBundles/${item.itemId}/mocks`)}
            >
              <Target className="h-4 w-4 mr-2" />
              Take Mock Bundle
            </Button>
          )}
          {item.type === 'session' && item.status === 'ACTIVE' && (
            <Button size="sm" variant="outline" className="flex-1">
              <Users className="h-4 w-4 mr-2" />
              Join Session
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
  };

  const filteredItems = getFilteredItems();

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-indigo-800 via-purple-700 to-pink-800 bg-clip-text text-transparent">
              My Subscriptions
            </h1>
            <p className="text-muted-foreground">
              Manage and access all your courses, mock tests, and sessions
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <BookOpen className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{courses.length}</p>
              <p className="text-sm text-muted-foreground">Courses</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Target className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{mockTests.length + mockBundles.length}</p>
              <p className="text-sm text-muted-foreground">Mock Tests</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-8 w-8 text-orange-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{sessions.length}</p>
              <p className="text-sm text-muted-foreground">Sessions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Package className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{allItems.length}</p>
              <p className="text-sm text-muted-foreground">Total Items</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="all">All ({allItems.length})</TabsTrigger>
            <TabsTrigger value="courses">Courses ({courses.length})</TabsTrigger>
            <TabsTrigger value="mocks">Mocks ({mockTests.length + mockBundles.length})</TabsTrigger>
            <TabsTrigger value="sessions">Sessions ({sessions.length})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-6">
            {filteredItems.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredItems.map(renderSubscriptionCard)}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No subscriptions found</h3>
                  <p className="text-muted-foreground mb-4">
                    {activeTab === "all" 
                      ? "You haven't purchased any items yet."
                      : `You don't have any ${activeTab} subscriptions yet.`
                    }
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={() => router.push("/courses")}>
                      Browse Courses
                    </Button>
                    <Button variant="outline" onClick={() => router.push("/mocks")}>
                      Browse Mocks
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}