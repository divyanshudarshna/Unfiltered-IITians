"use client";

import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";
import clsx from "clsx";
import Link from "next/link";
import { Package, ArrowRight } from "lucide-react";

export function SubscriptionCard({ subscriptions = [] }) {
  const isPaid = subscriptions.length > 0;

  return (
    <Card
      className={clsx(
        "shadow-lg transition-all duration-300 rounded-xl border border-border",
        "bg-card hover:shadow-xl",
        "max-h-[380px]",
        "flex flex-col"
      )}
    >
      {/* Header */}
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Subscription
          </CardTitle>
          {isPaid ? (
            <Badge variant="default" className="bg-green-500 text-white">
              Active
            </Badge>
          ) : (
            <Badge variant="secondary">Free</Badge>
          )}
        </div>
      </CardHeader>

      {/* Content */}
      <CardContent className="flex flex-col flex-grow space-y-4 text-sm overflow-hidden">
        {/* Info */}
        <div>
          <h4 className="font-semibold text-base">
            {isPaid ? "Premium Access" : "Free Account"}
          </h4>
          <p className="text-muted-foreground text-sm">
            {isPaid
              ? `You have access to ${subscriptions.length} purchased mock${
                  subscriptions.length > 1 ? "s" : ""
                }`
              : "Limited access — upgrade to unlock premium mocks"}
          </p>
        </div>

        {/* Purchased mocks list */}
        {isPaid && (
          <div className="space-y-2 flex-grow overflow-hidden">
            <p className="font-medium text-sm">Purchased Mocks</p>
            <ScrollArea
              className={clsx(
                "pr-2",
                subscriptions.length > 3 ? "max-h-[144px] overflow-y-auto" : ""
              )}
            >
              <div className="space-y-2">
                {subscriptions.map((sub, idx) => (
                  <div
                    key={`${sub.mockTest?.id || "mock"}-${idx}`} // ✅ Unique key
                    className="flex justify-between items-center p-2 rounded-md bg-muted/40 hover:bg-muted/70 transition-colors"
                  >
                    <span className="truncate text-sm">
                      {sub.mockTest?.title || "Untitled Mock"}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      Paid
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <Separator className="my-2" />
          </div>
        )}

        {/* Action - keep button at bottom */}
        <div className="flex gap-2 pt-2 border-t border-border mt-auto">
          <Button
            asChild
            variant={isPaid ? "secondary" : "default"}
            className="flex-1 group"
          >
            <Link href="/mocks" className="flex items-center justify-center gap-1">
              {isPaid ? "See All Mocks" : "Buy Mocks"}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
