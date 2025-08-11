'use client'

import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

const stats = [
  { number: "05+", label: "Years Experience" },
  { number: "100+", label: "Students Mentored" },
  { number: "65,000+", label: "YouTube Views" },
  { number: "100%", label: "Dedication" },
]

export default function Hero() {
  return (
    <section className="min-h-[596px] bg-background text-foreground py-16 px-6 md:px-12">
      <div className="max-w-6xl mx-auto flex flex-col items-center text-center space-y-10">
        <div className="space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold leading-tight">
            Transforming Biotechnology Education Through{" "}
            <span className="text-primary">Research & Mentorship</span>
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-3xl mx-auto ">
            As an IIT Roorkee researcher and academic mentor, I bridge the gap between
            complex scientific concepts and student success with proven strategies and
            personalized guidance.
          </p>
          <Link href="/courses">
            <Button size="lg" className="gap-2">
              Explore My Courses
              <ArrowRight size={18} />
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 w-full max-w-4xl mt-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-muted rounded-lg p-4 text-center shadow-sm hover:shadow-md transition"
            >
              <div className="text-2xl font-bold text-primary">{stat.number}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
