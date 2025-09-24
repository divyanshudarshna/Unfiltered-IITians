"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, IndianRupee } from "lucide-react";
import { useUser } from "@clerk/nextjs"; // ✅ Import Clerk hook

interface Session {
  id: string;
  title: string;
  description?: string;
  content?: string;
  price: number;
  discountedPrice?: number;
  maxEnrollment?: number | null;
  type: string;
  duration: number;
  expiryDate?: string;
  isEnrolled?: boolean; // ✅ from API
}

export default function GuidancePage() {
  const { user } = useUser(); // ✅ Get Clerk user
  const firstName = user?.firstName || "user"; // fallback if firstName not available
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchSessions() {
      try {
        const res = await fetch("/api/sessions", { cache: "no-store" });
        const data = await res.json();
        if (Array.isArray(data.sessions)) setSessions(data.sessions);
      } catch (err) {
        console.error("❌ Error fetching sessions:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSessions();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-muted-foreground">
        Loading sessions...
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold text-center mb-10">
        Available Sessions
      </h1>

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {sessions.map((session) => (
          <Card
            key={session.id}
            className="relative rounded-2xl border border-border shadow-lg hover:shadow-xl transition
                       bg-gradient-to-b from-background to-muted/20
                       dark:from-zinc-900 dark:to-zinc-800"
          >
            {/* Top-right badge */}
            <div className="absolute top-4 right-4">
              <Badge
                variant="secondary"
                className="px-3 py-1 rounded-full text-xs font-semibold"
              >
                {session.type === "ONE_ON_ONE" ? "1-on-1" : "Group"}
              </Badge>
            </div>

            <CardHeader>
              <CardTitle className="text-xl font-bold tracking-wide">
                {session.title}
              </CardTitle>
              <p className="text-sm text-zinc-400">{session.description}</p>
            </CardHeader>

            <CardContent>
              {/* Highlights */}
              <div className="mt-4 mb-4 text-sm font-semibold">
                What you'll get:
              </div>
              <ul className="space-y-2 text-sm text-zinc-300">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-400" /> Expert tips on syllabus coverage
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-400" /> Live Interaction based service
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-400" /> 1 + 1 session (30 minutes each)
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-400" /> SWOT analysis
                </li>
              </ul>

              {/* Pricing */}
              <div className="mt-6">
                {session.discountedPrice ? (
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-yellow-400 flex items-center gap-1">
                      <IndianRupee className="h-5 w-5" />
                      {session.discountedPrice}
                    </span>
                    <span className="text-sm line-through text-zinc-500">
                      ₹{session.price}
                    </span>
                    <span className="text-sm text-red-500 font-semibold">
                      {Math.round(
                        100 - (session.discountedPrice / session.price) * 100
                      )}
                      % off
                    </span>
                  </div>
                ) : (
                  <div className="text-2xl font-bold flex items-center gap-1 text-green-400">
                    <IndianRupee className="h-5 w-5" />
                    {session.price}
                  </div>
                )}
              </div>

              {/* Action button */}
              {session.isEnrolled ? (
                <Button
                  className="w-full mt-6 rounded-full bg-blue-500 hover:bg-blue-600 text-white"
                  size="lg"
                  onClick={() => router.push(`/${firstName}/dashboard`)} // ✅ Dynamic redirect
                >
                  Go to Dashboard →
                </Button>
              ) : (
                <Button
                  className="w-full mt-6 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white"
                  size="lg"
                  onClick={() => router.push(`/guidance/${session.id}`)}
                >
                  Enroll Now →
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
