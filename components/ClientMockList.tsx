"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BuyMockButton } from "@/components/BuyMockButton";
import Link from "next/link";

export default function ClientMockList({ mocks, userId, purchasedMockIds }: any) {
  const [purchased, setPurchased] = useState(new Set(purchasedMockIds));

  const handlePurchaseSuccess = (mockId: string) => {
    setPurchased((prev) => new Set(prev).add(mockId));
  };

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {mocks.map((mock: any) => {
        const isPurchased = purchased.has(mock.id);
        const isFree = mock.price === 0;

        return (
          <Card key={mock.id} className="shadow-md flex flex-col">
            <CardHeader>
              <CardTitle className="flex justify-between items-center gap-2">
                <span>{mock.title}</span>
                <div className="flex gap-2">
                  <Badge
                    variant={
                      mock.difficulty === "EASY"
                        ? "secondary"
                        : mock.difficulty === "MEDIUM"
                        ? "default"
                        : "destructive"
                    }
                  >
                    {mock.difficulty}
                  </Badge>
                  {isPurchased && <Badge variant="success">Purchased</Badge>}
                  {isFree && !isPurchased && (
                    <Badge variant="outline">Free</Badge>
                  )}
                </div>
              </CardTitle>
            </CardHeader>

            <CardContent className="flex-1">
              <p className="text-sm text-muted-foreground mb-3">
                {mock.description || "No description provided."}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1 mb-3">
                {mock.tags?.map((tag: string, idx: number) => (
                  <Badge key={idx} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Price */}
              {!isFree && !isPurchased && (
                <p className="font-semibold">₹{mock.price}</p>
              )}
            </CardContent>

            <CardFooter>
              {isPurchased || isFree ? (
                <Button asChild className="w-full">
                  <Link href={`/mocks/${mock.id}/start`}>Start Test</Link>
                </Button>
              ) : (
                <BuyMockButton
                  mockTestId={mock.id}
                  clerkUserId={userId}
                  mockTitle={mock.title}
                  amount={mock.price}
                  onPurchaseSuccess={() => handlePurchaseSuccess(mock.id)}
                />
              )}
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
