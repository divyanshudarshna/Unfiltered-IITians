"use client";

import { useUser } from "@clerk/nextjs";
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
  const { user } = useUser();
  const router = useRouter();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [enrolledSessionIds, setEnrolledSessionIds] = useState<string[] | null>(null); // null until loaded
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all sessions
        const res = await fetch("/api/sessions", { cache: "no-store" });
        const data = await res.json();
        if (Array.isArray(data.sessions)) setSessions(data.sessions);

        // Fetch enrolled sessions if logged in
        if (user) {
          const enrolledRes = await fetch("/api/sessions/enrolled");
          const enrolledData = await enrolledRes.json();
          if (Array.isArray(enrolledData.sessionIds)) {
            setEnrolledSessionIds(enrolledData.sessionIds);
          } else {
            setEnrolledSessionIds([]); // no enrolled sessions
          }
        } else {
          setEnrolledSessionIds([]); // not logged in
        }
      } catch (err) {
        console.error("❌ Error fetching sessions or enrollments:", err);
        setEnrolledSessionIds([]); // fail safe
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleEnrollOrRedirect = (sessionId: string) => {
    if (user) {
      if (enrolledSessionIds?.includes(sessionId)) {
        const encodedName = encodeURIComponent(user.firstName || "user");
        router.push(`/${encodedName}/dashboard`);
      } else {
        router.push(`/guidance/${sessionId}`);
      }
    } else {
      const returnTo = encodeURIComponent(`/guidance`);
      router.push(`/sign-in?redirectUrl=${returnTo}`);
    }
  };

  const skeletonArray = Array.from({ length: 6 });

  return (
    <div className="container mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold text-center mb-10">Available Sessions</h1>

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {loading || enrolledSessionIds === null
          ? skeletonArray.map((_, idx) => (
              <Card
                key={idx}
                className="animate-pulse relative rounded-2xl border border-border shadow-lg
                           bg-muted/20 dark:bg-zinc-800"
              >
                <div className="absolute top-4 right-4">
                  <div className="h-6 w-14 bg-zinc-500 rounded-full"></div>
                </div>

                <CardHeader>
                  <div className="h-6 w-3/4 bg-zinc-500 rounded mb-2"></div>
                  <div className="h-4 w-1/2 bg-zinc-500 rounded"></div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-2 mb-4">
                    <div className="h-3 bg-zinc-500 rounded w-full"></div>
                    <div className="h-3 bg-zinc-500 rounded w-5/6"></div>
                    <div className="h-3 bg-zinc-500 rounded w-2/3"></div>
                  </div>
                  <div className="h-10 w-full bg-zinc-500 rounded"></div>
                </CardContent>
              </Card>
            ))
          : sessions.map((session) => {
              const isEnrolled = enrolledSessionIds.includes(session.id);

              return (
                <Card
                  key={session.id}
                  className="relative rounded-2xl border border-border shadow-lg hover:shadow-xl transition
                         bg-gradient-to-b from-background to-muted/20
                         dark:from-zinc-900 dark:to-zinc-800"
                >
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

                    <Button
                      className={`w-full mt-6 rounded-full ${
                        isEnrolled
                          ? "bg-blue-500 hover:bg-blue-600"
                          : "bg-emerald-500 hover:bg-emerald-600"
                      } text-white`}
                      size="lg"
                      onClick={() => handleEnrollOrRedirect(session.id)}
                    >
                      {isEnrolled ? "Go to Dashboard →" : "Enroll Now →"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
      </div>
    </div>
  );
}
