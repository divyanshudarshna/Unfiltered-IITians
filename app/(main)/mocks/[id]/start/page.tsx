"use client";

import { use, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FileText, AlertCircle, CheckCircle, BookOpen, Target, Award, Zap, BarChart3, Play, Star, Shield, Timer, Lightbulb, ChevronRight, Lock, ShoppingCart, Ban } from "lucide-react";
import { toast } from "sonner";

interface Question {
  type: string;
  [key: string]: unknown;
}

interface MockData {
  id: string;
  title: string;
  description?: string;
  price: number;
  actualPrice?: number;
  duration?: number;
  questions: Question[];
  tags: string[];
  difficulty: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface StartMockPageProps {
  readonly params: Promise<{ id: string }>;
}

export default function StartMockPage({ params }: StartMockPageProps) {
  const { id } = use(params);
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [mock, setMock] = useState<MockData | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [accessReason, setAccessReason] = useState<string>("");
  const [subscriptionType, setSubscriptionType] = useState<string>("");
  const [attemptCount, setAttemptCount] = useState(0);
  const [maxAttempts, setMaxAttempts] = useState(0);
  const [attemptsRemaining, setAttemptsRemaining] = useState(0);
  const [canAttempt, setCanAttempt] = useState(true);
  const [error, setError] = useState("");

  // Calculate question types
  const calculateQuestionTypes = (questions: Question[]) => {
    const types: Record<string, number> = {};
    questions?.forEach(q => {
      types[q.type] = (types[q.type] || 0) + 1;
    });
    return types;
  };

  // Format duration from minutes to readable format
  const formatDuration = (minutes: number | null) => {
    if (!minutes) return "Flexible timing";
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}m`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
      return `${mins} minutes`;
    }
  };

  // Helper functions for better readability
  const getDifficultyBadgeStyles = (difficulty: string) => {
    switch (difficulty) {
      case "EASY":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "MEDIUM":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
      default:
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    }
  };

  const getSubscriptionTypeLabel = (type: string) => {
    switch (type) {
      case 'free':
        return 'Free Test';
      case 'bundle':
        return 'Bundle Access';
      default:
        return 'Individual Purchase';
    }
  };

  const getStartButtonContent = () => {
    if (loading) {
      return (
        <>
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
          Preparing Your Test...
        </>
      );
    }
    
    if (!hasAccess) {
      return (
        <>
          <Lock className="h-5 w-5 mr-2" />
          Purchase Required
        </>
      );
    }
    
    if (!canAttempt) {
      return (
        <>
          <Ban className="h-5 w-5 mr-2" />
          Attempts Exhausted
        </>
      );
    }
    
    return (
      <>
        <Play className="h-5 w-5 mr-2 transition-transform group-hover:scale-110" />
        Start Test Now
        <div className="absolute inset-0 bg-white/10 transform -skew-x-12 transition-all duration-500 group-hover:translate-x-full"></div>
      </>
    );
  };

  // Check authentication and redirect if needed
  useEffect(() => {
    if (isLoaded && !user) {
      toast.error("Please sign in to access mock tests");
      router.push("/sign-in");
    }
  }, [isLoaded, user, router]);

  // Fetch mock details and access control
  useEffect(() => {
    if (!isLoaded) return;
    
    const fetchMock = async () => {
      try {
        const res = await fetch(`/api/mock/${id}`);
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error || "Failed to load mock");
        
        setMock(data.mock);
        setHasAccess(data.hasAccess);
        setAccessReason(data.reason || "");
        setSubscriptionType(data.subscriptionType || "");
        setAttemptCount(data.attemptCount || 0);
        setMaxAttempts(data.maxAttempts || 0);
        setAttemptsRemaining(data.attemptsRemaining || 0);
        setCanAttempt(data.canAttempt !== false);

        // Handle access control redirects
        if (!data.hasAccess) {
          const getMessageForReason = (reason: string) => {
            switch (reason) {
              case 'authentication_required':
                return "Please sign in to access this mock test.";
              case 'no_subscription':
                return "You need to purchase this mock test or a bundle containing it.";
              case 'user_not_found':
                return "User account not found. Please try signing in again.";
              default:
                return "You don't have access to this mock test.";
            }
          };

          const message = getMessageForReason(data.reason);
          toast.error(message);
          
          // Redirect based on reason
          if (data.reason === 'authentication_required' || data.reason === 'user_not_found') {
            setTimeout(() => router.push("/sign-in"), 2000);
          } else {
            // Redirect to mocks page after showing message
            setTimeout(() => router.push("/mocks"), 3000);
          }
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load mock test";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMock();
  }, [id, isLoaded, router]);

  // Start attempt
  const startAttempt = async () => {
    if (!user?.id) {
      toast.error("Please sign in to start the test");
      router.push("/sign-in");
      return;
    }

    if (!hasAccess) {
      toast.error("You need to purchase this mock test to attempt it");
      router.push("/mocks");
      return;
    }

    if (!canAttempt) {
      toast.error(`You have reached the maximum of ${maxAttempts} attempts for this test`);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/mock/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerkUserId: user.id,
          mockTestId: id,
        }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        // Handle specific error codes
        if (data.code === 'ACCESS_DENIED') {
          toast.error(data.error);
          router.push("/mocks");
          return;
        }
        throw new Error(data.error || "Failed to start attempt");
      }

      // Success - redirect to attempt page
      toast.success("Mock test started successfully!");
      router.push(`/mocks/${id}/attempt/${data.attempt.id}`);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to start mock test";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !mock) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-600 mx-auto mb-4"></div>
        <p className="text-lg font-medium text-slate-600 dark:text-slate-300">Loading test details...</p>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 p-4">
      <Card className="max-w-md border-red-200 bg-white dark:bg-slate-800 shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 bg-red-100 dark:bg-red-900/30 p-3 rounded-full">
            <AlertCircle className="h-12 w-12 text-red-500" />
          </div>
          <CardTitle className="text-red-700 dark:text-red-400">Error Loading Test</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 dark:text-red-300 text-center mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} className="w-full bg-red-600 hover:bg-red-700">
            Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
  
  if (!mock) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <Card className="max-w-md border-amber-200 bg-white dark:bg-slate-800 shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 bg-amber-100 dark:bg-amber-900/30 p-3 rounded-full">
            <AlertCircle className="h-12 w-12 text-amber-500" />
          </div>
          <CardTitle>Mock Not Found</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground mb-4">The requested mock test could not be found.</p>
          <Button onClick={() => router.push('/mocks')} className="w-full bg-amber-600 hover:bg-amber-700">
            Browse Available Tests
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const questionTypes = calculateQuestionTypes(mock.questions);
  const totalQuestions = mock.questions.length;
  const totalTime = mock.duration || Math.round(totalQuestions * 3); // Use actual duration or fallback

  return (
    <main className="min-h-screen  py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12 relative">
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-amber-400/10 rounded-full blur-3xl -z-10"></div>
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-400/10 rounded-full blur-3xl -z-10"></div>
          
          <Badge className="mb-4 bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700">
            {mock.difficulty} LEVEL
          </Badge>
          
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-amber-600 via-purple-600 to-amber-500 bg-clip-text text-transparent mb-4">
            {mock.title}
          </h1>
          
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            {mock.description || "Ready to challenge yourself? This comprehensive assessment will test your knowledge and skills."}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Test Overview */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-0 shadow-2xl bg-white dark:bg-slate-800 overflow-hidden">
              <div className="bg-gradient-to-r from-amber-500 to-purple-600 h-1 w-full"></div>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                    <BookOpen className="h-6 w-6 text-amber-600" />
                  </div>
                  Test Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-3">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Questions</p>
                      <p className="font-semibold text-lg">{totalQuestions}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg mr-3">
                      <Timer className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Duration</p>
                      <p className="font-semibold text-lg">{formatDuration(totalTime)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg mr-3">
                      <Target className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Difficulty</p>
                      <p className="font-semibold text-lg">{mock.difficulty}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg mr-3">
                      <Award className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Passing Score</p>
                      <p className="font-semibold text-lg">60%</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-3 flex items-center text-lg">
                    <Zap className="h-5 w-5 text-amber-600 mr-2" />
                    Question Type Distribution
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(questionTypes).map(([type, count]) => {
                      const percentage = Math.round((count / totalQuestions) * 100);
                      return (
                        <div key={type} className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{type}</span>
                            <span className="text-sm text-muted-foreground">{count} questions ({percentage}%)</span>
                          </div>
                          <Progress value={percentage} className="h-2 bg-slate-200 dark:bg-slate-700" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Instructions Card */}
            <Card className="border-0 shadow-2xl bg-white dark:bg-slate-800 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-600 h-1 w-full"></div>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Lightbulb className="h-6 w-6 text-blue-600" />
                  </div>
                  Test Instructions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-start space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium mb-1">Time Management</h4>
                      <p className="text-sm text-muted-foreground">You have {formatDuration(totalTime)} to complete all questions.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium mb-1">Answer Submission</h4>
                      <p className="text-sm text-muted-foreground">Review your answers before final submission.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                    <Star className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium mb-1">Scoring</h4>
                      <p className="text-sm text-muted-foreground">Different questions may have different point values.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium mb-1">Navigation</h4>
                      <p className="text-sm text-muted-foreground">You can flag questions and return to them later.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Start Test Card */}
          <div>
            <Card className="border-0 shadow-2xl bg-gradient-to-b from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 sticky top-6 overflow-hidden">
              <div className="bg-gradient-to-r from-amber-500 to-orange-600 h-1 w-full"></div>
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                    <Play className="h-6 w-6 text-amber-600" />
                  </div>
                  Ready to Begin?
                </CardTitle>
                <CardDescription className="text-base">
                  Start when you feel prepared
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                    <span className="font-medium">Questions</span>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                      {totalQuestions}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                    <span className="font-medium">Duration</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                      {formatDuration(totalTime)}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                    <span className="font-medium">Difficulty</span>
                    <Badge className={getDifficultyBadgeStyles(mock.difficulty)}>
                      {mock.difficulty}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                    <span className="font-medium">Attempts</span>
                    <Badge variant="outline" className={`${
                      canAttempt 
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" 
                        : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                    }`}>
                      {attemptCount}/{maxAttempts}
                    </Badge>
                  </div>
                </div>
                
                {/* Attempt limit warning */}
                {!canAttempt && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Ban className="h-5 w-5 text-red-500 mr-2" />
                      <span className="font-semibold text-red-700 dark:text-red-300">Attempts Exhausted</span>
                    </div>
                    <p className="text-sm text-red-600 dark:text-red-400">
                      You have used all {maxAttempts} attempts for this {mock.price > 0 ? 'paid' : 'free'} test.
                    </p>
                  </div>
                )}
                
                {canAttempt && attemptsRemaining <= 2 && attemptsRemaining > 0 && (
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <div className="flex items-center mb-2">
                      <AlertCircle className="h-5 w-5 text-amber-500 mr-2" />
                      <span className="font-semibold text-amber-700 dark:text-amber-300">Limited Attempts</span>
                    </div>
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                      You have {attemptsRemaining} attempt{attemptsRemaining > 1 ? 's' : ''} remaining.
                    </p>
                  </div>
                )}
                
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                  <h4 className="font-medium mb-3 flex items-center">
                    <BarChart3 className="h-4 w-4 mr-2 text-amber-600" />
                    Question Breakdown
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(questionTypes).map(([type, count]) => (
                      <div key={type} className="flex justify-between items-center text-sm p-2 hover:bg-slate-100 dark:hover:bg-slate-700/30 rounded-md">
                        <span className="flex items-center">
                          <ChevronRight className="h-3 w-3 mr-1 text-amber-500" />
                          {type}
                        </span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                {/* Access Control Information */}
                {!hasAccess && mock.price > 0 && (
                  <div className="w-full p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Lock className="h-5 w-5 text-red-500 mr-2" />
                      <span className="font-semibold text-red-700 dark:text-red-300">Access Required</span>
                    </div>
                    <p className="text-sm text-red-600 dark:text-red-400 mb-3">
                      {accessReason === 'no_subscription' 
                        ? "You need to purchase this mock test or a bundle containing it to start attempting."
                        : "You don't have access to this mock test. Please purchase to continue."
                      }
                    </p>
                    <div className="flex space-x-2">
                      <Button 
                        onClick={() => router.push("/mocks")} 
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <ShoppingCart className="h-4 w-4 mr-1" />
                        Purchase Test
                      </Button>
                      <Button 
                        onClick={() => router.push("/mockBundles")} 
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        View Bundles
                      </Button>
                    </div>
                  </div>
                )}

                {/* Access Status Badge */}
                {hasAccess && (
                  <div className="w-full p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      <span className="font-semibold text-green-700 dark:text-green-300">
                        Access Granted
                      </span>
                      {subscriptionType && (
                        <Badge variant="outline" className="ml-2 text-xs bg-green-100 dark:bg-green-900/30">
                          {getSubscriptionTypeLabel(subscriptionType)}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                      You can start this mock test now!
                    </p>
                  </div>
                )}

                {/* Start Test Button */}
                <Button 
                  onClick={startAttempt} 
                  disabled={loading || !hasAccess || !canAttempt}
                  className={`w-full py-6 text-white font-medium text-lg relative overflow-hidden group ${
                    hasAccess && canAttempt
                      ? "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700" 
                      : "bg-gray-400 cursor-not-allowed"
                  }`}
                  size="lg"
                >
                  {getStartButtonContent()}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}