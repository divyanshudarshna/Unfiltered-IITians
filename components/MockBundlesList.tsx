"use client";

import { BuyButton } from "@/components/BuyButton";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CheckCircle2, Star, Zap, Users, Award, BookOpen, Clock, FileText } from "lucide-react";
import { useState } from "react";

interface MockBundle {
  id: string;
  title: string;
  description?: string;
  mockIds: string[];
  basePrice: number;
  discountedPrice?: number;
  createdAt?: Date;
  status?: string;
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
}: MockBundlesListProps) {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const calculateDiscountPercentage = (basePrice: number, discountedPrice: number) => {
    return Math.round(((basePrice - discountedPrice) / basePrice) * 100);
  };

  const getBundleBadges = (bundle: MockBundle) => {
    const badges = [];

    if (bundle.discountedPrice) {
      const discountPercent = calculateDiscountPercentage(bundle.basePrice, bundle.discountedPrice);
      if (discountPercent >= 50) {
        badges.push({ label: "Hot Deal", color: "bg-gradient-to-r from-red-500 to-pink-600", icon: Zap });
      } else if (discountPercent >= 30) {
        badges.push({ label: `${discountPercent}% Off`, color: "bg-gradient-to-r from-orange-500 to-amber-600", icon: Star });
      }
    }
    
    if (bundle.createdAt && (Date.now() - new Date(bundle.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000) {
      badges.push({ label: "New", color: "bg-gradient-to-r from-green-500 to-emerald-600", icon: Star });
    }
    
    if (bundle.mockIds.length >= 5) {
      badges.push({ label: "Popular", color: "bg-gradient-to-r from-purple-500 to-indigo-600", icon: Users });
    }

 

    return badges;
  };

  // Mock titles for demonstration - in real app, you'd fetch these from your database
  const getMockTitles = (mockIds: string[]) => {
    const mockTitles = [
      "Full Length Test 1", "Subject Wise Test", "Previous Year Paper", 
      "Concept Test", "Speed Test", "Revision Test", "Advanced Level", "Basic Level"
    ];
    
    return mockIds.slice(0, 6).map((_, index) => mockTitles[index % mockTitles.length]);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-purple-500 mb-2">
          Mock Test Bundles
        </h1>
        {/* UNDERLINE  */}
          <div className="w-30 h-1  bg-gradient-to-r from-purple-500 to-blue-500 mx-auto mb-4 rounded-full"></div>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          Comprehensive mock test packages designed for maximum preparation efficiency
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
          const badges = getBundleBadges(bundle);
          const mockTitles = getMockTitles(bundle.mockIds);
          const discountPercentage = bundle.discountedPrice 
            ? calculateDiscountPercentage(bundle.basePrice, bundle.discountedPrice)
            : 0;

          let actionElement: React.ReactNode = null;

          if (!clerkUserId) {
            actionElement = (
              <Link href="/sign-in" className="w-full block">
                <Button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg">
                  Login to Purchase
                </Button>
              </Link>
            );
          } else if (fullyPurchased) {
            actionElement = (
              <Link href={`/mockBundles/${bundle.id}/mocks`} className="w-full block">
                <Button className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg flex items-center justify-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Access Bundle
                </Button>
              </Link>
            );
          } else if (remainingMocks.length > 0) {
            actionElement = (
              <BuyButton
                clerkUserId={clerkUserId}
                itemId={bundle.id}
                itemType="mockBundle"
                title={bundle.title}
                amount={bundle.discountedPrice || bundle.basePrice}
                mockIds={remainingMocks}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg"
              />
            );
          }

          return (
            <div
              key={bundle.id}
              className="group"
              onMouseEnter={() => setHoveredCard(bundle.id)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <Card className={`relative flex flex-col h-full rounded-2xl transition-all duration-300
                bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700
                hover:shadow-xl hover:-translate-y-1
                overflow-hidden
                ${hoveredCard === bundle.id ? 'shadow-lg border-blue-300 dark:border-blue-600' : 'shadow-sm'}
              `}>
                
                {/* Top Badges */}
                {badges.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-4 pb-2">
                    {badges.map((badge, index) => (
                      <div
                        key={index}
                        className={`${badge.color} text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow`}
                      >
                        {badge.icon && <badge.icon className="h-3 w-3" />}
                        {badge.label}
                      </div>
                    ))}
                  </div>
                )}

                <CardHeader className="pb-3 px-4 pt-2">
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-xl font-bold text-gray-900 dark:text-white line-clamp-2 pr-2">
                      {bundle.title}
                    </CardTitle>
                    {fullyPurchased && (
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-1" />
                    )}
                  </div>
                  
                  {bundle.description && (
                    <CardDescription className="text-gray-600 dark:text-gray-300 text-sm">
                      {bundle.description}
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent className="flex-1 flex flex-col space-y-4 px-4 pb-6">
                  {/* Bundle Stats */}
                  <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-500" />
                      <span className="font-semibold">{bundle.mockIds.length} Mocks</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-amber-500" />
                      <span>Premium Bundle</span>
                    </div>
                  </div>

                  {/* Mock Titles as Mini Buttons */}
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">
                      Includes:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {mockTitles.map((title, index) => (
                        <span 
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20"
                        >
                          <BookOpen className="h-3 w-3 mr-1" />
                          {title}
                        </span>
                      ))}
                      {bundle.mockIds.length > 6 && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800">
                          +{bundle.mockIds.length - 6} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Pricing Section */}
                  <div className="space-y-2 p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl">
                    {bundle.discountedPrice ? (
                      <>
                        <div className="flex items-baseline justify-between">
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-gray-900 dark:text-white">
                              ₹{bundle.discountedPrice.toLocaleString()}
                            </span>
                            <span className="text-lg text-gray-500 dark:text-gray-400 line-through">
                              ₹{bundle.basePrice.toLocaleString()}
                            </span>
                          </div>
                          <span className="bg-emerald-800 text-white px-2 py-1 rounded-full text-xs font-bold">
                            Save {discountPercentage}%
                          </span>
                        </div>
                        <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                          ₹{Math.round(bundle.discountedPrice / bundle.mockIds.length)} per mock
                        </div>
                      </>
                    ) : (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          ₹{bundle.basePrice.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Complete bundle access
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Progress for Partial Purchases
                  {purchasedMockCount > 0 && !fullyPurchased && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                        <span>Your progress</span>
                        <span className="font-semibold text-amber-600 dark:text-amber-400">
                          {purchasedMockCount}/{bundle.mockIds.length} purchased
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-amber-400 to-orange-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${(purchasedMockCount / bundle.mockIds.length) * 100}%` }}
                        />
                      </div>
                    </div>
                  )} */}

                  {/* Action Button */}
                  <div className="mt-2">
                    {actionElement}
                  </div>

                  {/* Value Proposition */}
                  <div className="text-center">
                    <div className="text-xs text-gray-500 dark:text-gray-400 inline-flex items-center gap-0">
                      <Clock className="h-3 w-3 " />
                      <span className="mt-3"> Lifetime access • Detailed analytics • Performance tracking</span>
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
        <div className="text-center py-16">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-12 max-w-md mx-auto border border-gray-200 dark:border-gray-700">
            <Award className="h-16 w-16 text-blue-500 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
              No Bundles Available
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Check back later for new mock test bundles!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}