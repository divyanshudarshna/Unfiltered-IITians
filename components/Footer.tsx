'use client'

import Link from 'next/link'
import { Github, Linkedin, Twitter } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'

export default function Footer() {
  const { theme, setTheme } = useTheme()

  return (
    <footer className="border-t bg-muted text-muted-foreground dark:bg-zinc-950 dark:text-zinc-400">
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
        
        {/* Brand Info */}
        <div>
          <h3 className="text-lg font-semibold text-foreground dark:text-white">Unfiltered IITians</h3>
          <p className="mt-2">
            Real mentorship from IITians. Courses, guidance, and growth in one place.
          </p>
        
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-md font-medium text-foreground dark:text-white mb-3">Quick Links</h4>
          <ul className="space-y-2">
            <li><Link href="/" className="hover:underline">Home</Link></li>
            <li><Link href="/courses" className="hover:underline">Courses</Link></li>
            <li><Link href="/about" className="hover:underline">About</Link></li>
            <li><Link href="/contact" className="hover:underline">Contact</Link></li>
          </ul>
        </div>

        {/* Social + Legal */}
        <div>
          <h4 className="text-md font-medium text-foreground dark:text-white mb-3">Connect & Legal</h4>
          <ul className="space-y-2">
            <li>
              <a href="https://github.com/rajrabidas001" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:underline">
                <Github size={16} /> GitHub
              </a>
            </li>
            <li>
              <a href="https://linkedin.com/in/yourprofile" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:underline">
                <Linkedin size={16} /> LinkedIn
              </a>
            </li>
            <li>
              <a href="https://twitter.com/yourhandle" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:underline">
                <Twitter size={16} /> Twitter
              </a>
            </li>
            <li><Link href="/privacy" className="hover:underline">Privacy Policy</Link></li>
            <li><Link href="/terms" className="hover:underline">Terms of Service</Link></li>
          </ul>
        </div>
      </div>

      <div className="text-center text-xs py-4 border-t border-border">
        © {new Date().getFullYear()} Unfiltered IITians. All rights reserved.
      </div>
    </footer>
  )
}
