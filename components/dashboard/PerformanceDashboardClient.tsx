"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  CartesianGrid,

 
} from "recharts";
import {
  Clock,
  BarChart2,
  Award,
  FileText,
  TrendingUp ,
  BookOpen,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

function getRemarks(percentage) {
  if (percentage >= 80)
    return {
      text: "Excellent",
      color:
        "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    };
  if (percentage >= 60)
    return {
      text: "Good",
      color:
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    };
  if (percentage >= 40)
    return {
      text: "Average",
      color:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    };
  return {
    text: "Needs Improvement",
    color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  };
}

function formatDate(dateString: string) {
  if (!dateString) return "-";
  const date = new Date(dateString);

  // Always use same locale (e.g., en-GB or en-US) and fixed options
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true, // ensures AM/PM consistency
  }).format(date);
}

function formatTime(seconds) {
  if (!seconds) return "0s";
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins > 0 ? `${mins}m ` : ""}${secs}s`;
}

export default function PerformanceDashboardClient({
  // safeUser,
  performance,
  // subscriptions,
  // attempts,

}) {
  // console.log('PerformanceDashboardClient - performance data:', performance);
  
  const COLORS = ["#10b981", "#ef4444", "#3b82f6", "#f59e0b", "#8b5cf6"];


  const pieData = [
    { name: "Correct", value: performance.totalCorrect ?? 0 },
    { name: "Incorrect", value: performance.totalIncorrect ?? 0 },
    {
      name: "Unanswered",
      value: Math.max(
        0,
        (performance.totalQuestions ?? 0) -
          ((performance.totalCorrect ?? 0) + (performance.totalIncorrect ?? 0))
      ),
    },
  ];



  const detailedAttempts = performance.detailedAttempts ?? [];

  // For the line chart, map attempts with attempt index and score
  const lineData = detailedAttempts.map((attempt, idx) => ({
    name: `#${idx + 1}`,
    Score: attempt.score,
    Percentage: attempt.percentage,
    Time: attempt.timeTaken / 60, // Convert to minutes
  }));

  // Group attempts by mock test
  const mockTestStats = detailedAttempts.reduce((acc, attempt) => {
    if (!acc[attempt.mockTestId]) {
      acc[attempt.mockTestId] = {
        mockTestId: attempt.mockTestId,
        mockTestTitle: attempt.mockTestTitle,
        attempts: [],
        bestScore: 0,
        bestPercentage: 0,
        avgTime: 0,
        totalAttempts: 0,
      };
    }

    acc[attempt.mockTestId].attempts.push(attempt);
    acc[attempt.mockTestId].bestScore = Math.max(
      acc[attempt.mockTestId].bestScore,
      attempt.score
    );
    acc[attempt.mockTestId].bestPercentage = Math.max(
      acc[attempt.mockTestId].bestPercentage,
      attempt.percentage
    );
    acc[attempt.mockTestId].avgTime =
      (acc[attempt.mockTestId].avgTime * acc[attempt.mockTestId].totalAttempts +
        attempt.timeTaken) /
      (acc[attempt.mockTestId].totalAttempts + 1);
    acc[attempt.mockTestId].totalAttempts += 1;

    return acc;
  }, {});



  const mockTestData = Object.values(mockTestStats).map((mock) => ({
    ...mock,
    avgTime: mock.avgTime / mock.attempts.length,
  }));


  const chartData = mockTestData.map((test) => ({
  name: test.mockTestTitle ?? "Unknown Test", // ✅ use correct property
  score: test.bestPercentage,
  avgTime: test.avgTime, // already averaged in minutes
}));

  
  // Radar chart data for comparing performance across different mocks
  // const radarData = mockTestData.map((mock) => ({
  //   subject: mock.mockTestTitle,
  //   "Best Score": mock.bestScore,
  //   "Avg Time": Math.min(60, mock.avgTime / 60), // Cap at 60 mins for radar chart
  // }));



  function getLastAttemptDate(attempts: any[]) {
  if (!attempts || attempts.length === 0) return "No attempts yet";
  
  const latestAttempt = attempts[0];
  const dateToFormat = latestAttempt.submittedAt || 
                      latestAttempt.createdAt || 
                      new Date().toISOString();
  
  return formatDate(dateToFormat);
}

  return (
    <main className="p-4 md:p-8 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        
          <div>
              
       
       <h1 className="flex items-center gap-3 text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
    
       <BarChart2 className="w-10 h-10 text-blue-600 font-extrabold mb-2" /> 
         <span> Performance Dashboard </span>
    </h1>
            <p className="text-muted-foreground mt-2">
              Track your progress and improve your test-taking skills
            </p>
          </div>
          <div className="flex gap-3">
            <Button asChild variant="outline">
              <Link href="/mocks">Browse Mocks</Link>
            </Button>
            <Button asChild>
              <Link href="/mocks">Take New Test</Link>
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Attempts
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {performance.totalAttempts}
              </div>
              <p className="text-xs text-muted-foreground">
                Across all mock tests
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Average Score
              </CardTitle>
              <BarChart2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
             <div className="text-2xl font-bold">
  {performance.totalQuestions > 0
    ? ((performance.totalCorrect / performance.totalQuestions) * 100).toFixed(0) + "%"
    : "0%"}
</div>
              <p className="text-xs text-muted-foreground">
                {performance.totalCorrect} correct out of{" "}
                {performance.totalQuestions}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Time Spent
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatTime(performance.totalTime)}
              </div>
              <p className="text-xs text-muted-foreground">
                Across all attempts
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Estimated Rank
              </CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                #{performance.estimatedRank}
              </div>
              <p className="text-xs text-muted-foreground">
                Based on your performance
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance Distribution Pie Chart */}
          <Card className="hover:shadow-lg transition-all">
            <CardHeader>
              <CardTitle>Answer Distribution</CardTitle>
              <CardDescription>Breakdown of all your answers</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%" minHeight={300}>
  {pieData.some(item => item.value > 0) ? (
    <PieChart>
      <Pie
        data={pieData.filter(item => item.value > 0)} // Only show non-zero values
        cx="50%"
        cy="50%"
        labelLine={false}
        outerRadius={80}
        innerRadius={40}
        paddingAngle={5}
        dataKey="value"
        label={({ name, percent }) => 
          `${name}: ${(percent * 100).toFixed(0)}%`
        }
      >
        {pieData.map((entry, index) => (
          <Cell 
            key={`cell-${index}`} 
            fill={COLORS[index % COLORS.length]} 
          />
        ))}
      </Pie>
      <Tooltip
        formatter={(value) => [`${value} answers`, ""]}
      />
      <Legend />
    </PieChart>
  ) : (
    <div className="flex items-center justify-center h-full">
      <p className="text-muted-foreground">No data available</p>
    </div>
  )}
</ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Progress Over Time Line Chart */}
          <Card className="hover:shadow-lg transition-all">
            <CardHeader>
              <CardTitle>Progress Over Time</CardTitle>
              <CardDescription>
                Your performance across attempts
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData}>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    tickMargin={10}
                  />
                  <YAxis
                    yAxisId="left"
                    orientation="left"
                    domain={[0, "dataMax + 10"]}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[0, "dataMax + 5"]}
                    tickFormatter={(value) => `${value}m`}
                  />
                  <Tooltip
                    formatter={(value, name) => {
                      if (name === "Time")
                        return [`${value.toFixed(1)} mins`, "Time Taken"];
                      if (name === "Percentage")
                        return [`${value}%`, "Percentage"];
                      return [value, "Score"];
                    }}
                    labelFormatter={(attempt) => `Attempt ${attempt}`}
                  />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="Percentage"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    activeDot={{ r: 6 }}
                    name="Percentage"
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="Score"
                    stroke="#10b981"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Score"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="Time"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    name="Time (mins)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
{mockTestData.length > 1 && (
  <Card className="hover:shadow-lg transition-all">
    <CardHeader>
      <CardTitle>Mock Test Comparison</CardTitle>
      <CardDescription>
        Compare your best scores across different mock tests
      </CardDescription>
    </CardHeader>

    <CardContent className="h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
          <XAxis dataKey="name" />
          <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
          <Tooltip
            formatter={(value: number, name: string) => {
              if (name === "score") return [`${value}%`, "Best Score"];
              if (name === "avgTime") return [`${value.toFixed(1)} mins`, "Avg Time"];
              return value;
            }}
          />
          <Legend />

          <Bar
            dataKey="score"
            name="Best Score"
            radius={[8, 8, 0, 0]}
            animationDuration={800}
          >
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>
)}

        {/* Mock Test Cards */}
        <div className="space-y-4">
        <h2 className="flex items-center text-2xl font-bold text-amber-600 py-4 gap-2">
  <FileText className="w-6 h-6 text-amber-500" />
  Your Attempted Mock Tests
</h2>
          {detailedAttempts.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="hover:shadow-lg transition-all">
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <div className="grid grid-cols-2 gap-4">
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-10 w-full" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockTestData.map((mock) => {
                const latestAttempt = mock.attempts[0];
                const remark = getRemarks(mock.bestPercentage);

                return (
                  <Card
                    key={mock.mockTestId}
                    className="hover:shadow-lg transition-all border border-gray-200 dark:border-gray-700 group hover:border-primary/30 hover:dark:border-primary/50 relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <CardHeader>
                      <div className="flex justify-between items-start gap-2">
                        <CardTitle className="text-lg font-semibold line-clamp-2 flex-1">
                          {mock.mockTestTitle}
                        </CardTitle>
                        {/* <span className="text-sm text-muted-foreground">{}</span>                       */}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={remark.color}>
                          {remark.text}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {mock.totalAttempts} attempt
                          {mock.totalAttempts !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">
                            Best Score
                          </p>
                          <p className="text-xl font-semibold">
                            {mock.bestScore}{" "}
                            <span className="text-sm font-normal text-muted-foreground">
                              / {latestAttempt.totalQuestions}
                            </span>
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">
                            Best %
                          </p>
                          <p className="text-xl font-semibold text-primary">
                            {mock.bestPercentage}%
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">
                            Avg Time
                          </p>
                          <p className="text-xl font-semibold">
                            {formatTime(mock.avgTime)}
                          </p>
                        </div>
                    <div className="space-y-1">
  <p className="text-sm text-muted-foreground">
    Last Attempt
  </p>
  <p className="text-sm">
   {getLastAttemptDate(mock.attempts)}
  </p>
</div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex gap-2 relative z-10">
                      {/* Retake Button */}
                      <Button
                        asChild
                        variant="outline"
                        className="flex-1"
                        onClick={(e) => {
                          e.preventDefault();
                          window.location.href = `/mocks/${mock.mockTestId}/start`;
                        }}
                      >
                        <Link href={`/mocks/${mock.mockTestId}/start`} passHref>
                          Retake
                        </Link>
                      </Button>

                      {/* Details Button */}
                      <Button asChild className="flex-1">
                        {mock.totalAttempts > 1 ? (
                          <Link href={`/mocks/${mock.mockTestId}/attempts`}>
                            View All Attempts
                          </Link>
                        ) : (
                          <Link
                            href={`/mocks/${mock.mockTestId}/result/${latestAttempt.id}`}
                          >
                            View Details
                          </Link>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
