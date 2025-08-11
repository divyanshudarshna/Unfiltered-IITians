'use client'

import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Tilt from 'react-parallax-tilt'

import { BookOpenCheck, GraduationCap ,ArrowRight} from 'lucide-react'
import { Button } from './ui/button'
import { FaYoutube } from 'react-icons/fa'

const highlights = [
  {
    icon: <BookOpenCheck className="w-6 h-6" />,
    title: 'About Me',
    content: (
      <>
        <p>
  I&apos;m <b>Divyanshu Darshna</b>, a passionate neuroscientist and biotechnology educator with
  roots at <b>IIT Bombay</b>, currently advancing research at <b>IIT Roorkee</b>.
</p>

        <p className="mt-2">
          My mission is to demystify complex scientific concepts and provide students with the tools,
          strategies, and confidence needed to excel in competitive exams and research careers.
        </p>
      </>
    ),
    link: { href: '/about', text: 'My Journey' },
    bg: 'bg-blue-100 dark:bg-blue-900/20',
    border: 'border-blue-500',
  },
  {
    icon: <GraduationCap className="w-6 h-6" />,
    title: 'Student Success Stories',
    content: (
   <div className="space-y-3">
  <p>
    Divyanshu sir&apos;s guidance helped me crack IIT JAM with AIR 44. His teaching and guidance
    style makes even the most complex topics understandable. - <b>Krishna Samatia</b>
  </p>
  <p>
    The mentorship program transformed my approach to research. I&apos;m now pursuing my PhD at
    IIT Bombay. - <b>Anonymous</b>
  </p>
  <p>
    Divyanshu Sir&apos;s YouTube helped me crack my PhD interview at IIT Roorkee — His YouTube is
    invaluable. - <b>Research Scholar</b>
  </p>
</div>

    ),
    link: { href: '/success', text: 'Read More Stories' },
    bg: 'bg-green-100 dark:bg-green-900/20',
    border: 'border-green-500',
  },
  {
    icon: <BookOpenCheck className="w-6 h-6" />,
    title: 'Comprehensive Courses',
    content: (
      <>
        <p>My meticulously designed courses cover the entire biotechnology spectrum, tailored specifically for:</p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>IIT JAM Biotechnology</li>
          <li>GAT-B &amp; GATE Exams</li>
          <li>University Entrance Tests</li>
          <li>Research Methodology</li>
        </ul>
      </>
    ),
    link: { href: '/courses', text: 'View All Courses' },
    bg: 'bg-purple-100 dark:bg-purple-900/20',
    border: 'border-purple-500',
  },
  {
    icon: <FaYoutube className="w-6 h-6" />,
    title: 'Free Learning Resources',
    content: (
      <>
        <p>
          Access my YouTube channel for free tutorials, exam strategies, and research insights that have
          helped thousands of students:
        </p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Concept Breakdown Videos</li>
          <li>Exam Preparation Guides</li>
          <li>Research Career Advice</li>
          <li>Live Q&amp;A Sessions</li>
        </ul>
      </>
    ),
    link: { href: '/youtube', text: 'Visit YouTube' },
    bg: 'bg-red-100 dark:bg-red-900/20',
    border: 'border-red-500',
  },
]

export default function HowICanHelp() {
  return (
    <section className="bg-background text-foreground py-16 px-6 sm:px-10 lg:px-20">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent mb-8 font-heading">
          How I Can Help You Succeed
        </h2>

        <div className="flex justify-center mb-12">
          <Tilt
            className="w-44 h-44 sm:w-56 sm:h-56 md:w-64 md:h-64 border-4 border-primary rounded-full overflow-hidden shadow-lg transition-transform"
            tiltMaxAngleX={25}
            tiltMaxAngleY={25}
            scale={1.05}
            perspective={900}
            gyroscope={true}
          >
            <Image
              src="/about.jpg"
              alt="Divyanshu Darshna"
              width={300}
              height={300}
              className="object-cover w-full h-full"
              priority
            />
          </Tilt>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {highlights.map((item, index) => (
            <Card
              key={index}
              className={`transition-all hover:scale-[1.02] hover:shadow-xl border ${item.border} ${item.bg}`}
            >
              <CardHeader className="flex flex-row items-center gap-4">
                <div className={`p-3 rounded-md ${item.bg}`}>{item.icon}</div>
                <CardTitle className="text-lg font-semibold font-heading">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-muted-foreground font-body text-left text-sm space-y-2">
                  {item.content}
                </div>
                {item.link && (
                  <div className="mt-4 text-left">
                   <Button variant="outline" className="text-sm group">
  {item.link.text}
  <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
