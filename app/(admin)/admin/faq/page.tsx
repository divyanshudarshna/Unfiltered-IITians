"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { FaqForm } from "./FaqForm"
import { FaqTable } from "./FaqTable"
import { RefreshCw, Plus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

type Faq = {
  id: string
  question: string
  answer: string
  category?: string | null
  createdAt: string
}

export default function FAQPage() {
  const [faqs, setFaqs] = useState<Faq[]>([])
  const [loading, setLoading] = useState(true)
  const [openForm, setOpenForm] = useState(false)
  const [selectedFaq, setSelectedFaq] = useState<Faq | null>(null)

  // Fetch all FAQs
  const fetchFaqs = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/faq")
      const data = await res.json()
      setFaqs(data)
    } catch (err) {
      console.error("Error fetching FAQs", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFaqs()
  }, [])

  const handleEdit = (faq: Faq) => {
    setSelectedFaq(faq)
    setOpenForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this FAQ?")) return
    try {
      await fetch(`/api/admin/faq?id=${id}`, { method: "DELETE" })
      fetchFaqs()
    } catch (err) {
      console.error("Delete failed", err)
    }
  }

  // Stats: total + by category
  const stats = useMemo(() => {
    const total = faqs.length
    const categories: Record<string, number> = {}
    faqs.forEach((faq) => {
      const cat = faq.category ?? "General"
      categories[cat] = (categories[cat] || 0) + 1
    })
    return { total, categories }
  }, [faqs])

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="my-4">
          <h1 className="text-3xl font-bold">
            Manage FAQs{" "}
            <span className="text-purple-400 text-sm">
              {stats.total} Faqs
            </span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Add, edit, or delete frequently asked questions. Keep your learners informed.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchFaqs}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={() => { setSelectedFaq(null); setOpenForm(true) }}>
            <Plus className="h-4 w-4 mr-2" />
            Add FAQ
          </Button>
        </div>
      </div>

   

      {/* FAQ Table */}
      <FaqTable
        data={faqs}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Form Modal */}
      <FaqForm
        open={openForm}
        onOpenChange={setOpenForm}
        faq={selectedFaq}
        onSuccess={() => {
          fetchFaqs()
          setOpenForm(false)
        }}
      />
    </div>
  )
}
