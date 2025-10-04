"use client";

import { BuyButton } from "@/components/BuyButton";
import { toast } from "sonner";

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
}: BundlePurchaseSectionProps) {
  const handlePurchaseSuccess = () => {
    toast.success("✅ Payment successful! Access granted to all mock tests!", {
      duration: 5000,
    });
    
    // Refresh the page to show purchased state
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  };

  if (isPurchased) {
    return (
      <section className="max-w-lg mx-auto p-6 rounded-2xl shadow-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-center">
        <div className="text-green-600 dark:text-green-400 mb-2">
          <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <h3 className="text-xl font-bold text-green-800 dark:text-green-200 mb-2">Bundle Purchased!</h3>
        <p className="text-green-700 dark:text-green-300 text-sm">
          You have access to all {mockCount} mock tests in this bundle. Start practicing now!
        </p>
      </section>
    );
  }

  return (
    <section className="max-w-lg mx-auto p-6 rounded-2xl shadow-lg bg-white dark:bg-zinc-900 border border-gray-200 dark:border-gray-700">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Complete Bundle</h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm">Get access to all {mockCount} mock tests</p>
      </div>
      
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-3 mb-2">
          <span className="text-3xl font-bold text-green-600 dark:text-green-400">
            ₹{finalPrice}
          </span>
          {discountPercentage > 0 && (
            <span className="text-lg line-through text-gray-400">₹{basePrice}</span>
          )}
        </div>
        {discountPercentage > 0 && (
          <p className="text-sm text-red-500 font-semibold">
            Save {discountPercentage}% • Limited Time Offer 🎉
          </p>
        )}
      </div>

      <BuyButton
        clerkUserId={clerkUserId}
        itemId={bundleId}
        itemType="mockBundle"
        title={bundleTitle}
        amount={finalPrice}
        mockIds={mockIds}
        onPurchaseSuccess={handlePurchaseSuccess}
      />
    </section>
  );
}