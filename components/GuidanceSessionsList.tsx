"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, IndianRupee, Users, User, ArrowRight } from "lucide-react";

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

interface GuidanceSessionsListProps {
  showTestimonials?: boolean;
  testimonialsTitle?: string;
  testimonialsDescription?: string;
  totalCardsCount?: number; // 👈 new prop
}

export default function GuidanceSessionsList({
  showTestimonials = false,
  testimonialsTitle = "Student Reviews",
  testimonialsDescription = "Hear from students who have transformed their academic journey with personalized guidance",
  totalCardsCount, // default = undefined → show all
}: GuidanceSessionsListProps) {
  const { user } = useUser();
  const router = useRouter();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [enrolledSessionIds, setEnrolledSessionIds] = useState<string[] | null>(null);
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
            setEnrolledSessionIds([]);
          }
        } else {
          setEnrolledSessionIds([]);
        }
      } catch (err) {
        // console.error("❌ Error fetching sessions or enrollments:", err);
        setEnrolledSessionIds([]);
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

  // 👇 Apply slicing logic if totalCardsCount is passed
  const displayedSessions =
    totalCardsCount && sessions.length > totalCardsCount
      ? sessions.slice(0, totalCardsCount)
      : sessions;

  return (
    <div className="container mx-auto px-6 py-10">
      <h1 className="text-5xl font-bold text-center mb-10 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-500 dark:to-purple-500 bg-clip-text text-transparent">
        Available Guidance Sessions
      </h1>

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
          : displayedSessions.map((session) => {
              const isEnrolled = enrolledSessionIds.includes(session.id);
              const isOneOnOne = session.type === "ONE_ON_ONE";
              
              return (
                <div key={session.id} className="relative group">
                  {/* Glow Effect */}
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-0 group-hover:opacity-70 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                  
                  <Card
                    className="relative rounded-2xl border border-border shadow-lg 
                              bg-gradient-to-br from-white to-gray-50/80 
                              dark:from-zinc-900 dark:to-zinc-800/90
                              backdrop-blur-sm
                              group-hover:shadow-2xl group-hover:scale-[1.02]
                              transition-all duration-500 ease-out
                              border-opacity-20 group-hover:border-opacity-40
                              overflow-hidden"
                  >
                    {/* Animated Background Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-blue-50/10 to-purple-50/10 dark:via-blue-900/5 dark:to-purple-900/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    {/* Shine Effect */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                    {/* Badge */}
                    <div className="absolute top-4 right-4 z-10">
                      <Badge
                        className={`
                          px-3 py-1.5 rounded-full text-xs font-bold tracking-wide
                          shadow-lg border-0
                          transition-all duration-300 transform group-hover:scale-110
                          ${isOneOnOne 
                            ? "bg-gradient-to-r from-sky-700 to-blue-600 text-white " 
                            : "bg-gradient-to-r from-purple-800 to-purple-800 text-white "
                          }
                          flex items-center gap-1.5
                        `}
                      >
                        {isOneOnOne ? (
                          <>
                            <User className="h-3 w-3" />
                            1-on-1
                          </>
                        ) : (
                          <>
                            <Users className="h-3 w-3" />
                            Group
                          </>
                        )}
                      </Badge>
                    </div>

                    <CardHeader className="relative z-5 pb-4">
                      <CardTitle className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                        {session.title}
                      </CardTitle>
                      <p className="text-sm text-gray-700 dark:text-gray-400 mt-2 line-clamp-2">
                        {session.description}
                      </p>
                    </CardHeader>

                    <CardContent className="relative z-5">
                      <div className="mt-4 mb-4 text-sm font-semibold text-gray-900 dark:text-gray-300">
                        What you'll get:
                      </div>
                      <ul className="space-y-2.5 text-sm">
                        {[
                          "Expert tips on syllabus coverage",
                          "Live Interaction based service",
                          "1 + 1 session (30 minutes each)",
                          "SWOT analysis",
                        ].map((item, idx) => (
                          <li key={idx} className="flex items-center gap-3 transition-transform duration-200 group-hover:translate-x-1">
                            <div className="flex-shrink-0 w-5 h-5 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                              <Check className="h-3 w-3 text-green-700 dark:text-green-400" />
                            </div>
                            <span className="text-gray-900 dark:text-gray-300">{item}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="mt-8 mb-2">
                        {session.discountedPrice ? (
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                              <IndianRupee className="h-5 w-5" />
                              {session.discountedPrice}
                            </span>
                            <span className="text-sm line-through text-gray-600 dark:text-gray-400">
                              ₹{session.price}
                            </span>
                            <Badge variant="destructive" className="px-2 py-1 text-xs font-bold">
                              {Math.round(
                                100 - (session.discountedPrice / session.price) * 100
                              )}
                              % OFF
                            </Badge>
                          </div>
                        ) : (
                          <div className="text-2xl font-bold flex items-center gap-1 text-green-700 dark:text-green-400">
                            <IndianRupee className="h-5 w-5" />
                            {session.price}
                          </div>
                        )}
                      </div>

                    <Button
  className={`
    w-full mt-6 rounded-xl font-bold tracking-wide
    transition-all duration-300 ease-out
    transform group-hover:scale-[1.02]
    shadow-md hover:shadow-lg
    relative overflow-hidden
    h-12
    ${isEnrolled
      ? "bg-sky-600 hover:bg-sky-700 text-white"
      : "bg-emerald-600 hover:bg-emerald-700 text-white"
    }`}
  size="lg"
  onClick={() => handleEnrollOrRedirect(session.id)}
>
  <span className="relative z-5 flex items-center justify-center gap-2">
    {isEnrolled ? (
      <>
        Go to Dashboard
        <ArrowRight className="h-4 w-4" />
      </>
    ) : (
      <>
        Enroll Now
        <ArrowRight className="h-4 w-4" />
      </>
    )}
  </span>
</Button>

                    </CardContent>
                  </Card>
                </div>
              );
            })}
      </div>

      {/* 👇 Show See More button if totalCardsCount < total sessions */}
      {totalCardsCount && sessions.length > totalCardsCount && (
        <div className="mt-10 flex justify-start">

  <Link
    href="/guidance"
    className="inline-flex items-center gap-2 rounded-full border border-cyan-400 px-6 py-2 
               text-cyan-500 font-semibold 
               hover:border-cyan-500 hover:text-cyan-300 
               hover:shadow-[0_0_15px_rgba(34,211,238,0.7)] 
               transition duration-300 ease-in-out"
  >
    <Users className="w-4 h-4" />
    See more sessions
    <ArrowRight className="w-4 h-4" />
  </Link>



        </div>
      )}

      {showTestimonials && (
        <div className="mt-16">
          {require("@/components/Testimonials").default && (
            <div>
              {require("@/components/Testimonials").default({
                button: true,
                title: testimonialsTitle,
                description: testimonialsDescription,
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
