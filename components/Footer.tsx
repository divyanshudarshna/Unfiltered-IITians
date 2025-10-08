'use client'

import Link from 'next/link'
import { FaInstagram, FaLinkedin, FaYoutube, FaEnvelope } from 'react-icons/fa'
import { useState } from 'react'
import { toast } from 'sonner'

function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message)
        setEmail('')
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full">
      <h4 className="text-lg font-semibold text-foreground dark:text-white mb-3">Newsletter</h4>
      <p className="mb-3">Subscribe for exclusive content, exam tips, and course updates delivered to your inbox.</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <input 
          type="email" 
          placeholder="Your email address" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="px-3 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          disabled={isLoading}
        />
        <button 
          type="submit" 
          disabled={isLoading}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Subscribing...' : 'Subscribe'}
        </button>
      </form>
    </div>
  )
}

export default function Footer() {
  return (
    <>
    <div className="h-1 bg-purple-600 w-full"></div>
    <footer className="border-t bg-muted text-muted-foreground dark:bg-zinc-950 dark:text-zinc-400">
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-4 gap-8 text-sm">
        
     {/* About Section */}
<div>
  {/* Clean logo/brand styling */}
  <Link href="/" className="flex items-center gap-2 group mb-4">
    {/* Logo */}
    <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-white">
        <path d="M12 14l9-5-9-5-9 5 9 5z" />
        <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
      </svg>
    </div>

    {/* Desktop version */}
    <div className="hidden sm:flex flex-col leading-tight">
      <span className="font-bold text-lg text-gray-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
        UnFiltered IITians 
      </span>
      <span className="text-xs text-muted-foreground">
        by Divyanshu Darshna
      </span>
    </div>

    {/* Mobile version */}
    <div className="flex sm:hidden flex-col leading-tight">
      <span className="font-bold text-sm text-gray-800 dark:text-white">
        UnFiltered IITians 
      </span>
      <span className="text-[10px] text-muted-foreground">
        by Divyanshu
      </span>
    </div>
  </Link>

  <p className="text-sm text-gray-700 dark:text-gray-300">
    A dedicated team of IITians and academic mentors helping students achieve their educational goals through quality guidance and resources.
  </p>
</div>


        {/* Quick Links */}
        <div>
          <h4 className="text-lg font-semibold text-foreground dark:text-white mb-3">Quick Links</h4>
          <ul className="space-y-2">
            <li><Link href="/" className="hover:underline">Home</Link></li>
            <li><Link href="/about" className="hover:underline">About</Link></li>
            <li><Link href="/courses" className="hover:underline">Courses</Link></li>
            <li><Link href="/youtube" className="hover:underline">YouTube</Link></li>
            <li><Link href="/guidance" className="hover:underline">Guidance</Link></li>
            <li><Link href="/contact" className="hover:underline">Contact</Link></li>
          </ul>
        </div>

        {/* Connect Section */}
        <div>
          <h4 className="text-lg font-semibold text-foreground dark:text-white mb-3">Connect</h4>
          <ul className="space-y-2">
            <li>
              <a href="https://www.instagram.com/divyanshudarshna_" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:underline">
                <FaInstagram className="w-4 h-4" /> Instagram
              </a>
            </li>
            <li>
              <a href="https://www.linkedin.com/in/divyanshudarshna" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:underline">
                <FaLinkedin className="w-4 h-4" /> LinkedIn
              </a>
            </li>
            <li>
              <a href="https://youtube.com/@divyanshudarshna" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:underline">
                <FaYoutube className="w-4 h-4" /> YouTube
              </a>
            </li>
            <li>
              <a href="/contact" className="flex items-center gap-2 hover:underline">
                <FaEnvelope className="w-4 h-4" /> Contact
              </a>
            </li>
          </ul>
        </div>

        {/* Newsletter Section */}
        <NewsletterForm />
      </div>

      <div className="max-w-7xl mx-auto px-6 py-4 border-t border-border text-center text-sm">
        © {new Date().getFullYear()} UnFiltered IITians . All rights reserved. | 
        <Link href="/privacy-policy" className="hover:underline mx-1">Privacy Policy</Link> | 
        <Link href="/refund-policy" className="hover:underline mx-1">Refund Policy</Link> | 
        <Link href="/terms-of-service" className="hover:underline mx-1">Terms of Service</Link>
      </div>
    </footer>
    </>
  )
}