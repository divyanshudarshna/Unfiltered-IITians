"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Rocket, Clock, FileText, Award, Zap, Crown, Sparkles, Target, CheckCircle2, Star } from "lucide-react";
import { BuyMockButton } from "@/components/BuyMockButton";
import { useState } from "react";

interface Mock {
  id: string;
  title: string;
  description?: string;
  duration?: number | null;
  questionCount: number;
  difficulty?: "EASY" | "MEDIUM" | "HARD";
  tags?: string[];
  isSubscribed?: boolean;
  subscriptionSource?: 'bundle' | 'individual' | 'none';
  price?: number;
  actualPrice?: number;
}

interface Props {
  mocks: Mock[];
  clerkUserId?: string;
}

export default function BundleMocksClient({ mocks = [], clerkUserId }: Readonly<Props>) {
  const [purchased, setPurchased] = useState(new Set(
    mocks.filter(mock => mock.isSubscribed).map(mock => mock.id)
  ));

  const handlePurchaseSuccess = (mockId: string) => {
    setPurchased((prev) => new Set(prev).add(mockId));
  };

  // Calculate discount percentage based on actualPrice and price
  const calculateDiscountPercentage = (price: number, actualPrice: number | null | undefined) => {
    if (!actualPrice || actualPrice <= price) return 0;
    return Math.round(((actualPrice - price) / actualPrice) * 100);
  };
  const formatDuration = (minutes?: number | null) => {
    if (!minutes) return "Flexible Duration";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours && mins) return `${hours}h ${mins}m`;
    if (hours) return `${hours}h`;
    return `${mins}m`;
  };

  const getDifficultyInfo = (difficulty?: string) => {
    switch (difficulty) {
      case "EASY":
        return { color: "bg-emerald-100 text-emerald-800", icon: <Sparkles className="h-3.5 w-3.5 mr-1" />, text: "EASY" };
      case "MEDIUM":
        return { color: "bg-amber-100 text-amber-800", icon: <Target className="h-3.5 w-3.5 mr-1" />, text: "MEDIUM" };
      case "HARD":
        return { color: "bg-rose-100 text-rose-800", icon: <Crown className="h-3.5 w-3.5 mr-1" />, text: "HARD" };
      default:
        return { color: "bg-gray-100 text-gray-800", icon: <FileText className="h-3.5 w-3.5 mr-1" />, text: "STANDARD" };
    }
  };

  return (
    <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {mocks && mocks.length > 0 ? mocks.map(mock => {
        const difficultyInfo = getDifficultyInfo(mock.difficulty);

        const features = [
          { text: `${mock.questionCount} Questions`, icon: FileText },
          { text: formatDuration(mock.duration), icon: Clock },
          { text: "Detailed Solutions", icon: Award },
          { text: "Performance Analytics", icon: Zap },
        ];

        return (
          <Card key={mock.id} className={`shadow-lg hover:shadow-2xl transition-all duration-300 border-0 overflow-hidden group bg-card flex flex-col transform hover:-translate-y-1.5 relative ${
            mock.isSubscribed ? '' : 'opacity-90'
          }`}>
            
            {/* Glow & gradient hover */}
            <div className={`absolute inset-0 rounded-lg ${
              mock.isSubscribed 
                ? 'bg-gradient-to-r from-cyan-400/0 via-blue-400/0 to-purple-500/0 group-hover:from-cyan-400/10 group-hover:via-blue-400/10 group-hover:to-purple-500/10' 
                : 'bg-gradient-to-r from-gray-400/0 via-gray-400/0 to-gray-500/0 group-hover:from-gray-400/5 group-hover:via-gray-400/5 group-hover:to-gray-500/5'
            } opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10`} />

            {/* Header */}
            <div className={`${
              mock.isSubscribed 
                ? 'bg-gradient-to-r from-blue-500 to-purple-600' 
                : 'bg-gradient-to-r from-gray-400 to-gray-500'
            } p-1`}>
              <CardHeader className="bg-background rounded-t-lg py-4">
                <div className="flex justify-between items-start mb-2">
                  <Badge className={`${difficultyInfo.color} font-medium flex items-center border`}>
                    {difficultyInfo.icon} {difficultyInfo.text}
                  </Badge>
                  {mock.isSubscribed ? (
                    <Badge variant="outline" className="bg-green-500/10 text-green-700 flex items-center">
                      <Rocket className="h-3.5 w-3.5 mr-1" /> 
                      {mock.subscriptionSource === 'bundle' ? 'Bundle Access' : 'purchased'}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-500/10 text-red-700 flex items-center">
                      <svg className="h-3.5 w-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                      </svg>
                      Locked
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-xl font-bold group-hover:text-blue-600 transition-colors">{mock.title}</CardTitle>
                <CardDescription className="mt-2">
                  {mock.description || "Comprehensive test to evaluate your knowledge and skills."}
                </CardDescription>
              </CardHeader>
            </div>

            <CardContent className="flex-1 pt-6">
              {/* Pricing information - only show for non-subscribed mocks */}
              {!mock.isSubscribed && mock.price !== undefined && mock.price > 0 && (
                <div className="flex items-end gap-2 mb-6">
                  <div className="flex flex-col">
                    {mock.actualPrice && mock.actualPrice > mock.price && (
                      <span className="text-xs text-muted-foreground line-through">₹{mock.actualPrice}</span>
                    )}
                    <span className="text-2xl font-bold bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
                      ₹{mock.price}
                    </span>
                  </div>
                  {mock.actualPrice && mock.actualPrice > mock.price && (
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 flex items-center ml-2">
                      <Sparkles className="h-3.5 w-3.5 mr-1" />
                      Save {calculateDiscountPercentage(mock.price, mock.actualPrice)}% 
                    </Badge>
                  )}
                </div>
              )}

              {/* Features */}
              <div className="space-y-3 mb-4">
                {features.map((f, idx) => {
                  const Icon = f.icon;
                  return (
                    <div key={`feature-${idx}`} className="flex items-center gap-2 text-sm">
                      <Icon className="h-4 w-4 text-blue-500" />
                      <span>{f.text}</span>
                    </div>
                  );
                })}
              </div>

              {/* Tags */}
              {mock.tags && mock.tags.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Topics:</h4>
                  <div className="flex flex-wrap gap-1">
                    {mock.tags.slice(0, 3).map((tag, idx) => (
                      <Badge key={`tag-${idx}`} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                    {mock.tags.length > 3 && <Badge variant="outline" className="text-xs">+{mock.tags.length - 3} more</Badge>}
                  </div>
                </div>
              )}
            </CardContent>

            {/* Action Buttons */}
            <CardFooter className="border-t pt-4">
              {mock.isSubscribed || (mock.price !== undefined && mock.price === 0) ? (
                <Button asChild className="w-full py-2 h-11 relative overflow-hidden group/btn">
                  <Link href={`/mocks/${mock.id}/start`}>
                    <span className="relative z-10 flex items-center justify-center">
                      <Rocket className="h-4 w-4 mr-2 transition-transform group-hover/btn:translate-x-1" />
                      {mock.price === 0 ? "Start Free Test" : "Start Test"}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                  </Link>
                </Button>
              ) : clerkUserId && mock.price !== undefined && mock.price > 0 ? (
                <BuyMockButton
                  mockTestId={mock.id}
                  clerkUserId={clerkUserId}
                  mockTitle={mock.title}
                  amount={mock.price}
                  onPurchaseSuccess={() => handlePurchaseSuccess(mock.id)}
                />
              ) : (
                <Button 
                  disabled 
                  className="w-full py-2 h-11 relative overflow-hidden bg-gray-400 hover:bg-gray-400 cursor-not-allowed"
                >
                  <span className="relative z-10 flex items-center justify-center">
                    <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                    </svg>
                    Login to Purchase
                  </span>
                </Button>
              )}
            </CardFooter>
          </Card>
        );
      }) : (
        <div className="col-span-full text-center py-12">
          <div className="text-gray-500 mb-4">
            <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No Mock Tests Available</h3>
            <p>This bundle doesn&apos;t contain any mock tests yet.</p>
          </div>
        </div>
      )}
    </div>
  );
}
