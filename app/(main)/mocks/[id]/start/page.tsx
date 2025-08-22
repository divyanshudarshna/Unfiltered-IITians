"use client";

import { use, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, FileText, AlertCircle, CheckCircle, BookOpen, Target, Award, Zap, Brain, Calendar, BarChart3 } from "lucide-react";

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
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
    </div>
  );
  
  if (error) return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="max-w-md border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
        <CardHeader className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <CardTitle className="text-red-700 dark:text-red-400">Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 dark:text-red-300 text-center">{error}</p>
        </CardContent>
      </Card>
    </div>
  );
  
  if (!mock) return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="max-w-md">
        <CardHeader className="text-center">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <CardTitle>Mock Not Found</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">The requested mock test could not be found.</p>
        </CardContent>
      </Card>
    </div>
  );

  const questionTypes = calculateQuestionTypes(mock.questions);
  const totalQuestions = mock.questions.length;
  const totalTime = Math.round(totalQuestions * 3); // 3 minutes per question

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-amber-600 to-purple-600 bg-clip-text text-transparent mb-4">
            {mock.title}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {mock.description || "Get ready to test your knowledge with this comprehensive assessment."}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Test Overview */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-0 shadow-lg bg-white dark:bg-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-amber-600" />
                  Test Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
                    <FileText className="h-5 w-5 text-amber-600 mr-2" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Questions</p>
                      <p className="font-semibold">{totalQuestions}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
                    <Clock className="h-5 w-5 text-amber-600 mr-2" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Time</p>
                      <p className="font-semibold">{totalTime} minutes</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
                    <Target className="h-5 w-5 text-amber-600 mr-2" />
                    <div>
                      <p className="text-sm text-muted-foreground">Difficulty</p>
                      <p className="font-semibold">{mock.difficulty}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
                    <Award className="h-5 w-5 text-amber-600 mr-2" />
                    <div>
                      <p className="text-sm text-muted-foreground">Passing Score</p>
                      <p className="font-semibold">60%</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2 flex items-center">
                    <Zap className="h-4 w-4 text-amber-600 mr-2" />
                    Question Types
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(questionTypes).map(([type, count]) => (
                      <Badge key={type} variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-700">
                        {type}: {count}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Instructions Card */}
            <Card className="border-0 shadow-lg bg-white dark:bg-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  Instructions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <ul className="space-y-2 list-disc list-inside text-sm">
                  <li>This test contains {totalQuestions} questions with a time limit of {totalTime} minutes.</li>
                  <li>Each question may have different point values based on difficulty.</li>
                  <li>For MCQ questions, select one correct answer.</li>
                  <li>For MSQ questions, select all correct answers.</li>
                  <li>You can navigate between questions and flag them for review.</li>
                  <li>Once submitted, you cannot change your answers.</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Start Test Card */}
          <div>
            <Card className="border-0 shadow-lg bg-gradient-to-b from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/30 sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-amber-600" />
                  Ready to Start?
                </CardTitle>
                <CardDescription>
                  Begin your assessment when you're ready
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Questions</span>
                    <span className="text-sm font-medium">{totalQuestions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Time</span>
                    <span className="text-sm font-medium">{totalTime} minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Difficulty</span>
                    <Badge className={
                      mock.difficulty === "EASY" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" :
                      mock.difficulty === "MEDIUM" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" :
                      "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                    }>
                      {mock.difficulty}
                    </Badge>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Question Types</h4>
                  <div className="space-y-1">
                    {Object.entries(questionTypes).map(([type, count]) => (
                      <div key={type} className="flex justify-between text-sm">
                        <span>{type}</span>
                        <span>{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={startAttempt} 
                  disabled={loading}
                  className="w-full bg-amber-600 hover:bg-amber-700 py-3 text-white font-medium relative overflow-hidden group"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Starting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2 transition-transform group-hover:scale-110" />
                      Start Test Now
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