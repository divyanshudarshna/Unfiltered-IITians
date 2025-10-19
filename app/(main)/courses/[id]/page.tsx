"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth, useUser, SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle, Clock, Users, Shield, Award, FileText, Video, HelpCircle, Target, Package, MessageSquare, Timer, Star } from "lucide-react";

interface Course {
  id: string;
  title: string;
  description?: string;
  price: number;
  actualPrice?: number;
  durationMonths: number;
  level?: string;
  enrolledStudents?: number;
  coupons?: { code: string; discountPct: number; discountAmount?: number; newPrice?: number }[];
  contents?: any[];
  inclusions?: {
    id: string;
    inclusionType: 'MOCK_TEST' | 'MOCK_BUNDLE' | 'SESSION';
    inclusionId: string;
    mockTest?: {
      id: string;
      title: string;
      description?: string;
      difficulty: string;
      price: number;
    };
    mockBundle?: {
      id: string;
      title: string;
      description?: string;
      basePrice: number;
      discountedPrice?: number;
      mockIds: string[];
    };
    session?: {
      id: string;
      title: string;
      description?: string;
      sessionType: string;
      duration: number;
      price: number;
      discountedPrice?: number;
    };
  }[];
}

interface AppliedCoupon {
  code: string;
  discountPct: number;
  discountAmount: number;
  newPrice: number;
}

