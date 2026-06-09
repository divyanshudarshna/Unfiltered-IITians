"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { BuyButton } from "@/components/BuyButton";
import { useUser } from "@clerk/nextjs";
import { formatSessionExpiryDate, hasSessionExpiry } from "@/lib/guidance-session-expiry";
import {
  Clock,
  Users,
  User,
  Calendar,
  Tag,
  Star,
  Shield,
  BookOpen,
  PlayCircle,
  Quote,
} from "lucide-react";

interface GuidanceTestimonial {
  id: string;
  type: "YOUTUBE" | "TESTIMONIAL";
  youtubeUrl?: string | null;
  youtubeVideoId?: string | null;
  name?: string | null;
  sessionAttended?: string | null;
  description?: string | null;
  rating: number;
}

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
  expiryDate: string | null;
  createdAt: string;
  updatedAt: string;
  testimonials?: GuidanceTestimonial[];
}

interface EnrollmentStatus {
  isEnrolled: boolean;
  paymentStatus?: string;
}

interface CouponValidation {
  valid: boolean;
  coupon?: {
    id: string;
    code: string;
    name?: string;
    description?: string;
    discountType: string;
    discountValue: number;
  };
  discount?: {
    amount: number;
    finalPrice: number;
    savings: number;
    percentage: number;
  };
  error?: string;
}

interface PublicGeneralCoupon {
  id: string;
  code: string;
  name?: string | null;
  description?: string | null;
  discountLabel: string;
  discountType: string;
  discountValue: number;
  minOrderValue?: number | null;
}

