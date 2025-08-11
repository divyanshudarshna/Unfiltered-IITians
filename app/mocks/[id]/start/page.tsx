"use client";

import { use, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function StartMockPage({ params }: { params: Promise<{ id: string }> }) {
  // ✅ unwrap the params Promise
  const { id } = use(params);

  const { user } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [mock, setMock] = useState<any>(null);
  const [error, setError] = useState("");

  // Fetch mock details
  useEffect(() => {
    const fetchMock = async () => {
      try {
        const res = await fetch(`/api/mock/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load mock");
        setMock(data.mock);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchMock();
  }, [id]);

  // Start attempt
  const startAttempt = async () => {
    if (!user?.id) {
      setError("You must be logged in to start the test");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/mock/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerkUserId: user.id,
          mockTestId: id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start attempt");

      router.push(`/mocks/${id}/attempt/${data.attempt.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !mock) return <p className="p-6">Loading...</p>;
  if (error) return <p className="p-6 text-red-500">{error}</p>;
  if (!mock) return <p className="p-6">Mock not found</p>;

  return (
    <main className="max-w-3xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">{mock.title}</CardTitle>
          <p className="text-gray-600">{mock.description}</p>
        </CardHeader>
        <CardContent>
          <p className="mb-4">Difficulty: {mock.difficulty}</p>
          <p className="mb-6">Total Questions: {mock.questions.length}</p>
          <Button onClick={startAttempt} disabled={loading}>
            {loading ? "Starting..." : "Start Test"}
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
