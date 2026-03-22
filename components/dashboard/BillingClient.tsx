"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { BillingItemCard } from "./BillingItemCard";

interface User {
  id: string;
  firstName: string;
  fullName: string;
  email: string;
  imageUrl: string;
}

interface BillingItem {
  id: string;
  type: "subscription" | "session";
  itemType: string;
  itemTitle: string;
  itemDescription: string;
  orderId: string;
  paymentId: string;
  originalPrice: number;
  actualAmountPaid: number;
  discountApplied: number;
  couponCode: string | null;
  paidAt: Date | null;
  expiresAt: Date | null;
  isExpired: boolean;
  duration?: number;
}

interface BillingClientProps {
  user: User;
}

export default function BillingClient({ user }: BillingClientProps) {
  const [billingHistory, setBillingHistory] = useState<BillingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalSpent, setTotalSpent] = useState(0);

  useEffect(() => {
    const fetchBillingHistory = async () => {
      try {
        const response = await fetch("/api/billing/history");
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || errorData.error || "Failed to fetch billing history");
        }

        const data = await response.json();
        
        if (data.success) {
          setBillingHistory(data.billingHistory || []);
          setTotalSpent(data.totalSpent || 0);
        } else {
          throw new Error(data.message || data.error || "Unknown error");
        }
      } catch (err) {
        console.error("Error fetching billing history:", err);
        setError(err instanceof Error ? err.message : "Failed to load billing history");
      } finally {
        setLoading(false);
      }
    };

    fetchBillingHistory();
  }, []);

  return (
    <main className="min-h-screen p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/${user.firstName}/dashboard`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-800 via-purple-700 to-pink-800 bg-clip-text text-transparent drop-shadow-lg">
            Billing & Payments
          </h1>
          <p className="text-muted-foreground mt-2">
            View your payment history, active subscriptions, and download receipts
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
            <p className="text-sm text-muted-foreground mb-1">Total Transactions</p>
            <p className="text-3xl font-bold">{billingHistory.length}</p>
          </div>
          
          <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
            <p className="text-sm text-muted-foreground mb-1">Total Spent</p>
            <p className="text-3xl font-bold">₹{totalSpent.toFixed(2)}</p>
          </div>
          
          <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
            <p className="text-sm text-muted-foreground mb-1">Active Subscriptions</p>
            <p className="text-3xl font-bold">
              {billingHistory.filter(item => !item.isExpired).length}
            </p>
          </div>
        </div>

        {/* Billing History */}
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-6">Payment History</h2>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-destructive mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="text-sm text-primary hover:underline"
              >
                Try again
              </button>
            </div>
          ) : billingHistory.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No billing history found</p>
              <Link
                href="/courses"
                className="text-sm text-primary hover:underline"
              >
                Explore Courses
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {billingHistory.map((item) => (
                <BillingItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
