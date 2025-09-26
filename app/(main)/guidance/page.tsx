"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, IndianRupee } from "lucide-react";

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
}

export default function GuidancePage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await fetch("/api/sessions", { cache: "no-store" });
        const data = await res.json();
        if (Array.isArray(data.sessions)) setSessions(data.sessions);
      } catch (err) {
        console.error("❌ Error fetching sessions:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, []);

  if (loading)
    return (
      <div className="flex justify-center items-center h-64 text-muted-foreground">
        Loading sessions...
      </div>
    );

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
              <div className="mt-4 mb-4 text-sm font-semibold">What you'll get:</div>
              <ul className="space-y-2 text-sm text-zinc-300">
                {[
                  "Expert tips on syllabus coverage",
                  "Live Interaction based service",
                  "1 + 1 session (30 minutes each)",
                  "SWOT analysis",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-400" /> {item}
                  </li>
                ))}
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
              <Button
                className="w-full mt-6 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white"
                size="lg"
                onClick={() => router.push(`/guidance/${session.id}`)}
              >
                Enroll Now →
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
