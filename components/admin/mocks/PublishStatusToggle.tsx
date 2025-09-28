"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"

interface PublishStatusToggleProps {
  mockId: string
  initialStatus: string
  onStatusChange?: (newStatus: string) => void
}

export function PublishStatusToggle({ 
  mockId, 
  initialStatus,
  onStatusChange 
}: PublishStatusToggleProps) {
  const [status, setStatus] = useState(initialStatus)
  const [loading, setLoading] = useState(false)

  const toggleStatus = async () => {
    setLoading(true)
    try {
      const newStatus = status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED'
      const response = await fetch(`/api/admin/mocks/${mockId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        setStatus(newStatus)
        if (onStatusChange) onStatusChange(newStatus)
      }
    } catch (error) {
      console.error('Error updating status:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant={status === 'PUBLISHED' ? 'default' : 'outline'}
      size="sm"
      onClick={toggleStatus}
      disabled={loading}
    >
      {loading ? '...' : status === 'PUBLISHED' ? 'Published' : 'Draft'}
    </Button>
  )
}