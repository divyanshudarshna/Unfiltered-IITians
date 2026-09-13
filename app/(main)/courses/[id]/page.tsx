"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { toast } from "sonner";
import { ArrowLeft, Check, CheckCircle, Clock, CreditCard, Users, Shield, Award, FileText, Video, HelpCircle, Target, Package, MessageSquare, Timer, Star, Globe, Linkedin, Twitter, BookOpen, GraduationCap, FlaskConical, RefreshCw, Sparkles, ZoomIn, X } from "lucide-react";
import { getCheckoutPollingDecision, type CheckoutPollingStatus } from "@/lib/checkout-status";
import {
  getCourseCheckoutAvailability,
  calculateCourseOneTimePricePaise,
  getDefaultCourseCheckoutType,
  isCourseCheckoutLaunchEnabled,
  type CourseCheckoutType,
} from "@/lib/course-checkout-options";
import type { RazorpayResponse } from "@/types/razorpay";

const v2CourseCheckoutEnabled = process.env.NEXT_PUBLIC_V2_COURSE_CHECKOUT_ENABLED === "true";
const checkoutPollIntervalMs = 2_000;
const checkoutPollAttempts = 24;

interface AcademicAffiliation {
  institution: string;
  role?: string;
  year?: string;
  logoUrl?: string;
}

interface ResearchAppointment {
  organization: string;
  role?: string;
  period?: string;
}

interface InstructorSocialLinks {
  website?: string;
  linkedin?: string;
  researchgate?: string;
  twitter?: string;
}

