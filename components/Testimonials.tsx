'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Star, StarHalf, StarOff } from 'lucide-react'
import Image from 'next/image'

type Testimonial = {
  content: string
  name: string
  role: string
  image: string
  rating: number
}

const testimonials: Testimonial[] = [
  {
    content:
      'Your Unfiltered IITians channel was my lifeline during JAM prep—those raw IITian journeys gave me hope when I doubted myself. Now heading to IIT Bombay, I realize your videos were my silent cheerleaders. Thank you!',
    name: 'Preeti',
    role: 'AIR-51 IIT JAM Qualified (2025)',
    image: '/testimonials/Preeti.jpeg',
    rating: 5,
  },
  {
    content:
      'The session was fulfilling and much productive. He cleared my majority of doubts including colleges, interests, and future prospects. Highly recommended.',
    name: 'Raghav Pandey',
    role: 'Aspiring IITian',
    image: '/testimonials/Raghav.jpeg',
    rating: 4.5,
  },
  {
    content:
      'His YouTube videos helped me understand concepts I struggled with for months. The way he connects theory to real-world applications is brilliant.',
    name: 'Student',
    role: 'From YouTube',
    image: '/testimonials/Raghav.jpeg',
    rating: 4,
  },
  {
    content:
      'The SWOT analysis session was eye-opening! Divyanshu sir helped me identify my weak areas and gave me a clear roadmap to improve.',
    name: 'Student',
    role: 'From YouTube',
    image: '/testimonials/Raghav.jpeg',
    rating: 4.5,
  },
  {
    content:
      "I was confused between PhD and industry options. Divyanshu sir's career guidance helped me see clearly. His advice was spot-on!",
    name: 'Student',
    role: 'From YouTube',
    image: '/testimonials/Raghav.jpeg',
    rating: 5,
  },
]

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

  return (
    <section className="bg-background py-20 px-4 sm:px-10 lg:px-20">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-heading font-bold text-center mb-12">
          What Students Say
        </h2>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t, idx) => (
<Card
  key={idx}
  className="relative bg-muted/40 border border-transparent rounded-xl max-w-md mx-auto text-left group transition-all duration-500 hover:shadow-[0_0_12px_rgba(59,130,246,0.5)] hover:border-primary"
>
  <CardContent className="flex items-center gap-4 pb-2">
    <div className="relative">
      <Image
        src={t.image}
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
      </div>
    </section>
  )
}
