"use client";

import { use, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function AttemptPage({
  params,
}: {
  params: Promise<{ id: string; attemptId: string }>;
}) {
  // ✅ unwrap params promise
  const { id, attemptId } = use(params);
  const router = useRouter();

  const [mock, setMock] = useState<any>(null);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
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

  const handleSelectOption = (option: string) => {
    setAnswers({ ...answers, [currentIndex]: option });
  };

  // ✅ Submit attempt to backend
  const submitAttempt = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/mock/${id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId,
          answers,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit attempt");

      // ✅ Redirect to results page
      router.push(`/mocks/${id}/result/${attemptId}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !mock) return <p className="p-6">Loading...</p>;
  if (error) return <p className="p-6 text-red-500">{error}</p>;
  if (!mock) return <p className="p-6">Mock not found</p>;

  const question = mock.questions[currentIndex];

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">{mock.title}</h1>
      <p className="mb-6">{mock.description}</p>

      <div className="mb-4">
        <p className="font-semibold">
          Q{currentIndex + 1}: {question.question}
        </p>
        <div className="space-y-2 mt-2">
          {question.options.map((opt: string, i: number) => (
            <Button
              key={i}
              variant={answers[currentIndex] === opt ? "default" : "outline"}
              className="w-full justify-start"
              onClick={() => handleSelectOption(opt)}
            >
              {opt}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex justify-between mt-6">
        <Button
          onClick={() => setCurrentIndex((i) => Math.max(i - 1, 0))}
          disabled={currentIndex === 0}
        >
          Previous
        </Button>

        {currentIndex === mock.questions.length - 1 ? (
          <Button
            onClick={submitAttempt}
            disabled={!answers[currentIndex] || loading}
          >
            {loading ? "Submitting..." : "Submit"}
          </Button>
        ) : (
          <Button
            onClick={() =>
              setCurrentIndex((i) => Math.min(i + 1, mock.questions.length - 1))
            }
            disabled={!answers[currentIndex]}
          >
            Next
          </Button>
        )}
      </div>
    </main>
  );
}