export default function CourseDetailPage() {
  const { user } = useUser();
  const { userId } = useAuth();
  const params = useParams();
  const router = useRouter();

  const [course, setCourse] = useState<Course | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [loading, setLoading] = useState(false);
  const [couponLoading, setCouponLoading] = useState(false);

  // Fetch course details
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await fetch(`/api/courses/${params.id}`);
        if (!res.ok) throw new Error("Failed to fetch course");
        const data = await res.json();
        console.log("📋 Course data received:", data); // Debug log
        console.log("📦 Inclusions:", data.inclusions); // Debug log
        setCourse(data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load course details");
      }
    };
    fetchCourse();
  }, [params.id]);

  // Base price = actualPrice fallback to price
  const basePrice = course?.actualPrice ?? course?.price ?? 0;

  // Calculate final price
  const finalPrice = appliedCoupon
    ? basePrice - Math.round((appliedCoupon.discountPct / 100) * basePrice)
    : basePrice;

  // Apply coupon
  const applyCoupon = async () => {
    if (!course) return;
    if (!couponCode.trim()) return toast.error("Please enter a coupon code");

    setCouponLoading(true);
    try {
      const res = await fetch(`/api/courses/${course.id}/apply-coupon`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode.trim() }),
      });

      const data = await res.json();

      if (data.valid) {
        setAppliedCoupon({
          code: couponCode,
          discountPct: data.discountPct,
          discountAmount: Math.round((data.discountPct / 100) * basePrice),
          newPrice: finalPrice,
        });
        toast.success(`Coupon applied! ${data.discountPct}% discount`);
      } else {
        setAppliedCoupon(null);
        toast.error(data.message || "Invalid or expired coupon code");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to apply coupon");
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    toast.info("Coupon removed");
  };

  // Checkout
  const handleCheckout = async () => {
  if (!course || !userId) {
    router.push(`/sign-in?redirect=/courses/${course?.id}`);
    return;
  }

  setLoading(true);

  try {
    const res = await fetch(`/api/courses/${course.id}/razorpay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clerkUserId: userId,
        couponCode: appliedCoupon?.code || null,
      }),
    });

    const data = await res.json();

    // ✅ Handle user already enrolled
    if (!res.ok) {
      if (data.redirectTo) {
        toast.info(`${data.error} Redirecting to dashboard...`);
        setTimeout(() => router.push(data.redirectTo), 1500);
      } else {
        toast.error(data.error || "Failed to initiate payment");
      }
      setLoading(false);
      return;
    }

    // ✅ Razorpay options
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: data.order.amount,
      currency: data.order.currency,
      name: "Course Enrollment",
      description: course.title,
      order_id: data.order.id,
      handler: async (response: any) => {
        try {
          console.log("🔄 Starting payment verification...", { response });
          
          const verifyRes = await fetch(`/api/courses/${course.id}/razorpay/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...response,
              couponCode: appliedCoupon?.code || null,
            }),
          });

          console.log("📡 Verification response status:", verifyRes.status);
          
          const verifyData = await verifyRes.json();
          console.log("📋 Verification data:", verifyData);
          
          if (verifyRes.ok && verifyData.success) {
            toast.success("✅ Payment successful! You're now enrolled.");
            router.push("/dashboard/courses");
          } else {
            console.error("❌ Verification failed:", verifyData);
            toast.error(verifyData.error || "Payment verification failed");
          }
        } catch (err) {
          console.error("❌ Verification error:", err);
          toast.error("Payment verification error. Please contact support.");
        }
      },
      prefill: {
        name: user?.fullName || "",
        email: user?.primaryEmailAddress?.emailAddress || "",
      },
      notes: {
        course: course.title,
        coupon: appliedCoupon?.code || "None",
      },
      theme: {
        color: "#4f46e5",
      },
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  } catch (err: any) {
    console.error("Checkout error:", err);
    toast.error(err.message || "Failed to initiate payment");
  } finally {
    setLoading(false);
  }
};




  if (!course) {
    return (
      <div className="container mx-auto p-6 max-w-4xl animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-8"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-40 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Back button */}
      <Button variant="ghost" onClick={() => router.back()} className="mb-6 flex items-center gap-2">
        <ArrowLeft className="h-4 w-4" /> Back to Courses
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Course Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{course.title}</CardTitle>
              <CardDescription>{course.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 mr-2 text-blue-500" />
                  {course.durationMonths} month{course.durationMonths !== 1 ? "s" : ""}
                </div>
                {course.level && (
                  <Badge variant="outline" className="flex items-center gap-1">{course.level}</Badge>
                )}
                {course.enrolledStudents !== undefined && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="h-4 w-4 mr-2 text-purple-500" />
                    {course.enrolledStudents.toLocaleString()} students
                  </div>
                )}
              </div>

              {/* Course Features */}
              <div className="pt-4">
                <h3 className="font-semibold mb-3">What&apos;s included:</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center text-sm">
                    <Video className="h-4 w-4 mr-2 text-green-500" /> Video Lectures
                  </div>
                  <div className="flex items-center text-sm">
                    <FileText className="h-4 w-4 mr-2 text-blue-500" /> PDF Notes
                  </div>
                  <div className="flex items-center text-sm">
                    <HelpCircle className="h-4 w-4 mr-2 text-purple-500" /> Weekly Doubt Sessions
                  </div>
                  <div className="flex items-center text-sm">
                    <Award className="h-4 w-4 mr-2 text-amber-500" /> Quizzes & Assessments
                  </div>
                </div>
              </div>

              {/* Course Inclusions */}
              {course.inclusions && course.inclusions.length > 0 && (
                <div className="pt-6 border-t">
                  <h3 className="font-semibold mb-4 text-lg">Bonus Inclusions with this Course</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Get instant access to these premium resources at no extra cost when you enroll:
                  </p>
                  <div className="space-y-4">
                    {/* Mock Tests */}
                    {course.inclusions.filter(inc => inc.inclusionType === 'MOCK_TEST' && inc.mockTest).length > 0 && (
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                        <div className="flex items-center gap-2 mb-3">
                          <Target className="h-5 w-5 text-blue-600" />
                          <h4 className="font-medium text-blue-900 dark:text-blue-100">Individual Mock Tests</h4>
                          <Badge variant="secondary" className="ml-auto bg-blue-100 text-blue-700">
                            {course.inclusions.filter(inc => inc.inclusionType === 'MOCK_TEST' && inc.mockTest).length} Tests
                          </Badge>
                        </div>
                        <div className="grid gap-3">
                          {course.inclusions
                            .filter(inc => inc.inclusionType === 'MOCK_TEST' && inc.mockTest)
                            .map((inclusion, index) => (
                              <div key={index} className="bg-white/70 dark:bg-gray-800/70 p-3 rounded-md border border-blue-200/50 dark:border-blue-700/50">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <h5 className="font-medium text-sm text-gray-900 dark:text-gray-100">
                                      {inclusion.mockTest?.title || 'Mock Test'}
                                    </h5>
                                    {inclusion.mockTest?.description && (
                                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                        {inclusion.mockTest.description}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-2 mt-2">
                                      <Badge variant="outline" className="text-xs">
                                        {inclusion.mockTest?.difficulty || 'MEDIUM'}
                                      </Badge>
                                      <span className="text-xs font-medium text-green-600 dark:text-green-400">
                                        Worth ₹{inclusion.mockTest?.price || 0}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Mock Bundles */}
                    {course.inclusions.filter(inc => inc.inclusionType === 'MOCK_BUNDLE' && inc.mockBundle).length > 0 && (
                      <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 p-4 rounded-lg border border-emerald-100 dark:border-emerald-800">
                        <div className="flex items-center gap-2 mb-3">
                          <Package className="h-5 w-5 text-emerald-600" />
                          <h4 className="font-medium text-emerald-900 dark:text-emerald-100">Mock Test Bundles</h4>
                          <Badge variant="secondary" className="ml-auto bg-emerald-100 text-emerald-700">
                            {course.inclusions.filter(inc => inc.inclusionType === 'MOCK_BUNDLE' && inc.mockBundle).length} Bundles
                          </Badge>
                        </div>
                        <div className="grid gap-3">
                          {course.inclusions
                            .filter(inc => inc.inclusionType === 'MOCK_BUNDLE' && inc.mockBundle)
                            .map((inclusion, index) => (
                              <div key={index} className="bg-white/70 dark:bg-gray-800/70 p-3 rounded-md border border-emerald-200/50 dark:border-emerald-700/50">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <h5 className="font-medium text-sm text-gray-900 dark:text-gray-100">
                                      {inclusion.mockBundle?.title || 'Mock Bundle'}
                                    </h5>
                                    {inclusion.mockBundle?.description && (
                                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                        {inclusion.mockBundle.description}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-2 mt-2">
                                      <Badge variant="outline" className="text-xs">
                                        {inclusion.mockBundle?.mockIds?.length || 0} Tests
                                      </Badge>
                                      <span className="text-xs font-medium text-green-600 dark:text-green-400">
                                        Worth ₹{inclusion.mockBundle?.discountedPrice || inclusion.mockBundle?.basePrice || 0}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Sessions */}
                    {course.inclusions.filter(inc => inc.inclusionType === 'SESSION' && inc.session).length > 0 && (
                      <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20 p-4 rounded-lg border border-purple-100 dark:border-purple-800">
                        <div className="flex items-center gap-2 mb-3">
                          <MessageSquare className="h-5 w-5 text-purple-600" />
                          <h4 className="font-medium text-purple-900 dark:text-purple-100">Guidance Sessions</h4>
                          <Badge variant="secondary" className="ml-auto bg-purple-100 text-purple-700">
                            {course.inclusions.filter(inc => inc.inclusionType === 'SESSION' && inc.session).length} Sessions
                          </Badge>
                        </div>
                        <div className="grid gap-3">
                          {course.inclusions
                            .filter(inc => inc.inclusionType === 'SESSION' && inc.session)
                            .map((inclusion, index) => (
                              <div key={index} className="bg-white/70 dark:bg-gray-800/70 p-3 rounded-md border border-purple-200/50 dark:border-purple-700/50">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <h5 className="font-medium text-sm text-gray-900 dark:text-gray-100">
                                      {inclusion.session?.title || 'Guidance Session'}
                                    </h5>
                                    {inclusion.session?.description && (
                                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                        {inclusion.session.description}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-2 mt-2">
                                      <Badge variant="outline" className="text-xs">
                                        {inclusion.session?.sessionType || 'Session'}
                                      </Badge>
                                      <div className="flex items-center text-xs text-gray-500">
                                        <Timer className="h-3 w-3 mr-1" />
                                        {inclusion.session?.duration || 60}min
                                      </div>
                                      <span className="text-xs font-medium text-green-600 dark:text-green-400">
                                        Worth ₹{inclusion.session?.discountedPrice || inclusion.session?.price || 0}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Total Value Summary */}
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Star className="h-5 w-5 text-amber-600" />
                          <span className="font-semibold text-amber-900 dark:text-amber-100">
                            Total Bonus Value
                          </span>
                        </div>
                        <span className="text-lg font-bold text-amber-700 dark:text-amber-300">
                          ₹{course.inclusions.reduce((total, inc) => {
                            const price = inc.mockTest?.price || 
                                         (inc.mockBundle?.discountedPrice || inc.mockBundle?.basePrice) || 
                                         (inc.session?.discountedPrice || inc.session?.price) || 0;
                            return total + price;
                          }, 0)}
                        </span>
                      </div>
                      <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                        All included at no additional cost with your course enrollment!
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Checkout Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {/* Original Price */}
                {course.price > basePrice && (
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span className="text-sm line-through">Original Price</span>
                    <span className="text-sm line-through">₹{course.price}</span>
                  </div>
                )}

                {/* Base Price */}
                <div className="flex justify-between items-center">
                  <span className="text-sm">Base Price</span>
                  <span className="font-medium">₹{basePrice}</span>
                </div>

                {/* Coupon Discount */}
                {appliedCoupon && (
                  <div className="flex justify-between items-center text-green-600">
                    <span className="text-sm">Discount {appliedCoupon.discountPct}%</span>
                    <span className="text-sm">-₹{appliedCoupon.discountAmount}</span>
                  </div>
                )}

                <Separator />

                {/* Final Amount */}
                <div className="flex justify-between items-center font-bold text-lg">
                  <span>Total Amount</span>
                  <span className="text-green-600">₹{finalPrice}</span>
                </div>
              </div>

              {/* Coupon Section */}
              <div className="space-y-3 pt-4">
                <Label htmlFor="coupon">Apply Coupon</Label>
                <div className="flex gap-2">
                  <Input
                    id="coupon"
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    disabled={!!appliedCoupon}
                    className="flex-1"
                  />
                  {appliedCoupon ? (
                    <Button onClick={removeCoupon} variant="outline" size="sm">Remove</Button>
                  ) : (
                    <Button onClick={applyCoupon} variant="outline" size="sm" disabled={couponLoading || !couponCode.trim()}>
                      {couponLoading ? "Applying..." : "Apply"}
                    </Button>
                  )}
                </div>
                {appliedCoupon && (
                  <div className="text-sm text-green-600 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1" /> Coupon "{appliedCoupon.code}" applied successfully
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 text-lg"
              >
                {loading ? <>Processing Payment...</> : <>Pay Now = ₹{finalPrice}</>}
              </Button>
            </CardFooter>
          </Card>

          {/* Security Assurance */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-green-500 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium text-sm">Secure Payment</p>
                  <p className="text-xs text-muted-foreground">
                    Your payment information is encrypted and secure. We do not store your card details.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
