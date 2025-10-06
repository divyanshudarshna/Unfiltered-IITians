'use client';

import React, { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

const Contact = () => {
  const form = useRef<HTMLFormElement>(null);
  const [isSending, setIsSending] = useState(false);

  const sendEmail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!form.current) return;
    
    const formData = new FormData(form.current);
    const data = {
      user_name: formData.get('user_name') as string,
      user_email: formData.get('user_email') as string,
      subject: formData.get('subject') as string,
      message: formData.get('message') as string,
    };

    // Basic validation
    if (!data.user_name || !data.user_email || !data.subject || !data.message) {
      toast.error("Please fill in all fields");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.user_email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      setIsSending(true);
      const res = await fetch('/api/contact-us', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      
      if (res.ok) {
        toast.success('Message sent successfully! We will get back to you soon.');
        form.current.reset();
      } else {
        throw new Error(result.error || 'Something went wrong');
      }
    } catch (err) {
      console.error('Contact form error:', err);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <section
      id="contact"
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
    >
      <div className="w-full max-w-4xl space-y-8">
        {/* Section Header */}
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
            Contact Us
          </h2>
          <Separator className="w-20 mx-auto bg-cyan-500 h-1" />
          <p className="mt-2 text-lg text-muted-foreground max-w-2xl mx-auto">
            We'd love to hear from you — reach out for any opportunities or questions!
          </p>
        </div>

        {/* Contact Card */}
        <Card className="w-full rounded-xl shadow-sm border">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center font-semibold">
              Connect with <span className="text-purple-600">UnFiltered IITians </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <form
              ref={form}
              onSubmit={sendEmail}
              className="space-y-6"
            >
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="user_name">Name *</Label>
                  <Input
                    id="user_name"
                    name="user_name"
                    type="text"
                    placeholder="Your Name"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="user_email">Email *</Label>
                  <Input
                    id="user_email"
                    name="user_email"
                    type="email"
                    placeholder="your.email@example.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  name="subject"
                  type="text"
                  placeholder="What is this regarding?"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  name="message"
                  rows={5}
                  placeholder="Tell us how we can help you..."
                  className="min-h-[120px]"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isSending}
                className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 transition-colors"
                size="lg"
              >
                {isSending ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </>
                ) : 'Send Message'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default Contact;