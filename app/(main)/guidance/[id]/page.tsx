"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { BuyButton } from "@/components/BuyButton";
import { useUser } from "@clerk/nextjs"; // ✅ import Clerk hook

interface Session {
  id: string;
  title: string;
  description: string;
  content: string;
  tags: string[];
  status: string;
  price: number;
  discountedPrice: number;
  maxEnrollment: number | null;
  type: string;
  duration: number;
  expiryDate: string;
  createdAt: string;
  updatedAt: string;
}

export default function SessionPage() {
  const { id } = useParams<{ id: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState("");

  // ✅ Clerk user
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (!id) return;

    const fetchSession = async () => {
      try {
        const res = await fetch(`/api/sessions/${id}`);
        const data = await res.json();

        if (!res.ok) {
          toast.error(data.error || "Failed to load session");
          return;
        }

        setSession(data);
      } catch (error) {
        console.error(error);
        toast.error("Something went wrong while fetching session");
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [id]);

  if (loading) return <p className="p-4">Loading session...</p>;
  if (!session) return <p className="p-4">❌ Session not found</p>;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* Session Details */}
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-bold">{session.title}</h1>
          <p className="text-muted-foreground">{session.description}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>{session.content}</p>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {session.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <p>
              <strong>Status:</strong> {session.status}
            </p>
            <p>
              <strong>Type:</strong> {session.type}
            </p>
            <p>
              <strong>Duration:</strong> {session.duration} mins
            </p>
            <p>
              <strong>Max Enrollment:</strong>{" "}
              {session.maxEnrollment ?? "Unlimited"}
            </p>
            <p>
              <strong>Expiry:</strong>{" "}
              {new Date(session.expiryDate).toLocaleDateString()}
            </p>
          </div>

          {/* Pricing */}
          <div className="flex items-center gap-4">
            <span className="text-xl font-semibold text-indigo-600 dark:text-indigo-400">
              ₹{session.discountedPrice}
            </span>
            {session.discountedPrice < session.price && (
              <span className="line-through text-gray-500">
                ₹{session.price}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Buy Section */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Enroll Now</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Phone Input */}
          <Input
            placeholder="Enter your phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          {/* ✅ Pass Clerk user.id instead of mock-user-id */}
          {isLoaded && user ? (
            <BuyButton
              clerkUserId={user.id} // ✅ real Clerk ID
              itemId={session.id}
              itemType="session"
              title={session.title}
              amount={session.discountedPrice}
              studentPhone={phone}
              onPurchaseSuccess={() =>
                toast.success("✅ Session purchased successfully!")
              }
            />
          ) : (
            <p className="text-red-500 text-sm">
              Please sign in to enroll in this session.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
