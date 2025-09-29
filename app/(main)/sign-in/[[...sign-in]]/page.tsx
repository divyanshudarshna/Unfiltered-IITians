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
    <main className="min-h-screen flex items-center justify-center">
      <SignIn />
    </main>
  );
}
