"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { RazorpayResponse } from "../types/razorpay";

interface Props {
  courseId: string;
  courseTitle: string;
  amount: number;
  onPurchaseSuccess?: () => void;
}

export const BuyCourseButton = ({ courseId, courseTitle, amount, onPurchaseSuccess }: Props) => {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);

  const handleBuy = async () => {
    if (!user) return toast.error("Please sign in first.");

    try {
      setLoading(true);

      // 1️⃣ Create Razorpay order
      const res = await fetch(`/api/courses/${courseId}/razorpay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clerkUserId: user.id }),
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error || "Failed to create order");

      const { order } = data;

      // 2️⃣ Open Razorpay checkout
      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        amount: order.amount,
        currency: "INR",
        name: "Unfiltered IITians",
        description: courseTitle,
        order_id: order.id,
        handler: function (response: RazorpayResponse) {
          // 3️⃣ Verify payment
          fetch(`/api/courses/${courseId}/razorpay/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          }).then(async (verifyRes) => {
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) return toast.error(verifyData.error || "Payment verification failed");
            
            toast.success("Payment successful! You are now enrolled.");
            onPurchaseSuccess?.();
          }).catch((err) => {
            console.error("Verification error:", err);
            toast.error("Payment verification failed");
          });
        },
        prefill: {
          email: user.primaryEmailAddress?.emailAddress || "",
          name: user.firstName || "",
        },
        theme: { color: "#3b82f6" },
      });

      rzp.open();
    } catch (err) {
      console.error("Error in handleBuy:", err);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleBuy}
      disabled={loading}
      className="bg-amber-500 hover:bg-amber-600 text-white font-medium px-6 py-3 rounded-lg"
    >
      {loading ? "Processing..." : `Buy for ₹${amount}`}
    </button>
  );
};
