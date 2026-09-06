"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RazorpayResponse } from "../types/razorpay";
import { toast } from "sonner";
import { getCheckoutPollingDecision, type CheckoutPollingStatus } from "@/lib/checkout-status";

const v2MockCheckoutEnabled = process.env.NEXT_PUBLIC_V2_MOCK_CHECKOUT_ENABLED === "true";
const v2MockSubscriptionEnabled = process.env.NEXT_PUBLIC_V2_MOCK_SUBSCRIPTIONS_ENABLED === "true";
const checkoutPollIntervalMs = 2_000;
const checkoutPollAttempts = 24;

function mockCheckoutStorageKey(mockTestId: string) {
  return `v2-mock-checkout:${mockTestId}`;
}

interface Props {
  mockTestId: string;
  clerkUserId: string;
  mockTitle: string;
  amount: number;
  recurringPlan?: { amountPaise: number };
  onPurchaseSuccess?: () => void;
}

export const BuyMockButton = ({ mockTestId, clerkUserId, mockTitle, amount, recurringPlan, onPurchaseSuccess }: Props) => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const waitForV2Fulfillment = async (checkoutId: string) => {
    toast.loading("Payment received. Confirming access...");

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
        window.sessionStorage.removeItem(mockCheckoutStorageKey(mockTestId));
        toast.dismiss();
        toast.success("Payment confirmed. Mock access is now active.");
        onPurchaseSuccess?.();
        router.refresh();
        return;
      }

      if (decision === "FAILED") {
        window.sessionStorage.removeItem(mockCheckoutStorageKey(mockTestId));
        toast.dismiss();
        toast.error("This checkout could not be completed.");
        return;
      }

      if (decision === "REQUIRES_REVIEW") {
        window.sessionStorage.removeItem(mockCheckoutStorageKey(mockTestId));
        toast.dismiss();
        toast.error("Your payment needs review. Please contact support with your payment details.");
        return;
      }
    }

    toast.dismiss();
    toast.info("Payment is still being confirmed. Your access will appear automatically once confirmed.");
  };

  const handleV2Buy = async (checkoutType: "ONE_TIME" | "RECURRING") => {
    const storageKey = `${mockCheckoutStorageKey(mockTestId)}:${checkoutType.toLowerCase()}`;
    const idempotencyKey = window.sessionStorage.getItem(storageKey) ?? `mock:${mockTestId}:${checkoutType}:${crypto.randomUUID()}`;
    window.sessionStorage.setItem(storageKey, idempotencyKey);
    const res = await fetch("/api/checkout/intents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productType: "MOCK_TEST",
        productId: mockTestId,
        checkoutType,
        idempotencyKey,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Unable to create checkout");
    }
    if (data.checkout?.status === "PAID" && data.checkout?.id) {
      await waitForV2Fulfillment(data.checkout.id);
      return;
    }
    if (!data.checkout?.id) throw new Error("Payment provider did not return a checkout");

    const razorpay = new window.Razorpay({
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      name: "UnFiltered IITians ",
      description: mockTitle,
      ...(checkoutType === "RECURRING"
        ? data.subscription?.id
          ? { subscription_id: data.subscription.id }
          : (() => { throw new Error("Payment provider did not return a subscription"); })()
        : data.order?.id
          ? { amount: data.order.amount, currency: data.order.currency, order_id: data.order.id }
          : (() => { throw new Error("Payment provider did not return a checkout order"); })()),
      handler: () => {
        void waitForV2Fulfillment(data.checkout.id);
      },
      theme: { color: "#6366F1" },
    });

    razorpay.open();
  };

  const handleBuy = async () => {
    if (!clerkUserId) {
      toast.error("Please sign in first.");
      return;
    }

    try {
      setLoading(true);
      toast.loading("Creating payment order...");

      if (v2MockCheckoutEnabled) {
        await handleV2Buy("ONE_TIME");
        toast.dismiss();
        return;
      }

      const res = await fetch("/api/payment/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          clerkUserId, 
          itemId: mockTestId,
          itemType: "mockTest"
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.dismiss();
        toast.error(data.error || "Something went wrong");
        return;
      }

      toast.dismiss();
      const { order } = data;
      const razorpay = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        amount: order.amount,
        currency: "INR",
        name: "UnFiltered IITians ",
        description: mockTitle,
        order_id: order.id,
        handler: function (response: RazorpayResponse) {
          verifyPayment(response);
        },
        theme: { color: "#6366F1" },
      });

      razorpay.open();
    } catch (err) {
      console.error("Error in handleBuy:", err);
      toast.dismiss();
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!clerkUserId || !recurringPlan) return;
    try {
      setLoading(true);
      toast.loading("Creating monthly subscription...");
      await handleV2Buy("RECURRING");
      toast.dismiss();
    } catch (error) {
      console.error("Error creating mock subscription:", error);
      toast.dismiss();
      toast.error(error instanceof Error ? error.message : "Unable to create subscription");
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async (response: RazorpayResponse) => {
    try {
      toast.loading("Verifying payment...");
      
      const verifyRes = await fetch("/api/payment/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        }),
      });

      await verifyRes.json();
      if (!verifyRes.ok) {
        toast.dismiss();
        toast.error("Payment verification failed");
        return;
      }

      toast.dismiss();
      toast.success("Payment verified and subscription updated!");
      onPurchaseSuccess?.(); // ✅ Update UI instantly
      router.refresh(); // ✅ Re-fetch server data to keep in sync
    } catch (err) {
      console.error("Verification error:", err);
      toast.dismiss();
      toast.error("Error during payment verification.");
    }
  };

  const canSubscribe = v2MockSubscriptionEnabled && v2MockCheckoutEnabled && recurringPlan;

  return (
   <div className="space-y-2 w-full">
   <button
  onClick={handleBuy}
  disabled={loading}
  className="relative overflow-hidden group bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 dark:from-amber-600 dark:to-amber-700 dark:hover:from-amber-700 dark:hover:to-amber-800 text-white font-medium px-6 py-3 rounded-lg transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-500/25 dark:hover:shadow-amber-600/20"
>
  {/* Animated background shine effect */}
  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full group-hover:duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
  
  {/* Button content */}
  <span className="relative flex items-center justify-center">
    {loading ? (
      <>
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Processing...
      </>
    ) : (
      <>
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
        </svg>
        Buy for ₹{amount}
      </>
    )}
  </span>
</button>
{canSubscribe && (
  <button
    onClick={handleSubscribe}
    disabled={loading}
    className="w-full rounded-lg border border-indigo-500 px-4 py-2 text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-50 disabled:opacity-60 dark:text-indigo-300 dark:hover:bg-indigo-950"
  >
    Subscribe for ₹{(recurringPlan.amountPaise / 100).toFixed(2)}/month
  </button>
)}
</div>
  );
};
