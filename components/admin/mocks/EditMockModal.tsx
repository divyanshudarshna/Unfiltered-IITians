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
import { useRouter } from "next/navigation"

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
  const router = useRouter()

  const [formData, setFormData] = useState({
    title: mock.title,
    description: mock.description || "",
    price: mock.price,
    actualPrice: mock.actualPrice ?? 0,
    duration: mock.duration ?? 0,
    difficulty: mock.difficulty,
    status: mock.status,
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
      })
    }
  }, [mock])

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
      body: JSON.stringify(formData),
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
