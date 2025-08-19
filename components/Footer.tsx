'use client'

import Link from 'next/link'
import { FaGithub, FaLinkedin, FaTwitter, FaYoutube } from 'react-icons/fa'
import { useTheme } from 'next-themes'

export default function Footer() {
  const { theme } = useTheme()

  return (
    <footer className="border-t bg-muted text-muted-foreground dark:bg-zinc-950 dark:text-zinc-400">
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-4 gap-8 text-sm">
        
        {/* About Section */}
        <div>
          <h3 className="text-lg font-semibold text-foreground dark:text-white mb-3">About Unfiltered IITians</h3>
          <p>
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
              <a href="https://github.com/rajrabidas001" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:underline">
                <FaGithub className="w-4 h-4" /> GitHub
              </a>
            </li>
            <li>
              <a href="https://linkedin.com/in/yourprofile" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:underline">
                <FaLinkedin className="w-4 h-4" /> LinkedIn
              </a>
            </li>
            <li>
              <a href="https://twitter.com/yourhandle" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:underline">
                <FaTwitter className="w-4 h-4" /> Twitter
              </a>
            </li>
            <li>
              <a href="https://youtube.com/yourchannel" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:underline">
                <FaYoutube className="w-4 h-4" /> YouTube
              </a>
            </li>
          </ul>
        </div>

        {/* Newsletter Section */}
        <div>
          <h4 className="text-lg font-semibold text-foreground dark:text-white mb-3">Newsletter</h4>
          <p className="mb-3">Subscribe for exclusive content, exam tips, and course updates delivered to your inbox.</p>
          <form className="flex flex-col gap-2">
            <input 
              type="email" 
              placeholder="Your email address" 
              className="px-3 py-2 bg-background border rounded-md text-foreground"
            />
            <button 
              type="submit" 
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-4 border-t border-border text-center text-sm">
        © {new Date().getFullYear()} Unfiltered IITians. All rights reserved. | 
        <Link href="/privacy-policy" className="hover:underline mx-1">Privacy Policy</Link> | 
        <Link href="/refund-policy" className="hover:underline mx-1">Refund Policy</Link> | 
        <Link href="/terms-of-service" className="hover:underline mx-1">Terms of Service</Link>
      </div>
    </footer>
  )
}