"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { BuyButton } from "@/components/BuyButton";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  Clock,
  Users,
  Calendar,
  Tag,
  Star,
  Zap,
  Shield,
  BookOpen,
  ArrowRight,
  Loader2,
} from "lucide-react";

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
  const { user, isLoaded } = useUser();
  const router = useRouter();

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

  if (loading) {
    return (
      //basic skeleton loader
      <div className="flex justify-center items-center h-64 text-muted-foreground">
        <Loader2 className="animate-spin h-6 w-6" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-gray-900 dark:via-purple-950 dark:to-indigo-900 flex items-center justify-center">
        <div className="text-center p-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/50">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="h-10 w-10 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Session Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            The session you're looking for doesn't exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  const isDiscounted = session.discountedPrice < session.price;
  const discountPercentage = isDiscounted
    ? Math.round(
        ((session.price - session.discountedPrice) / session.price) * 100
      )
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br  py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <Badge
            variant="secondary"
            className="px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700"
          >
            <Zap className="w-4 h-4 mr-2" />
            {session.type.toUpperCase()} SESSION
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400 bg-clip-text text-transparent">
            {session.title}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            {session.description}
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Session Details - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            {/* Content Card */}
            <Card className="rounded-3xl border-0 shadow-2xl hover:shadow-3xl transition-all duration-500 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-white/20 dark:border-gray-700/50">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Session Overview
                  </h2>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-lg dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed">
                  {session.content}
                </div>
              </CardContent>
            </Card>

            {/* Tags Card */}
            <Card className="rounded-3xl border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-white/20 dark:border-gray-700/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Tag className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Topics Covered
                  </h3>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {session.tags.map((tag) => (
                    <Badge
                      key={tag}
                      className="px-4 py-2 bg-slate-700  border-emerald-400 text-emerald-400  border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - 1/3 width */}
          <div className="space-y-6">
            {/* Pricing & Enrollment Card */}
            <Card className="rounded-3xl border-0 shadow-2xl hover:shadow-3xl transition-all duration-500   relative overflow-hidden">
              {/* Background Pattern */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_0)] bg-[length:20px_20px] -z-10" />

              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">Enroll Now</h3>
                  <Star className="h-5 w-5 text-yellow-300" />
                </div>
                {isDiscounted && (
                  <Badge className="bg-green-800 hover:bg-emerald-600 border-0 px-3 py-1 text-sm">
                    🎉 {discountPercentage}% OFF
                  </Badge>
                )}
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Pricing */}
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-4xl font-bold text-emerald-400">
                      ₹{session.discountedPrice}
                    </span>
                    {isDiscounted && (
                      <span className="text-lg line-through text-purple-200">
                        ₹{session.price}
                      </span>
                    )}
                  </div>
                  <p className="text-purple-100 text-sm">
                    One-time payment • Lifetime access
                  </p>
                </div>

                {/* Enrollment Form */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-purple-100 mb-2 block">
                      Phone Number
                    </label>
                    <Input
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="bg-white/20 border-white/30 text-white placeholder-purple-200 rounded-xl focus:bg-white/30 focus:border-white/50"
                    />
                  </div>
                  {isLoaded && user ? (
                    <BuyButton
                      clerkUserId={user.id}
                      itemId={session.id}
                      itemType="session"
                      title={session.title}
                      amount={session.discountedPrice}
                      studentPhone={phone}
                      onPurchaseSuccess={() => {
                        // Show toast first
                        toast.success("🎉 Session enrolled successfully!");

                        // Redirect to dashboard
                        const encodedName = encodeURIComponent(
                          user.firstName?.[0] || "user"
                        );
                        router.push(`/${encodedName}/dashboard`);
                      }}
                      className="w-full bg-white text-purple-600 hover:bg-purple-50 hover:scale-105 transform transition-all duration-300 font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl border-0"
                    />
                  ) : (
                    <Button
                      disabled
                      className="w-full bg-white/30 text-purple-100 border-white/30 hover:bg-white/40 font-semibold py-3 rounded-xl"
                    >
                      Please sign in to enroll
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Session Info Card */}
            <Card className="rounded-3xl border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-white/20 dark:border-gray-700/50">
              <CardHeader>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Session Details
                </h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-gray-600 dark:text-gray-300">
                    Duration:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white ml-auto">
                    {session.duration} minutes
                  </span>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-gray-600 dark:text-gray-300">
                    Max Enrollment:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white ml-auto">
                    {session.maxEnrollment ?? "Unlimited"}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-gray-600 dark:text-gray-300">
                    Expires:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white ml-auto">
                    {new Date(session.expiryDate).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Guarantee Card */}
            <Card className="rounded-3xl border-0 shadow-xl bg-gradient-to-br from-green-700 to-emerald-600 text-white">
              <CardContent className="p-6 text-center">
                <Shield className="h-12 w-12 mx-auto mb-3 text-white/90" />
                <h4 className="font-semibold mb-2">
                  100% Satisfaction Guarantee
                </h4>
                <p className="text-sm text-white/90 opacity-90">
                  Full refund if not satisfied within 7 days
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center pt-8">
          <div className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Shield className="h-4 w-4" />
            Secure payment • Instant access • Premium support
          </div>
        </div>
      </div>
    </div>
  );
}
