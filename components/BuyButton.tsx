"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RazorpayResponse } from "../types/razorpay";
import { getCheckoutPollingDecision, type CheckoutPollingStatus } from "@/lib/checkout-status";

const v2BundleCheckoutEnabled = process.env.NEXT_PUBLIC_V2_BUNDLE_CHECKOUT_ENABLED === "true";
const v2BundleSubscriptionEnabled = process.env.NEXT_PUBLIC_V2_BUNDLE_SUBSCRIPTIONS_ENABLED === "true";
const checkoutPollIntervalMs = 2_000;
const checkoutPollAttempts = 24;

function bundleCheckoutStorageKey(bundleId: string) {
  return `v2-bundle-checkout:${bundleId}`;
}

interface BuyButtonProps {
  clerkUserId: string;
  itemId: string;
  itemType: "mockTest" | "mockBundle" | "course" | "session"; // ✅ added session
  title: string;
  amount: number;
  mockIds?: string[];
  studentPhone?: string;
  couponCode?: string;
  recurringPlan?: { amountPaise: number };
  onPurchaseSuccess?: () => void;
  disabled?: boolean; // ✅ new
}

export const BuyButton = ({
  clerkUserId,
  itemId,
  itemType,
  title,
  amount,
  mockIds,
  studentPhone,
  couponCode,
  recurringPlan,
  onPurchaseSuccess,
  disabled = false,
}: BuyButtonProps) => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const waitForV2Fulfillment = async (checkoutId: string) => {
    toast.loading("Payment received. Confirming access...", { id: "verify-payment" });

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
        window.sessionStorage.removeItem(bundleCheckoutStorageKey(itemId));
        toast.success("Payment confirmed. Bundle access is now active.", { id: "verify-payment" });
        onPurchaseSuccess?.();
        router.refresh();
        return;
      }
      if (decision === "FAILED") {
        window.sessionStorage.removeItem(bundleCheckoutStorageKey(itemId));
        toast.error("This checkout could not be completed.", { id: "verify-payment" });
        return;
      }
      if (decision === "REQUIRES_REVIEW") {
        window.sessionStorage.removeItem(bundleCheckoutStorageKey(itemId));
        toast.error("Your payment needs review. Please contact support with your payment details.", { id: "verify-payment" });
        return;
      }
    }

    toast.info("Payment is still being confirmed. Your access will appear automatically once confirmed.", { id: "verify-payment" });
  };

  const handleV2BundleCheckout = async (checkoutType: "ONE_TIME" | "RECURRING") => {
    const storageKey = `${bundleCheckoutStorageKey(itemId)}:${checkoutType.toLowerCase()}`;
    const idempotencyKey = window.sessionStorage.getItem(storageKey) ?? `bundle:${itemId}:${checkoutType}:${crypto.randomUUID()}`;
    window.sessionStorage.setItem(storageKey, idempotencyKey);

    const response = await fetch("/api/checkout/intents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productType: "MOCK_BUNDLE",
        productId: itemId,
        checkoutType,
        ...(checkoutType === "ONE_TIME" ? { couponCode } : {}),
        idempotencyKey,
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to create checkout");
    if (data.checkout?.status === "PAID" && data.checkout?.id) {
      await waitForV2Fulfillment(data.checkout.id);
      return;
    }
    if (!data.checkout?.id) throw new Error("Payment provider did not return a checkout");

    const razorpay = new window.Razorpay({
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      name: "UnFiltered IITians",
      description: title,
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

    if (itemType === "mockBundle" && (!mockIds || mockIds.length === 0)) {
      toast.error("No mocks selected for purchase!");
      return;
    }

    if (itemType === "session" && !studentPhone) {
      toast.error("Please enter your phone number to enroll.");
      return;
    }

    try {
      setLoading(true);
      toast.loading("Creating payment order...", { id: "payment-process" });

      if (itemType === "mockBundle" && v2BundleCheckoutEnabled) {
        await handleV2BundleCheckout("ONE_TIME");
        toast.dismiss("payment-process");
        return;
      }

      // Create order API request
      const res = await fetch("/api/payment/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerkUserId,
          itemId,
          itemType,
          mockIds,
          studentPhone,
          amount,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Something went wrong during order creation", { id: "payment-process" });
        return;
      }

      const { order } = data;
      toast.dismiss("payment-process");
      toast.success("Opening payment gateway...");

      // Open Razorpay payment
      const razorpay = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        amount: order.amount,
        currency: "INR",
        name: "UnFiltered IITians ",
        description: title,
        order_id: order.id,
        handler: function (response: RazorpayResponse) {
          verifyPayment(response);
        },
        theme: { color: "#6366F1" },
      });

      razorpay.open();
    } catch (err) {
      console.error("Error in handleBuy:", err);
      toast.error("Something went wrong", { id: "payment-process" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (itemType !== "mockBundle" || !recurringPlan) return;
    try {
      setLoading(true);
      toast.loading("Creating monthly subscription...", { id: "payment-process" });
      await handleV2BundleCheckout("RECURRING");
      toast.dismiss("payment-process");
    } catch (error) {
      console.error("Error creating bundle subscription:", error);
      toast.error(error instanceof Error ? error.message : "Unable to create subscription", { id: "payment-process" });
    } finally {
      setLoading(false);
    }
  };

  const canSubscribe = itemType === "mockBundle" && v2BundleCheckoutEnabled && v2BundleSubscriptionEnabled && recurringPlan;

  const verifyPayment = async (response: RazorpayResponse) => {
    try {
      toast.loading("Verifying payment...", { id: "verify-payment" });

      const verifyRes = await fetch("/api/payment/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        toast.error(verifyData.error || "Payment verification failed", { id: "verify-payment" });
        return;
      }

      toast.success("Payment successful! Access granted to all mock tests!", {
        id: "verify-payment",
        duration: 5000 
      });
      
      onPurchaseSuccess?.();
      router.refresh();
    } catch (err) {
      console.error("Verification error:", err);
      toast.error("Error during payment verification.", { id: "verify-payment" });
    }
  };

  return (
    <div className="w-full space-y-2">
    <button
      onClick={handleBuy}
      disabled={loading || disabled}
      className={`relative overflow-hidden group ${
        disabled
          ? "bg-gray-400 cursor-not-allowed opacity-60"
          : "bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 dark:from-indigo-600 dark:to-indigo-700 dark:hover:from-indigo-700 dark:hover:to-indigo-800 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/25 dark:hover:shadow-indigo-600/20"
      } text-white font-medium px-6 py-3 rounded-lg transition-all duration-300 transform`}
    >
      <div className={`absolute inset-0 -translate-x-full ${!disabled ? 'group-hover:translate-x-full group-hover:duration-1000' : ''} bg-gradient-to-r from-transparent via-white/20 to-transparent`}></div>
      <span className="relative flex items-center justify-center">
        {loading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 
                 5.291A7.962 7.962 0 014 12H0c0 3.042 
                 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Processing...
          </>
        ) : (
          <>
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 
                   12H4L5 9z"
              ></path>
            </svg>
            Buy for ₹{amount}
          </>
        )}
      </span>
    </button>
    {canSubscribe && (
      <button
        onClick={handleSubscribe}
        disabled={loading || disabled}
        className="w-full rounded-lg border border-indigo-500 px-4 py-2 text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-50 disabled:opacity-60 dark:text-indigo-300 dark:hover:bg-indigo-950"
      >
        Subscribe for ₹{(recurringPlan.amountPaise / 100).toFixed(2)}/month
      </button>
    )}
    </div>
  );
};
