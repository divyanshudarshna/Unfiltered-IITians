// app/dashboard/courses/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

type EnrollmentItem = {
  id: string;
  title: string;
  description?: string;
  price: number;
  actualPrice: number;
  status: string;
  enrolledAt: string;
  progress: number;
  totalContents: number;
  completedContents: number;
};

export default function MyCoursesPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();
  const [data, setData] = useState<EnrollmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/courses/enrollments`, {
          credentials: "include",
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Failed to load");
        setData(json); // ✅ json is already an array
      } catch (e: any) {
        setErr(e?.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, [isLoaded, isSignedIn, router]);

  console.log({ data, loading, err });

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-2 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (err) {
    return (
      <div className="p-6">
        <p className="text-destructive mb-4">{err}</p>
        <Button onClick={() => location.reload()}>Retry</Button>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-2">Your Courses</h1>
        <p className="text-muted-foreground">
          You’re not enrolled in any course yet.
        </p>
        <div className="mt-4">
          <Button asChild>
            <Link href="/courses">Browse Courses</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Your Courses</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data.map((e) => (
          <Card key={e.id} className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg">{e.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="mb-2 text-sm text-muted-foreground">
                {e.completedContents}/{e.totalContents} contents completed
              </div>
              <Progress value={e.progress ?? 0} className="h-2 mb-4" />
              <Button asChild className="w-full">
                <Link href={`/dashboard/courses/${e.id}`}>
                  Continue learning
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
