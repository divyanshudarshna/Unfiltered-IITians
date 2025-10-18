"use client";

import { BuyButton } from "@/components/BuyButton";
import { toast } from "sonner";
import { useState } from "react";

// Coupon validation response type
interface CouponValidationResponse {
  valid: boolean;
  coupon?: {
    code: string;
    name: string;
    description: string;
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

interface BundlePurchaseSectionProps {
  clerkUserId: string;
  bundleId: string;
  bundleTitle: string;
  finalPrice: number;
  mockIds: string[];
  basePrice: number;
  discountPercentage: number;
  isPurchased: boolean;
  mockCount: number;
  purchasedMockIds?: string[];
  ownsAllIndividually?: boolean;
}

export default function BundlePurchaseSection({
  clerkUserId,
  bundleId,
  bundleTitle,
  finalPrice,
  mockIds,
  basePrice,
  discountPercentage,
  isPurchased,
  mockCount,
  purchasedMockIds = [],
  ownsAllIndividually = false,
}: Readonly<BundlePurchaseSectionProps>) {
  // Coupon states
  const [couponCode, setCouponCode] = useState("");
  const [couponValidation, setCouponValidation] = useState<CouponValidationResponse | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidationResponse | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const handlePurchaseSuccess = () => {
    toast.success("✅ Payment successful! Access granted to all mock tests!", {
      duration: 5000,
    });
    
    // Refresh the page to show purchased state
    setTimeout(() => {
      globalThis.location.reload();
    }, 2000);
  };

  // Validate coupon
  const validateCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }

    setIsValidating(true);
    setCouponValidation(null);

    try {
      const response = await fetch('/api/general-coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode.trim(),
          userId: clerkUserId,
          productType: 'MOCK_BUNDLE',
          productId: bundleId,
          orderValue: finalPrice
        })
      });

      const result: CouponValidationResponse = await response.json();
      setCouponValidation(result);

      if (result.valid) {
        toast.success(`✅ Coupon "${couponCode}" applied successfully!`);
      } else {
        toast.error(result.error || 'Invalid coupon code');
      }
    } catch (error) {
      console.error('Coupon validation error:', error);
      toast.error('Failed to validate coupon. Please try again.');
      setCouponValidation({ valid: false, error: 'Network error' });
    } finally {
      setIsValidating(false);
    }
  };

  // Apply coupon
  const applyCoupon = () => {
    if (couponValidation?.valid) {
      setAppliedCoupon(couponValidation);
      setCouponCode('');
      setCouponValidation(null);
      toast.info('Coupon applied to your order');
    }
  };

  // Remove coupon
  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponValidation(null);
    toast.info('Coupon removed');
  };

  // Calculate final price with coupon
  const getFinalPrice = (): number => {
    if (appliedCoupon?.valid && appliedCoupon.discount) {
      return appliedCoupon.discount.finalPrice;
    }
    return finalPrice;
  };

  const getSavings = (): number => {
    if (appliedCoupon?.valid && appliedCoupon.discount) {
      return appliedCoupon.discount.savings;
    }
    return 0;
  };

  if (isPurchased) {
    const ownershipText = ownsAllIndividually 
      ? "You own all mock tests individually!"
      : "Bundle Purchased!";
    const descriptionText = ownsAllIndividually
      ? `You have purchased all ${mockCount} mock tests in this bundle individually. You have full access!`
      : `You have access to all ${mockCount} mock tests in this bundle. Start practicing now!`;

    return (
      <section className="max-w-lg mx-auto p-6 rounded-2xl shadow-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-center">
        <div className="text-green-600 dark:text-green-400 mb-2">
          <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <h3 className="text-xl font-bold text-green-800 dark:text-green-200 mb-2">{ownershipText}</h3>
        <p className="text-green-700 dark:text-green-300 text-sm">
          {descriptionText}
        </p>
      </section>
    );
  }

  // Calculate remaining mocks to purchase
  const remainingMocks = mockIds.filter(id => !purchasedMockIds.includes(id));
  const partiallyOwned = purchasedMockIds.length > 0 && purchasedMockIds.length < mockIds.length;

  return (
    <section className="max-w-lg mx-auto p-6 rounded-2xl shadow-lg bg-white dark:bg-zinc-900 border border-gray-200 dark:border-gray-700">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Complete Bundle</h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Get access to all {mockCount} mock tests
        </p>
        
        {partiallyOwned && (
          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              📚 You own {purchasedMockIds.length} out of {mockCount} tests individually
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              Purchase the bundle to get the remaining {remainingMocks.length} tests at a discounted rate!
            </p>
          </div>
        )}
      </div>
      
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-3 mb-2">
          <span className="text-3xl font-bold text-green-600 dark:text-green-400">
            ₹{getFinalPrice()}
          </span>
          {(discountPercentage > 0 || getSavings() > 0) && (
            <span className="text-lg line-through text-gray-400">₹{basePrice}</span>
          )}
        </div>
        {discountPercentage > 0 && !appliedCoupon && (
          <p className="text-sm text-red-500 font-semibold">
            Save {discountPercentage}% • Limited Time Offer 🎉
          </p>
        )}
        {getSavings() > 0 && (
          <p className="text-sm text-green-600 font-semibold">
            🎉 Coupon Applied! You save ₹{getSavings()}
          </p>
        )}
      </div>

      {/* Coupon Section */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Have a coupon code?
        </h3>
        
        {appliedCoupon ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <div>
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">
                    {appliedCoupon.coupon?.code}
                  </span>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    {appliedCoupon.coupon?.description}
                  </p>
                </div>
              </div>
              <button
                onClick={removeCoupon}
                className="text-red-500 hover:text-red-700 text-sm font-medium"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Enter coupon code"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                onKeyDown={(e) => e.key === 'Enter' && validateCoupon()}
              />
              <button
                onClick={validateCoupon}
                disabled={isValidating || !couponCode.trim()}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
              >
                {isValidating ? 'Validating...' : 'Apply'}
              </button>
            </div>
            
            {couponValidation && !couponValidation.valid && (
              <p className="text-red-500 text-xs">
                {couponValidation.error || 'Invalid coupon code'}
              </p>
            )}
            
            {couponValidation && couponValidation.valid && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">
                    {couponValidation.coupon?.code}
                  </span>
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                    -₹{couponValidation.discount?.savings}
                  </span>
                </div>
                <p className="text-xs text-green-600 dark:text-green-400 mb-3">
                  {couponValidation.coupon?.description}
                </p>
                <button
                  onClick={applyCoupon}
                  className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Apply Coupon
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <BuyButton
        clerkUserId={clerkUserId}
        itemId={bundleId}
        itemType="mockBundle"
        title={bundleTitle}
        amount={getFinalPrice()}
        mockIds={mockIds}
        onPurchaseSuccess={handlePurchaseSuccess}
      />
    </section>
  );
}