"use client";

import { useState, useMemo } from "react";
import { UserWelcome } from "./UserWelcome";
import { ProfileCard } from "./ProfileCard";
import { QuickActions } from "./QuickActions";
import { UpcomingSessions } from "./UpcomingSessions";
import { MockPerformance } from "./MockPerformance";
import { ActiveItems } from "./ActiveItems";

interface DashboardClientProps {
  readonly safeUser: {
    id: string;
    firstName: string;
    fullName: string;
    email: string;
    username: string;
    imageUrl: string;
    createdAt: Date;
  };
  readonly initialProfile: Record<string, unknown>;
  readonly averageScore: number;
  readonly attemptedMocks: number;
  readonly totalMocks: number;
  readonly lastAttemptDate: Date | null;
}

export default function DashboardClient({
  safeUser,
  initialProfile,
  averageScore,
  attemptedMocks,
  totalMocks,
  lastAttemptDate,
}: DashboardClientProps) {
  const [profile, setProfile] = useState(initialProfile);

  // Merge DB profile (priority) + Clerk user (fallbacks)
  const mergedProfile = useMemo(() => ({
    ...profile,
    email: (profile?.email as string) || safeUser.email,
    name: (profile?.name as string) || `${safeUser.fullName}`.trim() || null,
    profileImageUrl:
      (typeof profile?.profileImageUrl === 'string' ? profile.profileImageUrl.trim() : '') ||
      safeUser.imageUrl ||
      "/default-avatar.png",
    createdAt: (profile?.createdAt as Date) || safeUser.createdAt,
    clerkImageUrl: safeUser.imageUrl,
    clerkUserId: (profile?.clerkUserId as string) || safeUser.id,
  }), [profile, safeUser]);

  // Handle profile updates - update local state and refresh global context
  const handleProfileUpdate = async (updatedUser: unknown) => {
    console.log('🔄 Dashboard received profile update:', updatedUser);
    
    // Update local state immediately for dashboard UI
    setProfile(updatedUser as Record<string, unknown>);
    
    console.log('✅ Local dashboard state updated');
  };

  return (
    <main className="p-6 md:p-10  min-h-screen">
      <div className="max-w-7xl mx-auto">
    <h1 className="text-3xl md:text-4xl font-bold text-center mb-10 bg-gradient-to-r from-indigo-800 via-purple-700 to-pink-800 bg-clip-text text-transparent drop-shadow-lg">
  Student Dashboard
</h1>



        <UserWelcome user={mergedProfile} />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <ProfileCard user={mergedProfile} onProfileUpdate={handleProfileUpdate} />

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

        {/* Full-width Active Items Section */}
        <div className="mt-8">
          <ActiveItems />
        </div>
      </div>
    </main>
  );
}