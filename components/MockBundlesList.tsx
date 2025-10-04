"use client";

import { BuyButton } from "@/components/BuyButton";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { CheckCircle2, Zap, Award, BookOpen, Clock, FileText, Target, Brain, Trophy, Lightbulb, IndianRupee, ArrowRight, Rocket } from "lucide-react";

interface MockTest {
  id: string;
  title: string;
  difficulty: string;
  duration?: number | null;
  tags: string[];
}

interface MockBundle {
  id: string;
  title: string;
  description?: string | null;
  mockIds: string[];
  basePrice: number;
  discountedPrice?: number | null;
  createdAt?: Date;
  status?: string;
  mockTests?: MockTest[];
}

interface MockBundlesListProps {
  bundles: MockBundle[];
  userMockSubscriptions: string[];
  clerkUserId?: string | null;
}

export default function MockBundlesList({
  bundles,
  userMockSubscriptions,
  clerkUserId,
}: Readonly<MockBundlesListProps>) {
  const calculateDiscountPercentage = (basePrice: number, discountedPrice: number) => {
    return Math.round(((basePrice - discountedPrice) / basePrice) * 100);
  };

 

  const getIconAndColorFromMock = (mockTest: MockTest) => {
    let icon = FileText;
    let color = "blue";

    const title = mockTest.title.toLowerCase();
    const tags = mockTest.tags.map(tag => tag.toLowerCase());
    
    if (title.includes('math') || tags.includes('mathematics')) {
      icon = Target;
      color = "purple";
    } else if (title.includes('physics') || tags.includes('physics')) {
      icon = Zap;
      color = "cyan";
    } else if (title.includes('chemistry') || tags.includes('chemistry')) {
      icon = Lightbulb;
      color = "pink";
    } else if (title.includes('biology') || tags.includes('biology')) {
      icon = Brain;
      color = "teal";
    } else if (title.includes('previous') || title.includes('year') || tags.includes('previous-year')) {
      icon = Trophy;
      color = "amber";
    } else if (title.includes('full') || title.includes('complete') || tags.includes('full-length')) {
      icon = BookOpen;
      color = "indigo";
    } else if (title.includes('speed') || title.includes('quick') || tags.includes('speed-test')) {
      icon = Zap;
      color = "red";
    } else if (title.includes('advanced') || mockTest.difficulty === 'HARD') {
      icon = Brain;
      color = "orange";
    } else if (title.includes('basic') || title.includes('foundation') || mockTest.difficulty === 'EASY') {
      icon = Award;
      color = "green";
    } else if (mockTest.difficulty === 'MEDIUM') {
      icon = Target;
      color = "emerald";
    }

    return { icon, color };
  };

  const getMockTitles = (bundle: MockBundle) => {
    if (!bundle.mockTests || bundle.mockTests.length === 0) {
      return [];
    }

    return bundle.mockTests.slice(0, 8).map((mockTest) => {
      const { icon, color } = getIconAndColorFromMock(mockTest);
      return {
        title: mockTest.title,
        icon,
        color
      };
    });
  };

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: 'border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30',
      purple: 'border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30',
      amber: 'border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30',
      emerald: 'border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30',
      red: 'border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30',
      indigo: 'border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30',
      orange: 'border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30',
      green: 'border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30',
      cyan: 'border-cyan-200 dark:border-cyan-800 text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-900/20 hover:bg-cyan-100 dark:hover:bg-cyan-900/30',
      pink: 'border-pink-200 dark:border-pink-800 text-pink-700 dark:text-pink-300 bg-pink-50 dark:bg-pink-900/20 hover:bg-pink-100 dark:hover:bg-pink-900/30',
      teal: 'border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-900/20 hover:bg-teal-100 dark:hover:bg-teal-900/30',
      violet: 'border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-900/20 hover:bg-violet-100 dark:hover:bg-violet-900/30'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  const renderActionButtons = (bundle: MockBundle, fullyPurchased: boolean, remainingMocks: string[]) => {
    if (fullyPurchased) {
      return (
        <Button
          asChild
          className="flex-1 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 
                   text-white shadow-lg hover:shadow-xl transition-all duration-500 ease-out
                   transform group-hover:scale-105 h-11 rounded-xl font-bold relative overflow-hidden"
        >
          <Link href={`/mockBundles/${bundle.id}/mocks`}>
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            <span className="relative z-5 flex items-center justify-center gap-2">
              Start Tests
              <Rocket className="h-4 w-4" />
            </span>
          </Link>
        </Button>
      );
    }

    if (!clerkUserId) {
      return (
        <Button
          asChild
          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 
                   text-white shadow-lg hover:shadow-xl transition-all duration-500 ease-out
                   transform group-hover:scale-105 h-11 rounded-xl font-bold"
        >
          <Link href="/sign-in">
            <span className="relative z-5 flex items-center justify-center gap-2">
              Login to Purchase
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        </Button>
      );
    }

    return (
      <>
        <BuyButton
          clerkUserId={clerkUserId}
          itemId={bundle.id}
          itemType="mockBundle"
          title={bundle.title}
          amount={bundle.discountedPrice ?? bundle.basePrice}
          mockIds={remainingMocks}
          onPurchaseSuccess={() => {}}
        />

        <Link
          href={`/mockBundles/${bundle.id}/mocks`}
          className="flex-1 inline-flex items-center justify-center 
                     border border-blue-500 text-blue-600 hover:bg-blue-50 
                     dark:border-blue-400 dark:text-blue-300 dark:hover:bg-blue-900/20
                     transition-all duration-300 h-11 rounded-xl font-semibold
                     transform hover:scale-105"
        >
          <BookOpen className="h-4 w-4 mr-2" />
          Details
        </Link>
      </>
    );
  };

  return (
    <div className="container mx-auto px-6 py-10">
      {/* Header Section */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-center mb-10 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Premium Mock Test Bundles
        </h1>
        <p className="text-xl text-center text-muted-foreground max-w-3xl mx-auto mb-12">
          Comprehensive test series designed to boost your exam preparation with real-time analytics and detailed performance insights.
        </p>
      </div>

      {/* Bundles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {bundles.map((bundle) => {
          const purchasedMockCount = bundle.mockIds.filter((id) =>
            userMockSubscriptions.includes(id)
          ).length;
          const fullyPurchased = purchasedMockCount === bundle.mockIds.length;
          const remainingMocks = bundle.mockIds.filter(
            (id) => !userMockSubscriptions.includes(id)
          );
          const mockTitles = getMockTitles(bundle);
          const discountPercentage = bundle.discountedPrice 
            ? calculateDiscountPercentage(bundle.basePrice, bundle.discountedPrice)
            : 0;

          return (
            <div key={bundle.id} className="relative group">
              {/* Glow Effect */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-0 group-hover:opacity-70 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
              
              <Card className="relative rounded-2xl border border-border shadow-lg 
                          bg-gradient-to-br from-white to-gray-50/80 
                          dark:from-zinc-900 dark:to-zinc-800/90
                          backdrop-blur-sm
                          group-hover:shadow-2xl group-hover:scale-[1.02]
                          transition-all duration-500 ease-out
                          border-opacity-20 group-hover:border-opacity-40
                          overflow-hidden h-full flex flex-col">
                
                {/* Animated Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-blue-50/10 to-purple-50/10 dark:via-blue-900/5 dark:to-purple-900/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Shine Effect */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                {/* Purchased Badge - Only show if purchased */}
                {fullyPurchased && (
                  <div className="absolute top-4 right-4 z-10">
                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1.5 shadow-lg shadow-green-500/25 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Purchased
                    </Badge>
                  </div>
                )}

                <CardHeader className="relative z-5 pb-4 pt-6">
                  <CardTitle className="text-xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent line-clamp-2 text-left">
                    {bundle.title}
                  </CardTitle>
                  {bundle.description && (
                    <CardDescription className="text-muted-foreground text-sm text-left line-clamp-3 mt-2">
                      {bundle.description}
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent className="relative z-5 flex-grow space-y-4 pb-6">
                  {/* Bundle Stats */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-500" />
                      <span className="font-semibold">{bundle.mockIds.length} Mock Tests</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-amber-500" />
                      <span>Premium</span>
                    </div>
                  </div>

                  {/* Mock Titles */}
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm flex items-center gap-2 text-left">
                      <BookOpen className="h-4 w-4 text-blue-500" />
                      Included Tests:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {mockTitles.length > 0 ? (
                        mockTitles.map((mock, index) => {
                          const MockIcon = mock.icon;
                          return (
                            <Badge 
                              key={`${bundle.id}-mock-${index}`}
                              variant="secondary"
                              className={`
                                inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                                border transition-all duration-200 hover:scale-105 cursor-default
                                ${getColorClasses(mock.color)}
                              `}
                            >
                              <MockIcon className="h-3 w-3" />
                              <span className="line-clamp-1 max-w-[120px]">{mock.title}</span>
                            </Badge>
                          );
                        })
                      ) : (
                        <div className="text-gray-500 dark:text-gray-400 text-sm italic">
                          Mock test details loading...
                        </div>
                      )}
                      {bundle.mockIds.length > 8 && (
                        <Badge 
                          variant="outline"
                          className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800"
                        >
                          +{bundle.mockIds.length - 8} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Pricing Section */}
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-xl">
                    {bundle.discountedPrice ? (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-1">
                            <IndianRupee className="h-5 w-5" />
                            {bundle.discountedPrice === 0 ? "Free" : bundle.discountedPrice.toLocaleString()}
                          </span>
                          <span className="text-sm text-muted-foreground line-through">
                            ₹{bundle.basePrice.toLocaleString()}
                          </span>
                          <Badge
                            variant="outline"
                            className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
                          >
                            Save ₹{(bundle.basePrice - bundle.discountedPrice).toLocaleString()}
                          </Badge>
                        </div>
                        <div className="text-xs text-green-600 font-medium">
                          {discountPercentage}% discount applied
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-1">
                          <IndianRupee className="h-5 w-5" />
                          {bundle.basePrice === 0 ? "Free" : bundle.basePrice.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 mt-4">
                    {renderActionButtons(bundle, fullyPurchased, remainingMocks)}
                  </div>

                  {/* Value Proposition */}
                  <div className="text-center pt-2">
                    <div className="text-xs text-muted-foreground inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>Lifetime access • Detailed analytics • Performance tracking</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {bundles.length === 0 && (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
          <div className="bg-muted p-6 rounded-full mb-4">
            <Award className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">No Mock Bundles Available</h2>
          <p className="text-muted-foreground mb-4">
            Check back later for new mock test bundles and preparation materials.
          </p>
        </div>
      )}
    </div>
  );
}