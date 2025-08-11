"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  mockTestId: string;
  clerkUserId: string;
  mockTitle: string;
  amount: number;
  onPurchaseSuccess?: () => void;
}

export const BuyMockButton = ({ mockTestId, clerkUserId, mockTitle, amount, onPurchaseSuccess }: Props) => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleBuy = async () => {
    if (!clerkUserId) return alert("Please sign in first.");

    try {
      setLoading(true);

      const res = await fetch("/api/payment/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clerkUserId, mockTestId }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Something went wrong");
        return;
      }

      const { order } = data;
      const razorpay = new (window as any).Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        amount: order.amount,
        currency: "INR",
        name: "Unfiltered IITians",
        description: mockTitle,
        order_id: order.id,
        handler: function (response: any) {
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

  const verifyPayment = async (response: any) => {
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

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        alert("❌ Payment verification failed");
        return;
      }

      alert("✅ Payment verified and subscription updated!");
      onPurchaseSuccess?.(); // ✅ Update UI instantly
      router.refresh(); // ✅ Re-fetch server data to keep in sync
    } catch (err) {
      console.error("Verification error:", err);
      alert("❌ Error during payment verification.");
    }
  };

  return (
    <button
      onClick={handleBuy}
      disabled={loading}
      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
    >
      {loading ? "Processing..." : `Buy for ₹${amount}`}
    </button>
  );
};
