"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import { use } from "react";
function formatDate(dateString: string | Date | null | undefined): string {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    return "-";
  }
}

function formatTime(seconds: number | undefined | null): string {
  if (!seconds || seconds <= 0) return "-";
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins > 0 ? `${mins}m ` : ""}${secs}s`;
}

export default function AttemptsList({
  attempts,
  mockTestTitle,
  mockTestId,
}: {
  attempts: any[];
  mockTestTitle: string;
  mockTestId: string;
}) {
  const router = useRouter();
  const {user}= useUser();
  const userSlug = user?.fullName
    ? user.fullName.split(" ")[0]// take first word of fullname
    : "me";
    

  return (
    <div className="space-y-6 p-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Test Results</h1>
          <p className="text-sm text-muted-foreground">{mockTestTitle}</p>
        </div>
      {/* Buttons Row */}
        <div className="flex items-center gap-2">
          {/* Back to Performance */}
          <Button
            asChild
            variant="outline"
            className="border-primary/30 hover:border-primary/50"
          >
            <Link href={`/${userSlug}/performance`} className="font-medium">
              ← Back
            </Link>
          </Button>

          {/* New Attempt */}
          <Button
            asChild
            variant="outline"
            className="border-primary/30 hover:border-primary/50"
          >
            <Link href={`/mocks/${mockTestId}/start`} className="font-medium">
              + New Attempt
            </Link>
          </Button>
        </div>
      </div>

      {/* Attempts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {attempts.map((attempt, index) => {
          const {
            id,
            totalQuestions = 0,
            correctCount = 0,
            score = 0,
            percentage = 0,
            timeTaken = 0,
            submittedAt,
          } = attempt;

          const performanceColor = percentage >= 70 
            ? "from-green-500/10 to-green-500/5" 
            : percentage >= 40 
            ? "from-yellow-500/10 to-yellow-500/5" 
            : "from-red-500/10 to-red-500/5";

          return (
            <Card
              key={id}
              className={cn(
                "group transition-all duration-200 hover:shadow-md",
                "border border-border/50 hover:border-primary/40",
                "bg-gradient-to-br from-background via-background to-muted/10",
                performanceColor,
                "h-full flex flex-col"
              )}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base font-semibold">
                    <span className="text-muted-foreground">Attempt </span>
                    <span className="text-foreground">#{index + 1}</span>
                  </CardTitle>
                  <div className={cn(
                    "px-2 py-1 rounded-md text-sm font-bold",
                    percentage >= 70 ? "bg-green-500/10 text-green-600 dark:text-green-400" :
                    percentage >= 40 ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400" :
                    "bg-red-500/10 text-red-600 dark:text-red-400"
                  )}>
                    {percentage}%
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDate(submittedAt)}
                </p>
              </CardHeader>

              <CardContent className="py-2 flex-1">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <StatItem label="Score" value={`${score}/${totalQuestions}`} />
                    <StatItem label="Time" value={formatTime(timeTaken)} />
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Correct: {correctCount}</span>
                      <span>Incorrect: {totalQuestions - correctCount}</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          percentage >= 70 ? "bg-green-500" :
                          percentage >= 40 ? "bg-yellow-500" :
                          "bg-red-500"
                        )}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-2">
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="w-full text-primary hover:text-primary-foreground hover:bg-primary/90 border border-border/50 hover:border-primary/80 transition-colors"
                >
                  <Link href={`/mocks/${mockTestId}/result/${id}`}>
                    View Detailed Analysis
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Back Button */}
      <div className="flex justify-start pt-2">
        <Button
          variant="link"
          className="text-muted-foreground hover:text-primary px-0"
          onClick={() => router.back()}
        >
          ← Back to previous
        </Button>
      </div>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium text-sm">{value}</p>
    </div>
  );
}