"use client";
import { SignIn, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      // take first word of fullName (fallback to "user" if null)
      const firstName = user.fullName?.split(" ")[0] || "user";
      router.push(`/${firstName}/dashboard`);
    }
  }, [user, router]);

  return (
    <main className="min-h-screen flex items-center justify-center  p-6">
      <div className="w-full  rounded-2xl shadow-xl p-6 flex flex-col items-center">
          {/* Custom Title */}
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 mb-2 text-center">
          Login to{" "}
          <span className="text-violet-600">Divyanshudarshna.com</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8 text-center text-sm md:text-base">
          Securely sign in to access your personalized dashboard
        </p>
        {/* Clerk SignIn Component */}
        <SignIn appearance={{ elements: { card: "shadow-none" } }} />
      </div>
    </main>
  );
}
