"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
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
} from "recharts";

function getRemarks(percentage) {
  if (percentage >= 60) return { text: "Good", color: "bg-green-200 text-green-800" };
  if (percentage >= 40) return { text: "Average", color: "bg-yellow-200 text-yellow-800" };
  return { text: "Needs Improvement", color: "bg-red-200 text-red-800" };
}

function formatDate(dateString) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PerformanceDashboardClient({
  safeUser,
  performance,
  subscriptions,
}) {
  const COLORS = ["#4ade80", "#f87171"];

  const pieData = [
    { name: "Average Score", value: performance.avgScore },
    { name: "Remaining to 100%", value: 100 - performance.avgScore },
  ];

  const detailedAttempts = performance.detailedAttempts ?? [];

  // For the line chart, map attempts with attempt index and score
  const lineData = detailedAttempts.map((attempt, idx) => ({
    name: `Attempt ${idx + 1}`,
    Score: attempt.score,
    Percentage: attempt.percentage,
  }));

  return (
  <main className="p-6 md:p-10 bg-background min-h-screen">
    <div className="max-w-7xl mx-auto space-y-10">
      <h1 className="text-3xl md:text-4xl font-bold text-center mb-6">
        Performance Dashboard
      </h1>

      {/* Average Score Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Average Score</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                innerRadius={70}
                outerRadius={100}
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
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Line Chart for Score Trends */}
      {detailedAttempts.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Score & Percentage Over Attempts</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={lineData} margin={{ top: 5, bottom: 5 }}>
                <XAxis dataKey="name" />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                  allowDecimals={false}
                />
                <Tooltip />
                <Legend verticalAlign="top" height={36} />
                <Line
                  type="monotone"
                  dataKey="Score"
                  stroke="#4ade80"
                  strokeWidth={3}
                  activeDot={{ r: 6 }}
                  name="Score"
                />
                <Line
                  type="monotone"
                  dataKey="Percentage"
                  stroke="#f87171"
                  strokeWidth={3}
                  name="Percentage"
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Detailed Attempts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {detailedAttempts.length === 0 && (
          <p className="text-center text-muted-foreground">No attempts yet.</p>
        )}
        {detailedAttempts.length > 0 &&
          detailedAttempts.map((attempt) => {
            const remark = getRemarks(attempt.percentage);
            return (
              <Card
                key={attempt.id}
                className="flex flex-col justify-between 
                  hover:shadow-lg hover:scale-[1.03] transition-transform duration-300 cursor-pointer
                  border border-gray-200 dark:border-gray-700 rounded-lg
                  bg-white dark:bg-gray-900
                  font-sans"
                title={`Last Attempt: ${formatDate(attempt.lastAttemptDate ?? attempt.submittedAt)}`}
              >
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {attempt.mockTestTitle}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-3 items-center">
                    <span
                      className={`inline-block px-4 py-1 rounded-full text-sm font-semibold 
                        ${remark.color} 
                        border border-current`}
                      style={{
                        borderColor: remark.color.includes("green")
                          ? "#22c55e"
                          : remark.color.includes("yellow")
                          ? "#eab308"
                          : "#ef4444",
                      }}
                    >
                      {remark.text}
                    </span>

                    <span className="text-sm italic text-gray-500 dark:text-gray-400 select-none">
                      Last Attempt:{" "}
                      {formatDate(attempt.lastAttemptDate ?? attempt.submittedAt)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-gray-800 dark:text-gray-300">
                    <div>
                      <strong className="block mb-1 text-gray-700 dark:text-gray-300">
                        Score
                      </strong>
                      <span className="text-lg font-medium">
                        {attempt.score} / {attempt.totalQuestions}
                      </span>
                    </div>

                    <div>
                      <strong className="block mb-1 text-gray-700 dark:text-gray-300">
                        Percentage
                      </strong>
                      <span
                        className={`inline-block px-3 py-1 rounded-full font-semibold text-white
                          ${
                            attempt.percentage >= 60
                              ? "bg-green-600"
                              : attempt.percentage >= 40
                              ? "bg-yellow-500"
                              : "bg-red-600"
                          }
                          text-center text-lg select-none`}
                        style={{ minWidth: "60px" }}
                      >
                        {attempt.percentage}%
                      </span>
                    </div>

                    <div>
                      <strong className="block mb-1 text-gray-700 dark:text-gray-300">
                        Time Taken
                      </strong>
                      <span className="text-lg font-medium">
                        {Math.floor(attempt.timeTaken / 60)}m{" "}
                        {Math.round(attempt.timeTaken % 60)}s
                      </span>
                    </div>

                    <div>
                      <strong className="block mb-1 text-gray-700 dark:text-gray-300">
                        Estimated Rank
                      </strong>
                      <span className="text-lg font-medium">
                        {attempt.estimatedRank}
                      </span>
                    </div>

                    <div>
                      <strong className="block mb-1 text-gray-700 dark:text-gray-300">
                        Correct Answers
                      </strong>
                      <span className="text-lg font-medium text-green-600 dark:text-green-400">
                        {attempt.correctCount}
                      </span>
                    </div>

                    <div>
                      <strong className="block mb-1 text-gray-700 dark:text-gray-300">
                        Incorrect Answers
                      </strong>
                      <span className="text-lg font-medium text-red-600 dark:text-red-400">
                        {attempt.incorrectCount}
                      </span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Link href={`/mocks/${attempt.mockTestId}/start`} passHref>
                    <Button className="w-full" variant="secondary">
                      Attempt Again
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
      </div>

      {/* Call to Action */}
      <div className="flex justify-center mt-8">
        <Link href="/mocks">
          <Button size="lg" variant="default">
            Buy More Mocks
          </Button>
        </Link>
      </div>
    </div>
  </main>
)}
