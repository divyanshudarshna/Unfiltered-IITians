"use client";

import { useState, useMemo } from "react";
import { UserWelcome } from "./UserWelcome";
import { ProfileCard } from "./ProfileCard";
import { SubscriptionCard } from "./SubscriptionCard";
import { QuickActions } from "./QuickActions";
import { UpcomingSessions } from "./UpcomingSessions";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

export default function DashboardClient({
  safeUser,
  initialProfile,
  subscription = [],
}) {
  const [profile, setProfile] = useState(initialProfile);

  // Merge DB profile (priority) + Clerk user (fallbacks)
  const mergedProfile = {
    ...profile,
    email: profile?.email || safeUser.email,
    name: profile?.name || `${safeUser.fullName}`.trim() || null,
    profileImageUrl:
      profile?.profileImageUrl?.trim() ||
      safeUser.imageUrl ||
      "/default-avatar.png",
    createdAt: profile?.createdAt || safeUser.createdAt,
    clerkImageUrl: safeUser.imageUrl,
  };

  
  // Mock data: Replace with server-provided performance data
  const performance = {
    averageScore: 78, // percentage
    totalMocks: 10,
    attemptedMocks: 8,
  };

  // Prepare chart data
  const chartData = useMemo(
    () => [
      { name: "Scored", value: performance.averageScore },
      { name: "Remaining", value: 100 - performance.averageScore },
    ],
    [performance]
  );

  const COLORS = ["#4ade80", "#e5e7eb"]; // green & gray


  return (
    <main className="p-6 md:p-10 bg-background min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-10">
          Student Dashboard
        </h1>

        <UserWelcome user={mergedProfile} />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <ProfileCard user={mergedProfile} onProfileUpdate={setProfile} />

          <SubscriptionCard subscriptions={subscription} />

          {/* 🔹 Mini Performance Card */}
          <Card className="flex flex-col items-center justify-center">
            <CardHeader>
              <CardTitle>Performance Overview</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="w-32 h-32">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      innerRadius={40}
                      outerRadius={60}
                      startAngle={90}
                      endAngle={-270}
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-4 text-lg font-semibold">
                {performance.averageScore}% Avg Score
              </p>
              <p className="text-sm text-muted-foreground">
                {performance.attemptedMocks} of {performance.totalMocks} mocks attempted
              </p>
           {/* ✅ This will always use the correct username */}
          <Link href={`/${encodeURIComponent(safeUser.firstName)}/performance`}>
            <Button className="mt-4 w-full">View Full Performance</Button>
          </Link>
            </CardContent>
          </Card>

          <QuickActions />
          <UpcomingSessions />
        </div>
      </div>
    </main>
  );
}
