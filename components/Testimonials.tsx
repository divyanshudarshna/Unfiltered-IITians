'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Star, StarHalf, StarOff } from 'lucide-react'
import Image from 'next/image'

type Testimonial = {
  id: string
  content: string
  name: string
  role: string
  image?: string | null
  rating: number
}

function StarRating({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating)
  const hasHalf = rating % 1 >= 0.5
  const totalStars = 5

  return (
    <div className="flex gap-1 text-yellow-400">
      {[...Array(fullStars)].map((_, i) => (
        <Star key={i} className="w-4 h-4 fill-yellow-400" />
      ))}
      {hasHalf && <StarHalf key="half" className="w-4 h-4 fill-yellow-400" />}
      {[...Array(totalStars - fullStars - (hasHalf ? 1 : 0))].map((_, i) => (
        <StarOff key={`empty-${i}`} className="w-4 h-4" />
      ))}
    </div>
  )
}

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const res = await fetch('/api/testimonials')
        if (!res.ok) throw new Error('Failed to fetch testimonials')
        const data = await res.json()
        setTestimonials(data)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    fetchTestimonials()
  }, [])

  return (
    <section className="py-20 px-4 sm:px-10 lg:px-20">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-heading font-bold text-center mb-12">
          What Students Say
        </h2>

        {loading ? (
          <p className="text-center text-muted-foreground">Loading testimonials...</p>
        ) : testimonials.length === 0 ? (
          <p className="text-center text-muted-foreground">No testimonials yet.</p>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t) => (
              <Card
                key={t.id}
                className="relative bg-muted/40 border border-transparent rounded-xl max-w-md mx-auto text-left group transition-all duration-500 hover:shadow-[0_0_12px_rgba(59,130,246,0.5)] hover:border-primary"
              >
                <CardContent className="flex items-center gap-4 pb-2">
                  <div className="relative">
                    <Image
                      src={t.image || '/default-avatar.png'} // fallback if no image
                      alt={t.name}
                      width={48}
                      height={48}
                      className="rounded-full object-cover w-12 h-12 border-2 border-muted group-hover:border-primary shadow-sm group-hover:shadow-primary/50 transition-all duration-500"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium group-hover:text-primary-foreground">{t.name}</p>
                    <p className="text-sm text-muted-foreground group-hover:text-primary-foreground">
                      {t.role}
                    </p>
                  </div>
                </CardContent>

                <div className="text-sm text-muted-foreground mb-3 px-3 group-hover:text-primary-foreground transition-colors duration-500">
                  {t.content}
                </div>

                <div className="flex items-center gap-2 px-3">
                  <StarRating rating={t.rating} />
                  <span className="text-sm text-muted-foreground group-hover:text-primary-foreground transition-colors duration-500">
                    {t.rating.toFixed(1)}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
