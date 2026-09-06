"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DifficultyLevel, PublishStatus } from "@prisma/client"

interface EditMockModalProps {
  mock: {
    id: string
    title: string
    description?: string
    price: number
    actualPrice?: number
    duration?: number
    difficulty: DifficultyLevel
    status: PublishStatus
    subscriptionEnabled?: boolean
    billingPlans?: Array<{
      id: string
      amountPaise: number
      totalCount: number
      version: number
      status: "DRAFT" | "ACTIVE" | "INACTIVE"
      providerSyncState: string
      razorpayPlanId?: string | null
    }>
  }
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditMockModal({
  mock,
  open,
  onOpenChange,
  onSuccess,
}: EditMockModalProps) {
  const [loading, setLoading] = useState(false)
  const [activatingPlan, setActivatingPlan] = useState(false)
  const [razorpayPlanId, setRazorpayPlanId] = useState("")

  const [formData, setFormData] = useState({
    title: mock.title,
    description: mock.description || "",
    price: mock.price,
    actualPrice: mock.actualPrice ?? 0,
    duration: mock.duration ?? 0,
    difficulty: mock.difficulty,
    status: mock.status,
    subscriptionEnabled: mock.subscriptionEnabled ?? false,
    subscriptionAmount: mock.billingPlans?.[0] ? (mock.billingPlans[0].amountPaise / 100).toFixed(2) : "",
    subscriptionTotalCount: mock.billingPlans?.[0]?.totalCount?.toString() || "120",
  })

  useEffect(() => {
    if (mock) {
      setFormData({
        title: mock.title,
        description: mock.description || "",
        price: mock.price,
        actualPrice: mock.actualPrice ?? 0,
        duration: mock.duration ?? 0,
        difficulty: mock.difficulty,
        status: mock.status,
        subscriptionEnabled: mock.subscriptionEnabled ?? false,
        subscriptionAmount: mock.billingPlans?.[0] ? (mock.billingPlans[0].amountPaise / 100).toFixed(2) : "",
        subscriptionTotalCount: mock.billingPlans?.[0]?.totalCount?.toString() || "120",
      })
      setRazorpayPlanId(mock.billingPlans?.[0]?.razorpayPlanId || "")
    }
  }, [mock])

  const latestBillingPlan = mock.billingPlans?.[0]

  const handlePlanActivation = async () => {
    if (!latestBillingPlan?.id || !razorpayPlanId.trim()) return
    setActivatingPlan(true)
    try {
      const response = await fetch(
        `/api/admin/commerce-billing-plans/${latestBillingPlan.id}/link-razorpay`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ razorpayPlanId: razorpayPlanId.trim() }),
        },
      )
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Unable to verify the Razorpay plan")
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("Error activating Razorpay plan:", error)
    } finally {
      setActivatingPlan(false)
    }
  }

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setLoading(true)

  try {
    const response = await fetch(`/api/admin/mocks?id=${mock.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        ...formData,
        billingMode: formData.subscriptionEnabled ? "RECURRING" : "ONE_TIME",
        subscriptionInterval: formData.subscriptionEnabled ? "monthly" : undefined,
      }),
    })

    if (!response.ok) throw new Error("Failed to update mock")

    onSuccess()
    onOpenChange(false)
  } catch (error) {
    console.error("Error updating mock:", error)
  } finally {
    setLoading(false)
  }
}


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Mock Test</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          <div className="rounded-md border p-4 space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={formData.subscriptionEnabled}
                onChange={(event) => setFormData({ ...formData, subscriptionEnabled: event.target.checked })}
              />
              Enable monthly subscription
            </label>
            {formData.subscriptionEnabled && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="subscriptionAmount">Monthly price (₹)</Label>
                    <Input id="subscriptionAmount" type="number" min="1" step="0.01" required value={formData.subscriptionAmount} onChange={(event) => setFormData({ ...formData, subscriptionAmount: event.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="subscriptionTotalCount">Monthly cycles</Label>
                    <Input id="subscriptionTotalCount" type="number" min="1" max="120" required value={formData.subscriptionTotalCount} onChange={(event) => setFormData({ ...formData, subscriptionTotalCount: event.target.value })} />
                  </div>
                </div>
                {latestBillingPlan && (
                  <div className="space-y-2 rounded border bg-muted/30 p-3 text-sm">
                    <p>Local plan v{latestBillingPlan.version}: {latestBillingPlan.status} ({latestBillingPlan.providerSyncState})</p>
                    <Label htmlFor="razorpayPlanId">Razorpay Plan ID</Label>
                    <Input id="razorpayPlanId" placeholder="plan_..." value={razorpayPlanId} onChange={(event) => setRazorpayPlanId(event.target.value)} />
                    <Button type="button" variant="outline" onClick={handlePlanActivation} disabled={activatingPlan || !razorpayPlanId.trim() || latestBillingPlan.status === "INACTIVE"}>
                      {activatingPlan ? "Verifying..." : "Verify & Activate"}
                    </Button>
                    <p className="text-xs text-muted-foreground">Create the matching monthly plan in Razorpay first. The server verifies its amount and cadence before activation.</p>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Discounted Price (₹)</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    price: parseInt(e.target.value) || 0,
                  })
                }
                min="0"
                required
              />
            </div>

            <div>
              <Label htmlFor="actualPrice">Actual Price (₹)</Label>
              <Input
                id="actualPrice"
                type="number"
                value={formData.actualPrice}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    actualPrice: parseInt(e.target.value) || 0,
                  })
                }
                min="0"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              value={formData.duration}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  duration: parseInt(e.target.value) || 0,
                })
              }
              min="1"
              required
            />
          </div>

          <div>
            <Label htmlFor="difficulty">Difficulty</Label>
            <Select
              value={formData.difficulty}
              onValueChange={(value) =>
                setFormData({ ...formData, difficulty: value as DifficultyLevel })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EASY">Easy</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HARD">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Publish Status</Label>
            <div className="flex items-center space-x-4 mt-2">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  checked={formData.status === "DRAFT"}
                  onChange={() =>
                    setFormData({ ...formData, status: "DRAFT" })
                  }
                  className="h-4 w-4 text-primary focus:ring-primary"
                />
                <span>Draft (Private)</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  checked={formData.status === "PUBLISHED"}
                  onChange={() =>
                    setFormData({ ...formData, status: "PUBLISHED" })
                  }
                  className="h-4 w-4 text-primary focus:ring-primary"
                />
                <span>Published</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
