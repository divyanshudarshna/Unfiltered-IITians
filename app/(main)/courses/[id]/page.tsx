"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";
import { 
  ArrowLeft, 
  CheckCircle, 
  Clock, 
  Users, 
  // BookOpen, 
  // Tag, 
  Shield, 
  Award,
  FileText,
  Video,
  HelpCircle
} from "lucide-react";

interface Course {
  id: string;
  title: string;
  description?: string;
  price: number;
  actualPrice?: number;
  durationMonths: number;
  level?: string;
  enrolledStudents?: number;
  coupons?: { code: string; discountPct: number; validTill: string }[];
  contents?: any[];
}

interface AppliedCoupon {
  code: string;
  discountPct: number;
  discountAmount: number;
  newPrice: number;
}

export default function CourseDetailPage() {
  const { user } = useUser();
  const params = useParams();
  const router = useRouter();
  const { userId } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [loading, setLoading] = useState(false);
  const [couponLoading, setCouponLoading] = useState(false);

  // Fetch course info
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await fetch(`/api/courses/${params.id}`);
        if (!res.ok) throw new Error("Failed to fetch course");
        const data = await res.json();
        setCourse(data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load course details");
      }
    };
    fetchCourse();
  }, [params.id]);

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
          discountAmount: data.discountAmount,
          newPrice: data.newPrice
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

  // Remove applied coupon
  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    toast.info("Coupon removed");
  };
// Calculate final price (fallback to course price if no coupon)
const finalPrice = appliedCoupon?.newPrice ?? course?.price ?? 0;


const handleCheckout = async () => {
  if (!course || !userId) return;
  setLoading(true);
  
  try {
    // Request backend to create Razorpay order
    const res = await fetch(`/api/courses/${course.id}/razorpay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clerkUserId: userId,
        couponCode: appliedCoupon?.code || null,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || "Order creation failed");
    }

    const { order, finalPrice } = await res.json();

    // ✅ Always use backend-calculated amount
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: "Course Enrollment",
      description: course.title,
      order_id: order.id,
      handler: async (response: any) => {
        try {
          const verifyRes = await fetch(
            `/api/courses/${course.id}/razorpay/verify`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...response,
                couponCode: appliedCoupon?.code || null,
              }),
            }
          );

          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            toast.success("✅ Payment successful! You're now enrolled.");
            router.push("/dashboard/courses");
          } else {
            toast.error(verifyData.error || "Payment verification failed");
          }
        } catch (err) {
          console.error("Verification error:", err);
          toast.error("Payment verification error");
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
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="animate-pulse">
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
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header with back button */}
      <Button 
        variant="ghost" 
        onClick={() => router.back()} 
        className="mb-6 flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Courses
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
                  {course.durationMonths} month{course.durationMonths !== 1 ? 's' : ''}
                </div>
                {course.level && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    {course.level}
                  </Badge>
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
                <h3 className="font-semibold mb-3">What's included:</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center text-sm">
                    <Video className="h-4 w-4 mr-2 text-green-500" />
                    Video Lectures
                  </div>
                  <div className="flex items-center text-sm">
                    <FileText className="h-4 w-4 mr-2 text-blue-500" />
                    PDF Notes
                  </div>
                  <div className="flex items-center text-sm">
                    <HelpCircle className="h-4 w-4 mr-2 text-purple-500" />
                    Weekly Doubt Sessions
                  </div>
                  <div className="flex items-center text-sm">
                    <Award className="h-4 w-4 mr-2 text-amber-500" />
                    Quizzes & Assessments
                  </div>
                </div>
              </div>
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
              {/* Pricing */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Course Price</span>
                  <span className="font-medium">₹{course.price}</span>
                </div>

                {course.actualPrice && course.actualPrice > course.price && (
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span className="text-sm line-through">Original Price</span>
                    <span className="text-sm line-through">₹{course.actualPrice}</span>
                  </div>
                )}

                {appliedCoupon && (
                  <div className="flex justify-between items-center text-green-600">
                    <span className="text-sm">Discount {appliedCoupon.discountPct}%</span>
                    <span className="text-sm">-₹{appliedCoupon.discountAmount}</span>
                  </div>
                )}

                <Separator />

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
                    <Button onClick={removeCoupon} variant="outline" size="sm">
                      Remove
                    </Button>
                  ) : (
                    <Button 
                      onClick={applyCoupon} 
                      variant="outline" 
                      size="sm"
                      disabled={couponLoading || !couponCode.trim()}
                    >
                      {couponLoading ? "Applying..." : "Apply"}
                    </Button>
                  )}
                </div>
                {appliedCoupon && (
                  <div className="text-sm text-green-600 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Coupon "{appliedCoupon.code}" applied successfully
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 text-lg"
                size="lg"
              >
                {loading ? (
                  <>Processing Payment...</>
                ) : (
                  <>Pay Now = ₹{finalPrice}</>
                )}
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