interface Instructor {
  id: string;
  fullName: string;
  title?: string | null;
  bio?: string | null;
  profileImageUrl?: string | null;
  expertiseAreas?: string[];
  awards?: string | null;
  academicAffiliations?: AcademicAffiliation[];
  researchAppointments?: ResearchAppointment[];
  socialLinks?: InstructorSocialLinks | null;
}

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
  contents?: unknown[];
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
  instructors?: Instructor[];
  hasFreePreview?: boolean;
  firstFreeLectureId?: string | null;
  recurringPlan?: {
    amountPaise: number;
    currency: string;
    interval: string;
    totalCount: number;
  } | null;
  billingMode?: "ONE_TIME" | "RECURRING";
  subscriptionEnabled?: boolean;
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
  const checkoutInProgressRef = useRef(false);
  const [couponLoading, setCouponLoading] = useState(false);
  const [publicCoupons, setPublicCoupons] = useState<Array<{id:string;code:string;discountPct:number;validTill:string;usageCount:number}>>([]);
  const [publicLoading, setPublicLoading] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<{ url: string; name: string } | null>(null);
  const [selectedCheckoutType, setSelectedCheckoutType] = useState<CourseCheckoutType>(getDefaultCourseCheckoutType());

  const courseCheckoutStorageKey = (courseId: string, checkoutType: "ONE_TIME" | "COURSE_RECURRING") =>
    `v2-course-checkout:${courseId}:${checkoutType}`;

  const instructorsSectionRef = useRef<HTMLDivElement>(null);
  const scrollToInstructors = () => {
    instructorsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Fetch course details
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await fetch(`/api/courses/${params.id}`);
        if (!res.ok) throw new Error("Failed to fetch course");
        const data = await res.json();
         // Debug log
         // Debug log
        setCourse(data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load course details");
      }
    };
    fetchCourse();
    fetchPublicCoupons();
  }, [params.id]);

  const fetchPublicCoupons = async () => {
    try {
      setPublicLoading(true);
      const res = await fetch(`/api/courses/${params.id}/public-coupons`);
      if (!res.ok) throw new Error('Failed to fetch public coupons');
      const data = await res.json();
      setPublicCoupons(data || []);
    } catch (err) {
      console.error('Error fetching public coupons:', err);
    } finally {
      setPublicLoading(false);
    }
  };

  // Base price = actualPrice fallback to price
  const basePrice = course?.actualPrice ?? course?.price ?? 0;

  // Calculate final price
  const oneTimePrice = calculateCourseOneTimePricePaise(basePrice, appliedCoupon?.discountPct);
  const finalPrice = oneTimePrice.totalPaise / 100;
  const subscriptionConfigured = course?.subscriptionEnabled === true;
  const checkoutAvailability = getCourseCheckoutAvailability({
    subscriptionEnabled: subscriptionConfigured,
    recurringPlanAvailable: Boolean(course?.recurringPlan),
  });
  const monthlyPrice = (course?.recurringPlan?.amountPaise ?? 0) / 100;
  const subscriptionTotal = monthlyPrice * (course?.recurringPlan?.totalCount ?? 0);

  // Apply coupon
  const applyCouponWithCode = async (codeToApply: string) => {
    if (!course) return;
    if (!codeToApply.trim()) return toast.error("Please enter a coupon code");

    setCouponLoading(true);
    try {
      const res = await fetch(`/api/courses/${course.id}/apply-coupon`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codeToApply.trim() }),
      });

      const data = await res.json();

      if (data.valid) {
        const pricing = calculateCourseOneTimePricePaise(basePrice, data.discountPct);
        setAppliedCoupon({
          code: codeToApply,
          discountPct: data.discountPct,
          discountAmount: pricing.discountPaise / 100,
          newPrice: pricing.totalPaise / 100,
        });
        setCouponCode(codeToApply);
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

  const applyCoupon = async () => {
    return applyCouponWithCode(couponCode.trim());
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    toast.info("Coupon removed");
  };

  const waitForV2Fulfillment = async (checkoutId: string, storageKey: string) => {
    toast.loading("Payment received. Confirming course access...", { id: "course-payment" });
    for (let attempt = 0; attempt < checkoutPollAttempts; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, checkoutPollIntervalMs));
      const response = await fetch(`/api/checkout/intents/${checkoutId}`, { cache: "no-store" });
      if (!response.ok) continue;
      const data = await response.json() as {
        checkout: { status: CheckoutPollingStatus };
        entitlement: { active: boolean };
      };
      const decision = getCheckoutPollingDecision(data.checkout.status, data.entitlement.active);
      if (decision === "FULFILLED") {
        window.sessionStorage.removeItem(storageKey);
        toast.success("Payment confirmed. Course access is now active.", { id: "course-payment" });
        router.push("/dashboard/courses");
        return;
      }
      if (decision === "FAILED") {
        window.sessionStorage.removeItem(storageKey);
        toast.error("This checkout could not be completed.", { id: "course-payment" });
        return;
      }
      if (decision === "REQUIRES_REVIEW") {
        window.sessionStorage.removeItem(storageKey);
        toast.error("Your payment needs review. Please contact support with your payment details.", { id: "course-payment" });
        return;
      }
    }
    toast.info("Payment is still being confirmed. Course access will appear automatically once confirmed.", { id: "course-payment" });
  };

  const handleV2Checkout = async (checkoutType: "ONE_TIME" | "COURSE_RECURRING") => {
    if (!course) return;
    const storageKey = courseCheckoutStorageKey(course.id, checkoutType);
    const idempotencyKey = window.sessionStorage.getItem(storageKey) ?? `course:${course.id}:${checkoutType}:${crypto.randomUUID()}`;
    window.sessionStorage.setItem(storageKey, idempotencyKey);
    const response = await fetch("/api/checkout/intents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productType: "COURSE",
        productId: course.id,
        checkoutType,
        couponCode: checkoutType === "ONE_TIME" ? appliedCoupon?.code : undefined,
        idempotencyKey,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      if (data.code === "CHECKOUT_TERMINAL") window.sessionStorage.removeItem(storageKey);
      throw new Error(data.error || "Unable to create checkout");
    }
    if (data.checkout?.status === "PAID" && data.checkout?.id) {
      await waitForV2Fulfillment(data.checkout.id, storageKey);
      return;
    }
    if (!data.checkout?.id) throw new Error("Payment provider did not return a checkout");

    await new Promise<void>((resolve, reject) => {
      let paymentConfirmationStarted = false;
      const onCheckoutConfirmed = async () => {
        paymentConfirmationStarted = true;
        try {
          await waitForV2Fulfillment(data.checkout.id, storageKey);
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      const options = checkoutType === "COURSE_RECURRING"
        ? {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
          name: "Course Subscription",
          description: course.title,
          subscription_id: data.subscription?.id,
          handler: onCheckoutConfirmed,
          theme: { color: "#4f46e5" },
          modal: {
            ondismiss: () => {
              if (!paymentConfirmationStarted) resolve();
            },
          },
        }
        : {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
          amount: data.order?.amount,
          currency: data.order?.currency,
          name: "Course Enrollment",
          description: course.title,
          order_id: data.order?.id,
          handler: onCheckoutConfirmed,
          theme: { color: "#4f46e5" },
          modal: {
            ondismiss: () => {
              if (!paymentConfirmationStarted) resolve();
            },
          },
        };
      if ((checkoutType === "COURSE_RECURRING" && !data.subscription?.id) || (checkoutType === "ONE_TIME" && !data.order?.id)) {
        reject(new Error("Payment provider did not return checkout details"));
        return;
      }
      new window.Razorpay(options).open();
    });
  };

  // Checkout
  const handleCheckout = async () => {
    if (checkoutInProgressRef.current) return;
    if (!course || !userId) {
      router.push(`/sign-in?redirect=/courses/${course?.id}`);
      return;
    }

    if (selectedCheckoutType === "COURSE_RECURRING" && !checkoutAvailability.recurring) {
      toast.error("This monthly plan is still being configured. Please choose one-time payment or try again later.");
      return;
    }

    if (!isCourseCheckoutLaunchEnabled(selectedCheckoutType, v2CourseCheckoutEnabled)) {
      toast.error("Monthly subscriptions are not live yet. Please choose one-time payment or try again later.");
      return;
    }

    checkoutInProgressRef.current = true;
    setLoading(true);

  try {
    if (v2CourseCheckoutEnabled) {
      await handleV2Checkout(selectedCheckoutType);
      return;
    }
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
      handler: async (response: RazorpayResponse) => {
        try {
          
          
          const verifyRes = await fetch(`/api/courses/${course.id}/razorpay/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...response,
              couponCode: appliedCoupon?.code || null,
            }),
          });

          
          
          const verifyData = await verifyRes.json();
          
          
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

    const rzp = new window.Razorpay(options);
    rzp.open();
  } catch (err: unknown) {
    console.error("Checkout error:", err);
    toast.error(err instanceof Error ? err.message : "Failed to initiate payment");
  } finally {
    checkoutInProgressRef.current = false;
    setLoading(false);
  }
};




  if (!course) {
    return (
      <div className="container mx-auto p-6 max-w-6xl animate-pulse">
        <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
        <div className="h-40 bg-muted rounded mb-6"></div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-4">
            <div className="h-64 bg-muted rounded"></div>
            <div className="h-48 bg-muted rounded"></div>
          </div>
          <div className="lg:col-span-2 space-y-4">
            <div className="h-80 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Back button */}
      <Button variant="ghost" onClick={() => router.back()} className="mb-5 flex items-center gap-2 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Courses
      </Button>

      {/* ── Hero Card ── */}
      <Card className="mb-8 border-0 shadow-md bg-gradient-to-br from-background to-muted/40 dark:from-background dark:to-muted/20">
        <CardHeader className="pb-4">
          <div className="flex flex-wrap gap-2 mb-3">
            {course.level && (
              <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-0 text-xs font-medium">
                {course.level}
              </Badge>
            )}
            <Badge variant="outline" className="text-xs font-medium flex items-center gap-1">
              <Clock className="h-3 w-3" /> {course.durationMonths} month{course.durationMonths !== 1 ? "s" : ""}
            </Badge>
            {course.enrolledStudents !== undefined && (
              <Badge variant="outline" className="text-xs font-medium flex items-center gap-1">
                <Users className="h-3 w-3" /> {course.enrolledStudents.toLocaleString()} students
              </Badge>
            )}
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-bold leading-tight">{course.title}</CardTitle>
          {course.description && (
            <CardDescription className="text-base mt-2 leading-relaxed text-muted-foreground">
              {course.description}
            </CardDescription>
          )}
        </CardHeader>
      </Card>

      {/* ── Two-column grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">

        {/* ── Left: Course Content ── */}
        <div className="lg:col-span-3 space-y-6">

          {/* What's Included */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">What&apos;s Included</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <Video className="h-4 w-4 text-green-500 flex-shrink-0" /> Video Lectures
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" /> PDF Notes
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <HelpCircle className="h-4 w-4 text-purple-500 flex-shrink-0" /> Weekly Doubt Sessions
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Award className="h-4 w-4 text-amber-500 flex-shrink-0" /> Quizzes &amp; Assessments
                </div>
                {course.instructors && course.instructors.length > 0 && (
                  <div className="flex items-center gap-2 text-sm sm:col-span-2">
                    <GraduationCap className="h-4 w-4 text-indigo-500 flex-shrink-0" />
                    <span>Expert Instructor{course.instructors.length > 1 ? "s" : ""}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-auto text-xs h-7 px-3"
                      onClick={scrollToInstructors}
                    >
                      View Instructor Details
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Bonus Inclusions */}
          {course.inclusions && course.inclusions.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Bonus Inclusions</CardTitle>
                <CardDescription>
                  Premium resources included at no extra cost with your enrollment
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                {/* Mock Tests */}
                {course.inclusions.filter(inc => inc.inclusionType === 'MOCK_TEST' && inc.mockTest).length > 0 && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="h-5 w-5 text-blue-600" />
                      <h4 className="font-medium text-blue-900 dark:text-blue-100">Individual Mock Tests</h4>
                      <Badge variant="secondary" className="ml-auto bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
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
                      <Badge variant="secondary" className="ml-auto bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
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
                      <Badge variant="secondary" className="ml-auto bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300">
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

                {/* Total Value */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-amber-600" />
                      <span className="font-semibold text-amber-900 dark:text-amber-100">Total Bonus Value</span>
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
                    All included at no additional cost with your enrollment!
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

        </div>

        {/* ── Right: Sticky Checkout ── */}
        <div className="lg:col-span-2 space-y-4 lg:sticky lg:top-6 self-start">
          <Card className="overflow-hidden border-indigo-100 shadow-xl shadow-indigo-950/5 dark:border-indigo-900/70 dark:shadow-black/20">
            <div className="h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500" />
            <CardHeader className="space-y-1 pb-4">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-xl">Choose your payment</CardTitle>
                <Badge variant="secondary" className="border border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
                  Secure checkout
                </Badge>
              </div>
              <CardDescription>Pick the option that works best for you.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {subscriptionConfigured && (
                <RadioGroup
                  value={selectedCheckoutType}
                  onValueChange={(value) => setSelectedCheckoutType(value as CourseCheckoutType)}
                  aria-label="Course payment option"
                  className="grid gap-3"
                >
                  <Label
                    onClick={() => {
                      if (!loading) setSelectedCheckoutType("ONE_TIME");
                    }}
                    className={`group relative flex cursor-pointer items-start rounded-xl border p-4 text-left transition-all focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 ${
                      loading ? "cursor-wait" : ""
                    } ${
                      selectedCheckoutType === "ONE_TIME"
                        ? "border-indigo-500 bg-indigo-50/80 shadow-sm ring-1 ring-indigo-500 dark:bg-indigo-950/35"
                        : "border-border bg-card hover:border-indigo-300 hover:bg-indigo-50/30 dark:hover:border-indigo-800 dark:hover:bg-indigo-950/20"
                    }`}
                  >
                    <RadioGroupItem value="ONE_TIME" disabled={loading} className="sr-only" />
                    <span className="flex w-full items-start gap-3">
                      <span className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg ${selectedCheckoutType === "ONE_TIME" ? "bg-indigo-600 text-white" : "bg-muted text-muted-foreground"}`}>
                        <CreditCard className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="font-semibold">One-time payment</span>
                          {selectedCheckoutType === "ONE_TIME" && <Check className="size-5 text-indigo-600 dark:text-indigo-400" />}
                        </span>
                        <span className="mt-1 block text-2xl font-bold tracking-tight">₹{finalPrice.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        <span className="mt-1 block text-xs text-muted-foreground">
                          Pay once for {course.durationMonths} months of course access. Coupons may apply.
                        </span>
                      </span>
                    </span>
                  </Label>

                  <Label
                    data-disabled={loading || !checkoutAvailability.recurring ? "true" : undefined}
                    onClick={() => {
                      if (!loading && checkoutAvailability.recurring) setSelectedCheckoutType("COURSE_RECURRING");
                    }}
                    className={`group relative rounded-xl border p-4 text-left transition-all focus-within:ring-2 focus-within:ring-violet-500 focus-within:ring-offset-2 ${
                      selectedCheckoutType === "COURSE_RECURRING"
                        ? "border-violet-500 bg-violet-50/80 shadow-sm ring-1 ring-violet-500 dark:bg-violet-950/35"
                        : "border-border bg-card hover:border-violet-300 hover:bg-violet-50/30 dark:hover:border-violet-800 dark:hover:bg-violet-950/20"
                    }`}
                  >
                    <RadioGroupItem value="COURSE_RECURRING" disabled={loading || !checkoutAvailability.recurring} className="sr-only" />
                    <span className="absolute right-3 top-0 -translate-y-1/2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
                      Flexible
                    </span>
                    <span className="flex items-start gap-3">
                      <span className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg ${selectedCheckoutType === "COURSE_RECURRING" ? "bg-violet-600 text-white" : "bg-muted text-muted-foreground"}`}>
                        <RefreshCw className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="font-semibold">Monthly subscription</span>
                          {selectedCheckoutType === "COURSE_RECURRING" && <Check className="size-5 text-violet-600 dark:text-violet-400" />}
                        </span>
                        {course.recurringPlan ? (
                          <>
                            <span className="mt-1 block text-2xl font-bold tracking-tight">
                              ₹{monthlyPrice.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              <span className="text-sm font-medium text-muted-foreground"> / month</span>
                            </span>
                            <span className="mt-1 block text-xs text-muted-foreground">
                              Auto-renews for up to {course.recurringPlan.totalCount} monthly cycles. Total scheduled value ₹{subscriptionTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.
                            </span>
                          </>
                        ) : (
                          <span className="mt-2 block text-xs font-medium text-amber-700 dark:text-amber-300">
                            Monthly plan verification is in progress.
                          </span>
                        )}
                      </span>
                    </span>
                  </Label>
                </RadioGroup>
              )}

              {selectedCheckoutType === "ONE_TIME" ? (
                <div className="space-y-3 rounded-xl bg-muted/35 p-4">
                  {course.price > basePrice && (
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Regular price</span>
                      <span className="line-through">₹{course.price.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span>Course access</span>
                    <span className="font-medium">₹{basePrice.toLocaleString("en-IN")}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex items-center justify-between text-sm text-emerald-600 dark:text-emerald-400">
                      <span>Coupon ({appliedCoupon.discountPct}% off)</span>
                      <span>-₹{(oneTimePrice.discountPaise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex items-end justify-between gap-3">
                    <span className="font-semibold">Pay today</span>
                    <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">₹{finalPrice.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              ) : course.recurringPlan ? (
                <div className="space-y-3 rounded-xl bg-violet-50/60 p-4 dark:bg-violet-950/25">
                  <div className="flex items-center justify-between text-sm">
                    <span>Due today</span>
                    <span className="font-semibold">₹{monthlyPrice.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Billing schedule</span>
                    <span>{course.recurringPlan.totalCount} monthly cycles</span>
                  </div>
                  <Separator />
                  <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
                    <Sparkles className="mt-0.5 size-3.5 shrink-0 text-violet-500" />
                    Access follows successful monthly payments. You can stop auto-renewal from your subscription dashboard.
                  </p>
                </div>
              ) : null}

              {selectedCheckoutType === "ONE_TIME" && (
                <div className="space-y-3">
                  <Label htmlFor="coupon">Have a coupon?</Label>
                  <div className="flex gap-2">
                    <Input
                      id="coupon"
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={(event) => setCouponCode(event.target.value)}
                      disabled={Boolean(appliedCoupon)}
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
                    <div className="flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400">
                      <CheckCircle className="size-4" /> Coupon &quot;{appliedCoupon.code}&quot; applied
                    </div>
                  )}
                  {publicLoading ? (
                    <p className="text-xs text-muted-foreground">Checking available offers...</p>
                  ) : publicCoupons.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {publicCoupons.map((publicCoupon) => (
                        <button
                          key={publicCoupon.id}
                          type="button"
                          onClick={() => applyCouponWithCode(publicCoupon.code)}
                          disabled={couponLoading}
                          className="rounded-full border border-dashed border-emerald-400/70 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-50 dark:bg-emerald-950/30 dark:text-emerald-300 dark:hover:bg-emerald-950/50"
                        >
                          {publicCoupon.code} · {publicCoupon.discountPct}% off
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}

              {selectedCheckoutType === "COURSE_RECURRING" && !v2CourseCheckoutEnabled && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
                  Monthly subscriptions are not live yet. You can still choose one-time payment above.
                </div>
              )}
            </CardContent>
            <CardFooter className="grid gap-3 border-t bg-muted/15 pt-5">
              {course.hasFreePreview && (
                <Button
                  variant="outline"
                  onClick={() => router.push(`/courses/${course.id}/preview`)}
                  className="w-full border-emerald-500/60 text-emerald-600 hover:bg-emerald-500/10"
                >
                  <Video className="mr-2 size-4" /> Start free preview
                </Button>
              )}
              <Button
                onClick={handleCheckout}
                disabled={
                  loading
                  || !isCourseCheckoutLaunchEnabled(selectedCheckoutType, v2CourseCheckoutEnabled)
                  || (selectedCheckoutType === "COURSE_RECURRING" && !checkoutAvailability.recurring)
                }
                className="w-full bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 py-6 text-base font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all hover:-translate-y-0.5 hover:from-indigo-700 hover:via-violet-700 hover:to-purple-700 hover:shadow-xl disabled:translate-y-0 disabled:shadow-none"
              >
                {loading
                  ? "Opening secure checkout..."
                  : !isCourseCheckoutLaunchEnabled(selectedCheckoutType, v2CourseCheckoutEnabled)
                    ? "Monthly subscriptions not live yet"
                    : selectedCheckoutType === "COURSE_RECURRING"
                      ? course.recurringPlan
                        ? `Start monthly plan · ₹${monthlyPrice.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : "Monthly plan setup in progress"
                      : `Pay once · ₹${finalPrice.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </Button>
              <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
                {v2CourseCheckoutEnabled
                  ? "Payments are verified by Razorpay webhooks before course access is granted."
                  : "Payment is securely verified before course access is granted."}
              </p>
            </CardFooter>
          </Card>

          {/* Security badge */}
          <Card className="bg-muted/40 border-border shadow-none">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">Secure Payment</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Your payment information is encrypted and secure. We do not store your card details.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>

      {/* ── Instructor Profiles — full width ── */}
      {course.instructors && course.instructors.length > 0 && (
        <div ref={instructorsSectionRef} id="instructors-section" className="mt-10 scroll-mt-6">
          <h2 className="text-2xl font-bold flex items-center gap-3 mb-6">
            <GraduationCap className="h-6 w-6 text-indigo-500" />
            {course.instructors.length === 1 ? "Meet Your Instructor" : "Meet Your Instructors"}
          </h2>

          <div className="space-y-6">
            {course.instructors.map((instructor) => {
              const affiliations = (instructor.academicAffiliations || []) as AcademicAffiliation[];
              const appointments = (instructor.researchAppointments || []) as ResearchAppointment[];
              const social = instructor.socialLinks as InstructorSocialLinks | null;

              return (
                <Card key={instructor.id} className="overflow-hidden shadow-sm border border-border">
                  {/* Gradient header strip */}
                  <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-500" />

                  <CardContent className="p-8 space-y-6">
                    {/* Avatar + name + title + socials */}
                      <div className="flex items-start gap-6">
                        {instructor.profileImageUrl ? (
                          <button
                            type="button"
                            onClick={() => setZoomedImage({ url: instructor.profileImageUrl!, name: instructor.fullName })}
                            className="relative flex-shrink-0 group focus:outline-none"
                            title="Click to zoom"
                          >
                            <img
                              src={instructor.profileImageUrl}
                              alt={instructor.fullName}
                              className="h-24 w-24 rounded-full object-cover border-2 border-indigo-200 dark:border-indigo-700 shadow-md transition-transform group-hover:scale-105 cursor-zoom-in"
                            />
                            <span className="absolute inset-0 rounded-full flex items-center justify-center bg-black/0 group-hover:bg-black/25 transition-colors">
                              <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                            </span>
                          </button>
                        ) : (
                          <div className="h-24 w-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 text-white text-3xl font-bold shadow-md select-none">
                            {instructor.fullName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-foreground leading-tight">
                          {instructor.fullName}
                        </h3>
                        {instructor.title && (
                          <p className="text-base text-indigo-600 dark:text-indigo-400 font-medium mt-1">
                            {instructor.title}
                          </p>
                        )}
                        {social && (
                          <div className="flex items-center gap-4 mt-3">
                            {social.website && (
                              <a href={social.website} target="_blank" rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" title="Website">
                                <Globe className="h-5 w-5" />
                              </a>
                            )}
                            {social.linkedin && (
                              <a href={social.linkedin} target="_blank" rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors" title="LinkedIn">
                                <Linkedin className="h-5 w-5" />
                              </a>
                            )}
                            {social.researchgate && (
                              <a href={social.researchgate} target="_blank" rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-green-600 dark:hover:text-green-400 transition-colors" title="ResearchGate">
                                <FlaskConical className="h-5 w-5" />
                              </a>
                            )}
                            {social.twitter && (
                              <a href={social.twitter} target="_blank" rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-sky-500 dark:hover:text-sky-400 transition-colors" title="Twitter / X">
                                <Twitter className="h-5 w-5" />
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bio */}
                    {instructor.bio && (
                      <p className="text-base text-muted-foreground leading-relaxed border-l-2 border-indigo-300 dark:border-indigo-700 pl-4">
                        {instructor.bio}
                      </p>
                    )}

                    {/* Expertise */}
                    {instructor.expertiseAreas && instructor.expertiseAreas.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                          <BookOpen className="h-4 w-4" /> Expertise
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {instructor.expertiseAreas.map((area, i) => (
                            <Badge key={i} variant="secondary"
                              className="text-sm px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-0">
                              {area}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Academic affiliations + Research — side by side on wide screens */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {affiliations.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                            <GraduationCap className="h-4 w-4" /> Academic Background
                          </h4>
                          <div className="space-y-2">
                            {affiliations.map((aff, i) => (
                              <div key={i} className="flex items-center gap-3 py-2.5 px-4 rounded-lg bg-muted/50 dark:bg-muted/30 border border-border/50">
                                {aff.logoUrl ? (
                                  <img
                                    src={aff.logoUrl}
                                    alt={aff.institution}
                                    className="h-9 w-9 object-contain flex-shrink-0 rounded"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                  />
                                ) : (
                                  <div className="h-9 w-9 rounded bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center flex-shrink-0">
                                    <GraduationCap className="h-4 w-4 text-indigo-500" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <span className="text-sm font-medium text-foreground block truncate">
                                    {aff.institution}
                                  </span>
                                  {(aff.role || aff.year) && (
                                    <span className="text-xs text-muted-foreground">
                                      {[aff.role, aff.year].filter(Boolean).join(" · ")}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {appointments.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                            <FlaskConical className="h-4 w-4" /> Research &amp; Appointments
                          </h4>
                          <div className="space-y-2">
                            {appointments.map((apt, i) => (
                              <div key={i} className="flex items-start gap-2 text-sm py-1">
                                <span className="text-indigo-500 mt-1 flex-shrink-0">•</span>
                                <span className="text-muted-foreground">
                                  <span className="font-medium text-foreground">{apt.organization}</span>
                                  {apt.role && <> — {apt.role}</>}
                                  {apt.period && <span className="text-xs ml-1">({apt.period})</span>}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Awards */}
                    {instructor.awards && (
                      <div>
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                          <Award className="h-4 w-4" /> Awards &amp; Recognition
                        </h4>
                        <p className="text-base text-muted-foreground leading-relaxed whitespace-pre-line">
                          {instructor.awards}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Instructor image lightbox ─────────────────────────────────────── */}
      <Dialog open={!!zoomedImage} onOpenChange={(o) => !o && setZoomedImage(null)}>
        <DialogContent className="max-w-sm p-0 overflow-hidden bg-black/90 border-0 shadow-2xl">
          <VisuallyHidden><DialogTitle>{zoomedImage?.name ?? "Instructor photo"}</DialogTitle></VisuallyHidden>
          <button
            onClick={() => setZoomedImage(null)}
            className="absolute top-3 right-3 z-50 rounded-full bg-black/60 hover:bg-black/80 text-white p-1.5 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
          {zoomedImage && (
            <div className="flex flex-col items-center">
              <img
                src={zoomedImage.url}
                alt={zoomedImage.name}
                className="w-full max-h-[70vh] object-contain"
              />
              <p className="text-white/80 text-sm font-medium py-3 px-4 text-center">
                {zoomedImage.name}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
