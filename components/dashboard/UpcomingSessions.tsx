// components/dashboard/UpcomingSessions.tsx
"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Clock, Info } from "lucide-react";

interface Session {
  id: string;
  title: string;
  description?: string;
  type: string;
  duration: number;
  expiryDate?: string;
  isEnrolled?: boolean;
}

export function UpcomingSessions() {
  const { user } = useUser();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSessions() {
      try {
        const res = await fetch("/api/sessions", { cache: "no-store" });
        const data = await res.json();
        if (Array.isArray(data.sessions)) setSessions(data.sessions);
      } catch (err) {
        console.error("Error fetching sessions:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchSessions();
  }, []);

  if (loading) {
    return (
      <Card className="shadow-md lg:col-span-2">
        <CardHeader>
          <CardTitle>My Sessions</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Loading your sessions...
        </CardContent>
      </Card>
    );
  }

  const enrolledSessions = sessions.filter((s) => s.isEnrolled);

  return (
    <Card className="shadow-lg lg:col-span-2 bg-background dark:bg-zinc-900/60 border border-border rounded-2xl hover:shadow-xl transition-all">
      <CardHeader>
        <CardTitle>My Sessions</CardTitle>
      </CardHeader>
      <CardContent className="text-sm space-y-4">
        {enrolledSessions.length > 0 ? (
          <>
            <p className="text-muted-foreground">
              You are enrolled in {enrolledSessions.length} session
              {enrolledSessions.length > 1 ? "s" : ""}. Your mentor will
              reach out to schedule weekly live sessions.
            </p>
            <ul className="space-y-3">
              {enrolledSessions.map((s) => (
                <li
                  key={s.id}
                  className="p-3 border border-border rounded-xl bg-muted/30 dark:bg-zinc-800/40 flex justify-between items-start hover:shadow-md transition-all"
                >
                  <div>
                    <strong className="text-lg">{s.title}</strong>
                    {s.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {s.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
                      <Clock className="w-3 h-3" /> Duration: {s.duration} min
                    </p>
                  </div>
                  <Badge
                    className={`h-6 px-3 py-1 text-xs rounded-full ${
                      s.expiryDate &&
                      new Date(s.expiryDate) > new Date()
                        ? "border-emerald-600 bg-dark text-emerald-400"
                        : "bg-amber-500 text-white"
                    }`}
                  >
                    {s.expiryDate &&
                    new Date(s.expiryDate) > new Date()
                      ? "Active"
                      : "Expired"}
                  </Badge>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="text-center py-8 space-y-4">
            <Info className="mx-auto w-8 h-8 text-blue-500" />
            <p className="text-muted-foreground">
              You are not enrolled in any sessions yet.
            </p>
            <Button
              className="mt-2"
              onClick={() => (window.location.href = "/guidance")}
            >
              Browse Available Sessions
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
