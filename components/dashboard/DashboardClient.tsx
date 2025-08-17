"use client";

import { useState,useMemo } from "react";
import { UserWelcome } from "./UserWelcome";
import { ProfileCard } from "./ProfileCard";
import { SubscriptionCard } from "./SubscriptionCard";
import { QuickActions } from "./QuickActions";
import { UpcomingSessions } from "./UpcomingSessions";
import { MockPerformance } from "./MockPerformance";

interface DashboardClientProps {
  safeUser: {
    id: string;
    firstName: string;
    fullName: string;
    email: string;
    username: string;
    imageUrl: string;
    createdAt: Date;
  };
  initialProfile: any;
  subscription?: any[];
  averageScore: number;
  attemptedMocks: number;
  totalMocks: number;
  lastAttemptDate: Date | null;
}

export default function DashboardClient({
  safeUser,
  initialProfile,
  subscription = [],
  averageScore,
  attemptedMocks,
  totalMocks,
  lastAttemptDate,
}: DashboardClientProps) {
  const [profile, setProfile] = useState(initialProfile);

  // Merge DB profile (priority) + Clerk user (fallbacks)
  const mergedProfile = useMemo(() => ({
    ...profile,
    email: profile?.email || safeUser.email,
    name: profile?.name || `${safeUser.fullName}`.trim() || null,
    profileImageUrl:
      profile?.profileImageUrl?.trim() ||
      safeUser.imageUrl ||
      "/default-avatar.png",
    createdAt: profile?.createdAt || safeUser.createdAt,
    clerkImageUrl: safeUser.imageUrl,
  }), [profile, safeUser]);

  return (
    <main className="p-6 md:p-10 bg-background min-h-screen">
      <div className="max-w-7xl mx-auto">
    <h1 className="text-3xl md:text-4xl font-bold text-center mb-10 bg-gradient-to-r from-indigo-800 via-purple-700 to-pink-800 bg-clip-text text-transparent drop-shadow-lg">
  Student Dashboard
</h1>



        <UserWelcome user={mergedProfile} />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <ProfileCard user={mergedProfile} onProfileUpdate={setProfile} />

          <SubscriptionCard subscriptions={subscription} />

          {/* Performance Card with server-calculated metrics */}
          <MockPerformance
            averageScore={averageScore}
            attemptedMocks={attemptedMocks}
            totalMocks={totalMocks}
            lastAttemptDate={lastAttemptDate}
            username={safeUser.firstName}
          />

          <QuickActions />
          <UpcomingSessions />
        </div>
      </div>
    </main>
  );
}