export default function SessionPage() {
  const { id } = useParams<{ id: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [enrollmentStatus, setEnrollmentStatus] = useState<EnrollmentStatus>({ isEnrolled: false });
  
  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [couponValidation, setCouponValidation] = useState<CouponValidation | null>(null);
  const [isCouponLoading, setIsCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidation | null>(null);
  const [publicCoupons, setPublicCoupons] = useState<PublicGeneralCoupon[]>([]);
  const [isPublicCouponsLoading, setIsPublicCouponsLoading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<GuidanceTestimonial | null>(null);
  
  const { user, isLoaded } = useUser();
  const router = useRouter();

  // Phone number validation
  const validatePhone = (phoneNumber: string): boolean => {
    const phoneRegex = /^[6-9]\d{9}$/; // Indian mobile number validation
    return phoneRegex.test(phoneNumber.replaceAll(/\D/g, ""));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replaceAll(/\D/g, ""); // Remove non-digits
    if (value.length <= 10) {
      setPhone(value);
      setPhoneError("");
      
      if (value.length === 10 && !validatePhone(value)) {
        setPhoneError("Please enter a valid 10-digit mobile number");
      } else if (value.length > 0 && value.length < 10) {
        setPhoneError("Phone number must be 10 digits");
      }
    }
  };

  // Coupon validation function
  const validateCoupon = async (code: string) => {
    if (!code.trim() || !session) return;

    if (!user?.id) {
      toast.error('Please sign in to apply a coupon');
      return;
    }

    setIsCouponLoading(true);
    setCouponValidation(null);

    try {
      const response = await fetch('/api/general-coupons/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          userId: user.id,
          productType: 'GUIDANCE_SESSION',
          productId: session.id,
          orderValue: session.discountedPrice,
        }),
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        setCouponValidation(data);
        toast.success(`🎉 Coupon applied! You saved ₹${data.discount.savings.toFixed(2)}`);
      } else {
        setCouponValidation({ valid: false, error: data.error || 'Invalid coupon code' });
        toast.error(data.error || 'Invalid coupon code');
      }
    } catch (error) {
      console.error('Coupon validation error:', error);
      setCouponValidation({ valid: false, error: 'Failed to validate coupon. Please try again.' });
      toast.error('Failed to validate coupon. Please try again.');
    } finally {
      setIsCouponLoading(false);
    }
  };

  // Apply coupon function
  const applyCoupon = () => {
    if (couponValidation?.valid) {
      setAppliedCoupon(couponValidation);
      setCouponCode('');
      setCouponValidation(null);
    }
  };

  // Remove applied coupon
  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponValidation(null);
    toast.info('Coupon removed');
  };

  const usePublicCoupon = (code: string) => {
    const normalizedCode = code.trim().toUpperCase();
    setCouponCode(normalizedCode);
    validateCoupon(normalizedCode);
  };

  // Calculate final price with coupon
  const getFinalPrice = () => {
    if (appliedCoupon?.valid && appliedCoupon.discount) {
      return appliedCoupon.discount.finalPrice;
    }
    return session?.discountedPrice || 0;
  };

  const getSavings = () => {
    if (appliedCoupon?.valid && appliedCoupon.discount) {
      return appliedCoupon.discount.savings;
    }
    return 0;
  };

  // Check enrollment status
  const checkEnrollmentStatus = async () => {
    if (!user?.id || !id) return;
    
    try {
      const res = await fetch(`/api/sessions/${id}/enrollment-status`);
      if (res.ok) {
        const data = await res.json();
        setEnrollmentStatus(data);
      }
    } catch (error) {
      console.error("Error checking enrollment status:", error);
    }
  };

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

  useEffect(() => {
    if (!session) return;

    const fetchPublicCoupons = async () => {
      try {
        setIsPublicCouponsLoading(true);
        const params = new URLSearchParams({
          productType: 'GUIDANCE_SESSION',
          productId: session.id,
          orderValue: String(session.discountedPrice),
        });
        const response = await fetch(`/api/general-coupons/public?${params.toString()}`);

        if (!response.ok) throw new Error('Failed to fetch public coupons');

        const data = await response.json();
        setPublicCoupons(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Public coupons error:', error);
      } finally {
        setIsPublicCouponsLoading(false);
      }
    };

    fetchPublicCoupons();
  }, [session]);

  useEffect(() => {
    if (isLoaded && user) {
      checkEnrollmentStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user, id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header Skeleton */}
          <div className="text-center space-y-4">
            <Skeleton className="h-8 w-32 mx-auto" />
            <Skeleton className="h-12 w-96 mx-auto" />
            <Skeleton className="h-6 w-80 mx-auto" />
          </div>

          {/* Main Content Grid Skeleton */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Content Cards Skeleton */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="rounded-3xl shadow-xl">
                <CardHeader>
                  <Skeleton className="h-8 w-48" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="rounded-3xl shadow-xl">
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-28" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Skeleton */}
            <div className="space-y-6">
              <Card className="rounded-3xl shadow-xl">
                <CardHeader>
                  <Skeleton className="h-6 w-24" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-32" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="rounded-3xl shadow-xl">
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
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
            The session you&apos;re looking for doesn&apos;t exist or has been removed.
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
  const sessionHasExpiry = hasSessionExpiry(session.expiryDate);
  const sessionExpiryLabel = formatSessionExpiryDate(session.expiryDate);
  const SessionTypeIcon = session.type === "ONE_ON_ONE" ? User : Users;
  const sessionTypeLabel = session.type === "ONE_ON_ONE" ? "One on One Session" : "Group Session";
  const testimonials = session.testimonials || [];

  return (
    <div className="min-h-screen bg-gradient-to-br py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-6 xl:px-8">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-3 sm:space-y-4">
          <Badge
            variant="secondary"
            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700 text-sm sm:text-base"
          >
            <SessionTypeIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            {sessionTypeLabel}
          </Badge>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400 bg-clip-text text-transparent">
            {session.title}
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-300 max-w-2xl lg:max-w-3xl mx-auto leading-relaxed px-2 sm:px-0">
            {session.description}
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 xl:grid-cols-3 gap-6 sm:gap-8">
          {/* Session Details - Takes more space on large screens */}
          <div className="lg:col-span-3 xl:col-span-2 space-y-4 sm:space-y-6">
            {/* Content Card */}
            <Card className="rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-white/20 dark:border-gray-700/50">
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

            {/* Tags Card - only show if tags exist */}
            {session.tags && session.tags.length > 0 && (
              <Card className="rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-white/20 dark:border-gray-700/50">
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
            )}
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
                      ₹{getFinalPrice()}
                    </span>
                    {isDiscounted && (
                      <span className="text-lg line-through text-purple-200">
                        ₹{session.price}
                      </span>
                    )}
                  </div>
                  {appliedCoupon?.valid && (
                    <div className="bg-green-100/20 border border-green-400/30 rounded-lg p-2 mb-2">
                      <div className="flex items-center justify-between">
                        <span className="text-green-300 text-sm font-medium">
                          🎫 {appliedCoupon.coupon?.code}
                        </span>
                        <button
                          onClick={removeCoupon}
                          className="text-green-300 hover:text-green-200 text-sm"
                        >
                          ✕
                        </button>
                      </div>
                      <p className="text-green-200 text-xs">
                        You saved ₹{getSavings().toFixed(2)}!
                      </p>
                    </div>
                  )}
                  <p className="text-purple-100 text-sm">
                    {sessionHasExpiry
                      ? `One-time payment • Valid until ${sessionExpiryLabel}`
                      : "One time session"}
                  </p>
                </div>

                {/* Enrollment Form */}
                <div className="space-y-4">
                  {enrollmentStatus.isEnrolled ? (
                    <div className="text-center space-y-3">
                      <div className="bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg p-4">
                        <div className="flex items-center justify-center gap-2 text-green-700 dark:text-green-300">
                          <Shield className="h-5 w-5" />
                          <span className="font-medium">Already Enrolled</span>
                        </div>
                        <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                          You have successfully enrolled in this session
                        </p>
                      </div>
                      <Button 
                        onClick={() => {
                          const encodedName = encodeURIComponent(user?.firstName?.[0] || "user");
                          router.push(`/${encodedName}/dashboard`);
                        }}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl"
                      >
                        Go to Dashboard
                      </Button>
                    </div>
                  ) : (
                    <>
                      {/* Coupon Code Section */}
                      {!appliedCoupon?.valid && (
                        <div className="bg-blue-50/20 border border-blue-400/30 rounded-lg p-4 mb-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Badge className="bg-yellow-600 text-white text-xs px-2 py-1">
                              💰 DISCOUNT
                            </Badge>
                            <span className="text-purple-100 text-sm font-medium">
                              Have a coupon code?
                            </span>
                          </div>
                          
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <Input
                                placeholder="Enter coupon code"
                                value={couponCode}
                                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                className="bg-white/20 border-white/30 text-white placeholder-purple-200 rounded-xl focus:bg-white/30 focus:border-white/50"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    validateCoupon(couponCode);
                                  }
                                }}
                              />
                            </div>
                            <Button
                              onClick={() => validateCoupon(couponCode)}
                              disabled={!couponCode.trim() || isCouponLoading}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 rounded-xl disabled:opacity-50"
                            >
                              {isCouponLoading ? '...' : 'Apply'}
                            </Button>
                          </div>
                          
                          {couponValidation && !couponValidation.valid && (
                            <p className="text-red-300 text-xs mt-2">
                              {couponValidation.error}
                            </p>
                          )}
                          
                          {couponValidation?.valid && (
                            <div className="mt-3 p-3 bg-green-100/20 border border-green-400/30 rounded-lg">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-green-300 text-sm font-medium">
                                  ✅ {couponValidation.coupon?.code}
                                </span>
                                <span className="text-green-200 text-sm">
                                  -₹{couponValidation.discount?.savings.toFixed(2)}
                                </span>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  onClick={applyCoupon}
                                  className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 rounded-lg"
                                >
                                  Apply Coupon
                                </Button>
                                <Button
                                  onClick={() => setCouponValidation(null)}
                                  variant="outline"
                                  className="border-green-400/30 text-green-300 hover:bg-green-100/10 text-xs px-3 py-1 rounded-lg"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          )}

                          <div className="mt-4 border-t border-blue-300/20 pt-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Tag className="h-4 w-4 text-yellow-300" />
                              <p className="text-sm font-semibold text-purple-100">Available Coupons</p>
                            </div>

                            {isPublicCouponsLoading ? (
                              <p className="text-xs text-purple-200">Checking available coupons...</p>
                            ) : publicCoupons.length > 0 ? (
                              <div className="grid gap-2">
                                {publicCoupons.map((coupon) => (
                                  <button
                                    key={coupon.id}
                                    type="button"
                                    onClick={() => usePublicCoupon(coupon.code)}
                                    disabled={isCouponLoading}
                                    className="flex items-center justify-between rounded-xl border border-emerald-300/30 bg-emerald-400/10 px-3 py-2 text-left transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    <span>
                                      <span className="block text-sm font-semibold text-white">
                                        {coupon.name || coupon.code}
                                      </span>
                                      <span className="block text-xs text-emerald-200">
                                        {coupon.discountLabel}
                                      </span>
                                    </span>
                                    <span className="rounded-full bg-white/15 px-2 py-1 text-xs font-semibold text-white">
                                      {coupon.code}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-purple-200">No public coupons available for this session.</p>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3 mb-4">
                        <p className="text-sm text-blue-700 dark:text-blue-300 text-center">
                          📱 Phone number is required for session enrollment and communication
                        </p>
                      </div>
                      
                      <div>
                        <label 
                          htmlFor="phone-input"
                          className="text-sm font-medium text-purple-100 mb-2 block"
                        >
                          Phone Number *
                        </label>
                        <Input
                          id="phone-input"
                          placeholder="Enter 10-digit mobile number"
                          value={phone}
                          onChange={handlePhoneChange}
                          className={`bg-white/20 border-white/30 text-white placeholder-purple-200 rounded-xl focus:bg-white/30 focus:border-white/50 ${
                            phoneError ? 'border-red-400 focus:border-red-400' : ''
                          }`}
                          maxLength={10}
                        />
                        {phoneError && (
                          <p className="text-red-300 text-xs mt-1">{phoneError}</p>
                        )}
                        {phone.length === 10 && !phoneError && (
                          <p className="text-green-300 text-xs mt-1">✓ Valid phone number</p>
                        )}
                      </div>
                      
                      {isLoaded && user ? (
                        <BuyButton
                          clerkUserId={user.id}
                          itemId={session.id}
                          itemType="session"
                          title={session.title}
                          amount={getFinalPrice()}
                          studentPhone={phone}
                          disabled={phone.length !== 10 || !!phoneError}
                          onPurchaseSuccess={() => {
                            toast.success("🎉 Session enrolled successfully!");
                            setEnrollmentStatus({ isEnrolled: true, paymentStatus: "SUCCESS" });
                          }}
                        />
                      ) : (
                        <Button
                          disabled
                          className="w-full bg-white/30 text-purple-100 border-white/30 hover:bg-white/40 font-semibold py-3 rounded-xl"
                        >
                          Please sign in to enroll
                        </Button>
                      )}
                      
                      {phone.length !== 10 || phoneError ? (
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3">
                          <p className="text-xs text-amber-700 dark:text-amber-300 text-center">
                            Please enter a valid 10-digit phone number to proceed
                          </p>
                        </div>
                      ) : null}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Session Info Card */}
            <Card className="rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-white/20 dark:border-gray-700/50">
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
                    {sessionHasExpiry ? "Expires:" : "Access:"}
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white ml-auto">
                    {sessionHasExpiry ? sessionExpiryLabel : "One time session"}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Guarantee Card */}
            {/* <Card className="rounded-3xl border-0 shadow-xl bg-gradient-to-br from-green-700 to-emerald-600 text-white">
              <CardContent className="p-6 text-center">
                <Shield className="h-12 w-12 mx-auto mb-3 text-white/90" />
                <h4 className="font-semibold mb-2">
                  100% Satisfaction Guarantee
                </h4>
                <p className="text-sm text-white/90 opacity-90">
                  Full refund if not satisfied within 7 days
                </p>
              </CardContent>
            </Card> */}
          </div>
        </div>

        {testimonials.length > 0 && (
          <section className="space-y-4">
            <div className="text-center space-y-2">
              <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/40 dark:text-purple-200">
                Student Stories
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                What learners say about this session
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((testimonial) => {
                const isVideo = testimonial.type === "YOUTUBE" && testimonial.youtubeVideoId;

                if (isVideo) {
                  return (
                    <button
                      key={testimonial.id}
                      type="button"
                      onClick={() => setSelectedVideo(testimonial)}
                      className="group overflow-hidden rounded-3xl border border-white/20 bg-white/80 text-left shadow-xl backdrop-blur-sm transition hover:-translate-y-1 hover:shadow-2xl dark:border-gray-700/50 dark:bg-gray-800/80"
                    >
                      <div className="relative aspect-video bg-gray-900">
                        <img
                          src={`https://img.youtube.com/vi/${testimonial.youtubeVideoId}/hqdefault.jpg`}
                          alt="Guidance session video testimonial"
                          className="h-full w-full object-cover opacity-90 transition group-hover:scale-105 group-hover:opacity-100"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-purple-700 shadow-lg transition group-hover:scale-110">
                            <PlayCircle className="h-8 w-8" />
                          </span>
                        </div>
                      </div>
                      <div className="p-5">
                        <p className="text-sm font-semibold text-purple-700 dark:text-purple-300">Video Testimonial</p>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                          Click to watch the student experience for this guidance session.
                        </p>
                      </div>
                    </button>
                  );
                }

                return (
                  <Card
                    key={testimonial.id}
                    className="rounded-3xl border border-white/20 bg-white/80 shadow-xl backdrop-blur-sm dark:border-gray-700/50 dark:bg-gray-800/80"
                  >
                    <CardContent className="p-5 space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{testimonial.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {testimonial.sessionAttended || session.title}
                          </p>
                        </div>
                        <Quote className="h-6 w-6 text-purple-300" />
                      </div>
                      <div className="flex items-center gap-1 text-amber-500">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star
                            key={index}
                            className={`h-4 w-4 ${index < Math.round(testimonial.rating || 5) ? "fill-amber-400" : "text-gray-300"}`}
                          />
                        ))}
                      </div>
                      <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                        {testimonial.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        <Dialog open={!!selectedVideo} onOpenChange={(open) => !open && setSelectedVideo(null)}>
          <DialogContent className="max-w-4xl border-0 bg-black p-0 text-white">
            <DialogHeader className="px-4 pt-4">
              <DialogTitle>Video Testimonial</DialogTitle>
            </DialogHeader>
            {selectedVideo?.youtubeVideoId && (
              <iframe
                src={`https://www.youtube.com/embed/${selectedVideo.youtubeVideoId}?autoplay=1&rel=0`}
                title="Guidance session video testimonial"
                className="aspect-video w-full rounded-b-lg"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </DialogContent>
        </Dialog>

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
