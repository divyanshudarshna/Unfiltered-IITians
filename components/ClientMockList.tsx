"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BuyMockButton } from "@/components/BuyMockButton";
import Link from "next/link";
import { Clock, FileText, Star, Zap, Award, CheckCircle2, Crown, Sparkles, Target, Rocket } from "lucide-react";

export default function ClientMockList({ mocks, userId, purchasedMockIds }: any) {
  const [purchased, setPurchased] = useState(new Set(purchasedMockIds));

  const handlePurchaseSuccess = (mockId: string) => {
    setPurchased((prev) => new Set(prev).add(mockId));
  };

  // Calculate discount percentage based on actualPrice and price
  const calculateDiscountPercentage = (price: number, actualPrice: number | null) => {
    if (!actualPrice || actualPrice <= price) return 0;
    return Math.round(((actualPrice - price) / actualPrice) * 100);
  };

  // Format duration from minutes to readable format
  const formatDuration = (minutes: number | null) => {
    if (!minutes) return "Flexible Duration";
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${mins}m`;
    }
  };

  // Get difficulty info
  const getDifficultyInfo = (difficulty: string) => {
    switch (difficulty) {
      case "EASY":
        return {
          color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700/50",
          icon: <Sparkles className="h-3.5 w-3.5 mr-1" />,
          text: "EASY"
        };
      case "MEDIUM":
        return {
          color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-700/50",
          icon: <Target className="h-3.5 w-3.5 mr-1" />,
          text: "MEDIUM"
        };
      case "HARD":
        return {
          color: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300 border-rose-200 dark:border-rose-700/50",
          icon: <Crown className="h-3.5 w-3.5 mr-1" />,
          text: "HARD"
        };
      default:
        return {
          color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700",
          icon: <FileText className="h-3.5 w-3.5 mr-1" />,
          text: "STANDARD"
        };
    }
  };

  return (
    <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {mocks.map((mock: any) => {
        const isPurchased = purchased.has(mock.id);
        const isFree = mock.price === 0;
        const discountPercentage = calculateDiscountPercentage(mock.price, mock.actualPrice);
        const hasDiscount = discountPercentage > 0;
        const questions = Array.isArray(mock.questions) ? mock.questions : [];
        const difficultyInfo = getDifficultyInfo(mock.difficulty);
        
        // Mock test features to highlight - now using dynamic duration
        const features = [
          { text: `${questions.length} Questions`, icon: FileText },
          { text: formatDuration(mock.duration), icon: Clock },
          { text: "Detailed Solutions", icon: Award },
          { text: "Performance Analytics", icon: Zap }
        ];

        return (
          <Card 
            key={mock.id} 
            className="shadow-lg hover:shadow-2xl transition-all duration-300 border-0 overflow-hidden group bg-card flex flex-col transform hover:-translate-y-1.5 relative"
            style={{
              boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.1)"
            }}
          >
            

            {/* Cyan glow effect on hover */}
            <div className="absolute inset-0 rounded-lg bg-cyan-400/0 group-hover:bg-cyan-400/10 opacity-0 group-hover:opacity-100 transition-all duration-500 -z-10 " />
            
            {/* Subtle gradient border effect on hover */}
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-cyan-400/0 via-blue-400/0 to-purple-500/0 group-hover:from-cyan-400/10 group-hover:via-blue-400/10 group-hover:to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 p-px">
              <div className="w-full h-full rounded-lg bg-background" />
            </div>

            {/* Header with gradient background */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-1">
              <CardHeader className="bg-background rounded-t-lg py-4">
                <div className="flex justify-between items-start mb-2">
                  <Badge className={`${difficultyInfo.color} font-medium flex items-center border`}>
                    {difficultyInfo.icon}
                    {difficultyInfo.text}
                  </Badge>
                  {isPurchased ? (
                    <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20 flex items-center">
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      Purchased
                    </Badge>
                  ) : isFree ? (
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20 flex items-center">
                      <Star className="h-3.5 w-3.5 mr-1" />
                      Free
                    </Badge>
                  ) : null}
                </div>
                
                <CardTitle className="text-xl font-bold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {mock.title}
                </CardTitle>
                
                <CardDescription className="mt-2">
                  {mock.description || "Comprehensive test to evaluate your knowledge and skills."}
                </CardDescription>
              </CardHeader>
            </div>

            <CardContent className="flex-1 pt-6">
              {/* Pricing information */}
              {!isFree && !isPurchased && (
                <div className="flex items-end gap-2 mb-6">
                  <div className="flex flex-col">
                    {hasDiscount && (
                      <span className="text-xs text-muted-foreground line-through">₹{mock.actualPrice}</span>
                    )}
    <span className="text-2xl font-bold bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
  ₹{mock.price}
</span>
                  </div>
                  {hasDiscount && (
     <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 flex items-center ml-2">
  <Sparkles className="h-3.5 w-3.5 mr-1" />
  Save {discountPercentage}% 
</Badge>
                  )}
                </div>
              )}

              {/* Features list */}
              <div className="space-y-3 mb-4">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div key={index} className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">{feature.text}</span>
                    </div>
                  );
                })}
              </div>

              {/* Tags */}
              {mock.tags && mock.tags.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium mb-2">Topics Covered:</h4>
                  <div className="flex flex-wrap gap-1">
                    {mock.tags.slice(0, 3).map((tag: string, idx: number) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {mock.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{mock.tags.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>

            <CardFooter className="border-t pt-4">
              {isPurchased || isFree ? (
                <Button asChild className="w-full py-2 h-11 relative overflow-hidden group/btn">
                  <Link href={`/mocks/${mock.id}/start`}>
                    <span className="relative z-10 flex items-center justify-center">
                      <Rocket className="h-4 w-4 mr-2 transition-transform group-hover/btn:translate-x-1" />
                      {isFree ? "Start Free Test" : "Start Test"}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                  </Link>
                </Button>
              ) : (
                <BuyMockButton
                  mockTestId={mock.id}
                  clerkUserId={userId}
                  mockTitle={mock.title}
                  amount={mock.price}
                  onPurchaseSuccess={() => handlePurchaseSuccess(mock.id)}
                  className="w-full py-2 h-11 relative overflow-hidden group/btn"
                >
                  <span className="relative z-10 flex items-center justify-center">
                    <Crown className="h-4 w-4 mr-2 transition-transform group-hover/btn:scale-110" />
                    Buy Now
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-600 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300 rounded-md" />
                </BuyMockButton>
              )}
            </CardFooter>
            
            {/* Glow effect (visible on hover) */}
            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-400/0 via-blue-400/0 to-purple-500/0 group-hover:from-cyan-400/10 group-hover:via-blue-400/10 group-hover:to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
          </Card>
        );
      })}
    </div>
  );
}