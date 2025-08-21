"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { DifficultyLevel } from "@prisma/client"
import { useRouter } from "next/navigation"

export function CreateMockModal() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const submitBtnRef = useRef<HTMLButtonElement | null>(null)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: 0,
    difficulty: "EASY" as DifficultyLevel,
    status: "DRAFT" as "DRAFT" | "PUBLISHED",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 🚨 instant guard: disable button DOM-level
    if (submitBtnRef.current) {
      submitBtnRef.current.disabled = true
    }

    if (loading) return
    setLoading(true)

    try {
      const response = await fetch("/api/admin/mocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...formData,
          questions: [], // Start with empty questions
        }),
      })

      if (!response.ok) throw new Error("Failed to create mock")

      const data = await response.json()
      setOpen(false)
      router.push(`/admin/mocks/${data.mock.id}`)
    } catch (error) {
      console.error("Error creating mock:", error)
    } finally {
      setLoading(false)
      // re-enable after done
      if (submitBtnRef.current) {
        submitBtnRef.current.disabled = false
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create New Mock</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Mock Test</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <fieldset disabled={loading} className="space-y-4">
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
                <Label htmlFor="price">Price (₹)</Label>
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
                />
              </div>

              <div>
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select
                  value={formData.difficulty}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      difficulty: value as DifficultyLevel,
                    })
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
          </fieldset>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button ref={submitBtnRef} type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Mock"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
