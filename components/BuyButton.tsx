"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RazorpayResponse } from "../types/razorpay";

interface BuyButtonProps {
  clerkUserId: string;
  itemId: string;
  itemType: "mockTest" | "mockBundle" | "course" | "session";
  title: string;
  amount: number; // frontend passes discounted price here
  mockIds?: string[];
  studentPhone?: string;
  onPurchaseSuccess?: () => void;
  className?: string;
}

export const BuyButton = ({
  clerkUserId,
  itemId,
  itemType,
  title,
  amount,
  mockIds,
  studentPhone,
  onPurchaseSuccess,
  className,
}: BuyButtonProps) => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleBuy = async () => {
    if (!clerkUserId) return alert("Please sign in first.");
    if (itemType === "mockBundle" && (!mockIds || mockIds.length === 0)) {
      return alert("No mocks selected for purchase!");
    }
    if (itemType === "session" && !studentPhone) {
      return alert("Please enter your phone number to enroll.");
    }

    try {
      setLoading(true);

      const res = await fetch("/api/payment/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerkUserId,
          itemId,
          itemType,
          amount, // send discounted price
          mockIds,
          studentPhone,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Something went wrong during order creation");
        return;
      }

      const { order } = data;

      const razorpay = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        amount: order.amount,
        currency: "INR",
        name: "Unfiltered IITians",
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
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async (response: RazorpayResponse) => {
    try {
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
        alert("❌ Payment verification failed");
        return;
      }

      alert("✅ Payment verified and subscription/enrollment updated!");
      onPurchaseSuccess?.();
      router.refresh();
    } catch (err) {
      console.error("Verification error:", err);
      alert("❌ Error during payment verification.");
    }
  };

  return (
    <button
      onClick={handleBuy}
      disabled={loading}
      className={`relative overflow-hidden group bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 dark:from-indigo-600 dark:to-indigo-700 dark:hover:from-indigo-700 dark:hover:to-indigo-800 text-white font-medium px-6 py-3 rounded-lg transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/25 dark:hover:shadow-indigo-600/20 ${className}`}
    >
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full group-hover:duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
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
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
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
          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
        ></path>
      </svg>
      Buy for ₹{amount}
    </>
  )}
</span>

    </button>
  );
};
