"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RazorpayResponse } from "../types/razorpay";

interface BuyButtonProps {
  clerkUserId: string;
  itemId: string;
  itemType: "mockTest" | "mockBundle" | "course" | "session"; // ✅ added session
  title: string;
  amount: number;
  mockIds?: string[];
  studentPhone?: string; // ✅ new
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
  studentPhone, // ✅ new
  onPurchaseSuccess,
  disabled = false,
}: BuyButtonProps) => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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

      // Create order API request
      const res = await fetch("/api/payment/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerkUserId,
          itemId,
          itemType,
          mockIds,
          studentPhone, // ✅ include phone here
          amount, // ✅ send the amount (discounted price) to API
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
        toast.error(verifyData.error || "❌ Payment verification failed", { id: "verify-payment" });
        return;
      }

      toast.success("✅ Payment successful! Access granted to all mock tests!", { 
        id: "verify-payment",
        duration: 5000 
      });
      
      onPurchaseSuccess?.();
      router.refresh();
    } catch (err) {
      console.error("Verification error:", err);
      toast.error("❌ Error during payment verification.", { id: "verify-payment" });
    }
  };

  return (
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
  );
};
