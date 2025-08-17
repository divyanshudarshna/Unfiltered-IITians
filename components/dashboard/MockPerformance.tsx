// components/dashboard/MockPerformance.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { BarChart2, CheckCircle, CalendarDays, ArrowRight } from "lucide-react";
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

interface MockPerformanceProps {
  averageScore: number;
  attemptedMocks: number;
  totalMocks: number;
  lastAttemptDate: Date | null;
  username: string;
}

export function MockPerformance({
  averageScore,
  attemptedMocks,
  totalMocks,
  lastAttemptDate,
  username,
}: MockPerformanceProps) {
  const chartData = [
    { name: "Completed", value: attemptedMocks },
    { name: "Remaining", value: totalMocks - attemptedMocks },
  ];

  const formatDate = (date: Date | null) => {
    if (!date) return "Not attempted yet";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Dynamic text for attempted mocks
  const attemptedText =
    attemptedMocks > totalMocks
      ? `${attemptedMocks} mocks attempted`
      : `${attemptedMocks} of ${totalMocks} mocks attempted`;

  return (
    <Card className="flex flex-col items-center justify-center h-full group hover:shadow-md transition-shadow duration-200">
  <CardHeader className="pb-2 w-full px-4">
    <CardTitle className="text-lg font-semibold text-center whitespace-nowrap">
      <span className="relative inline-block">
        <BarChart2 className="w-4 h-4 inline mr-2 text-primary" />
        Performance Overview
        <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-primary/30 group-hover:bg-primary/50 transition-all duration-300"></span>
      </span>
    </CardTitle>
  </CardHeader>
  
  <CardContent className="flex flex-col items-center w-full px-4">
    {/* Donut chart with centered percentage */}
    <div className="relative w-40 h-40 flex items-center justify-center mb-2">
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            innerRadius={55}
            outerRadius={70}
            startAngle={90}
            endAngle={-270}
            stroke="none"
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
                className="group-hover:opacity-90 transition-opacity duration-200"
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      
      <div className="absolute inset-0 flex items-center justify-center flex-col">
        <span className="text-2xl font-bold text-foreground">
          {averageScore.toFixed(0)}%
        </span>
        <span className="text-xs text-muted-foreground mt-1">Average</span>
      </div>
    </div>

    {/* Stats row */}
    <div className="flex items-center justify-between w-full mt-2 px-2">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 bg-secondary/10 px-3 py-1 rounded-full">
          <CheckCircle className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-medium text-blue-500">
            {attemptedText}
          </span>
        </div>
      </div>
      
      <div className="flex items-center gap-1 text-muted-foreground">
        <CalendarDays className="w-4 h-4" />
        <span className="text-xs">
          {lastAttemptDate ? formatDate(lastAttemptDate) : 'N/A'}
        </span>
      </div>
    </div>

    {/* Button with icon and hover effect */}
    <Link href={`/${encodeURIComponent(username)}/performance`} className="w-full mt-4">
      <Button
        variant="outline"
        className="w-full border-primary/30 hover:border-primary/50 hover:bg-primary/10 transition-all group/button"
      >
        <span className="flex items-center justify-center gap-2">
          <span>View Full Performance</span>
          <ArrowRight className="w-4 h-4 opacity-0 group-hover/button:opacity-100 translate-x-[-5px] group-hover/button:translate-x-0 transition-all duration-200" />
        </span>
      </Button>
    </Link>
  </CardContent>
</Card>
  );
}
