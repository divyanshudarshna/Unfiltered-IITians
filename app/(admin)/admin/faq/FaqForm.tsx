"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

export type Faq = {
  id: string
  question: string
  answer: string
  category?: string | null
  createdAt?: string
}

type FaqFormProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  faq?: Faq | null
  onSuccess: () => void
}

const CATEGORIES = [
  "Getting Started",
  "General",
  "Courses",
  "Mocks",
  "Sessions",
  "Materials",
]

export function FaqForm({ open, onOpenChange, faq, onSuccess }: FaqFormProps) {
  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState("")
  const [category, setCategory] = useState<string>("General")
  const [loading, setLoading] = useState(false)

  // Reset form when opening/closing
  useEffect(() => {
    if (faq) {
      setQuestion(faq.question)
      setAnswer(faq.answer)
      setCategory(faq.category ?? "General")
    } else {
      setQuestion("")
      setAnswer("")
      setCategory("General")
    }
  }, [faq, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const method = faq ? "PUT" : "POST"
      const body: any = {
        question,
        answer,
        category: category.trim(),
      }
      if (faq) body.id = faq.id

      await fetch("/api/admin/faq", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      onSuccess()
    } catch (err) {
      console.error("Failed to save FAQ", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {faq ? "Edit FAQ" : "Add FAQ"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Question */}
          <div className="space-y-2">
            <Label>Question</Label>
            <Input
              placeholder="Enter FAQ question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              required
            />
          </div>

          {/* Answer */}
          <div className="space-y-2">
            <Label>Answer</Label>
            <Textarea
              placeholder="Provide a clear answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              required
              rows={4}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge variant="secondary" className="mt-1">
              {category}
            </Badge>
          </div>

          {/* Submit */}
          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : faq ? "Update FAQ" : "Create FAQ"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
