"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RedirectingPage() {
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      // Use Clerk firstName for consistent routing
      const firstName = user.firstName || "user";
      const encodedName = encodeURIComponent(firstName.trim());

      router.replace(`/${encodedName}/dashboard`);
    }
  }, [user, router]);

  return (
    <main className="flex items-center justify-center min-h-screen 
      bg-gradient-to-br from-gray-100 via-gray-200 to-white 
      dark:from-slate-900 dark:via-gray-900 dark:to-black">
      
      <div className="flex flex-col items-center gap-4 text-gray-800 dark:text-white animate-fadeIn">
        {/* Spinner */}
        <div className="w-12 h-12 border-4 border-gray-400/30 border-t-gray-800 dark:border-white/30 dark:border-t-white rounded-full animate-spin"></div>

        {/* Redirecting text */}
        <p className="text-2xl font-semibold bg-clip-text text-transparent 
          bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 
          dark:from-pink-400 dark:via-yellow-300 dark:to-green-400 animate-pulse">
          Redirecting to your dashboard...
        </p>
      </div>
    </main>
  );
}
