"use client";

import { use, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, FileText, AlertCircle, CheckCircle, BookOpen, Target, Award, Zap, Brain, Calendar, BarChart3, Play, Star, Shield, Timer, Lightbulb, ChevronRight } from "lucide-react";

export default function StartMockPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [mock, setMock] = useState<any>(null);
  const [error, setError] = useState("");

  // Calculate question types
  const calculateQuestionTypes = (questions: any[]) => {
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

  // Fetch mock details
  useEffect(() => {
    const fetchMock = async () => {
      try {
        const res = await fetch(`/api/mock/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load mock");
        setMock(data.mock);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchMock();
  }, [id]);

  // Start attempt
  const startAttempt = async () => {
    if (!user?.id) {
      setError("You must be logged in to start the test");
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
      if (!res.ok) throw new Error(data.error || "Failed to start attempt");

      router.push(`/mocks/${id}/attempt/${data.attempt.id}`);
    } catch (err: any) {
      setError(err.message);
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
                    <Badge className={
                      mock.difficulty === "EASY" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" :
                      mock.difficulty === "MEDIUM" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" :
                      "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                    }>
                      {mock.difficulty}
                    </Badge>
                  </div>
                </div>
                
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
              <CardFooter>
                <Button 
                  onClick={startAttempt} 
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 py-6 text-white font-medium text-lg relative overflow-hidden group"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Preparing Your Test...
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5 mr-2 transition-transform group-hover:scale-110" />
                      Start Test Now
                      <div className="absolute inset-0 bg-white/10 transform -skew-x-12 transition-all duration-500 group-hover:translate-x-full"></div>
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}