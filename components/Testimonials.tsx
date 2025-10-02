'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Star, StarHalf, StarOff, ArrowRight } from 'lucide-react'
import { Button } from './ui/button'
import Image from 'next/image'
import { routerServerGlobal } from 'next/dist/server/lib/router-utils/router-server-context'
import { useRouter } from 'next/navigation'
type Testimonial = {
  id: string
  content: string
  name: string
  role: string
  image?: string | null
  rating: number
}

interface TestimonialsProps {
  title?: string
  description?: string
  button?: boolean
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

export default function Testimonials({ 
  title = "What Students Say", 
  description = "", 
  button = false, 
}: TestimonialsProps) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)

  const router = useRouter();

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
        <h2 className="text-4xl dark:text-white text-black font-bold text-center mb-4">
          {title}
        </h2>
        
        {description && (
          <p className="text-center text-muted-foreground text-lg mb-12 max-w-4xl mx-auto ">
            {description}
          </p>
        )}

        {loading ? (
          <p className="text-center text-muted-foreground">Loading testimonials...</p>
        ) : testimonials.length === 0 ? (
          <p className="text-center text-muted-foreground">No testimonials yet.</p>
        ) : (
          <div className="relative">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 mb-8">
              {testimonials.map((t) => (
                <Card
                  key={t.id}
                  className="relative bg-muted/40 border border-transparent rounded-xl w-full mx-auto text-left group transition-all duration-500 hover:shadow-[0_0_12px_rgba(59,130,246,0.5)] hover:border-primary min-h-[220px] p-6"
                >
                  <CardContent className="flex items-start gap-4 p-0 mb-4">
                    <div className="relative flex-shrink-0">
                      <Image
                        src={t.image || '/default-avatar.png'}
                        alt={t.name}
                        width={56}
                        height={56}
                        className="rounded-full object-cover w-14 h-14 border-2 border-muted group-hover:border-primary shadow-sm group-hover:shadow-primary/50 transition-all duration-500"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium group-hover:text-primary-foreground text-base">{t.name}</p>
                      <p className="text-sm text-muted-foreground group-hover:text-primary-foreground mt-1">
                        {t.role}
                      </p>
                    </div>
                  </CardContent>

                  <div className="text-sm text-muted-foreground mb-4 group-hover:text-primary-foreground transition-colors duration-500 leading-relaxed">
                    {t.content}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StarRating rating={t.rating} />
                      <span className="text-sm text-muted-foreground group-hover:text-primary-foreground transition-colors duration-500">
                        {t.rating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            
            {/* Button positioned below the cards in bottom right */}
{button && (
  <div className="flex justify-end">
    <Button 

    onClick={() => router.push("/success-stories")}
      className="flex items-center gap-2 group/btn transition-all duration-300 hover:shadow-lg hover:shadow-primary/20" 
      variant="secondary"
    >
      See Success Stories
      <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1 group-hover/btn:text-primary" />
    </Button>
  </div>
)}
          </div>
        )}
      </div>
    </section>
  )
}