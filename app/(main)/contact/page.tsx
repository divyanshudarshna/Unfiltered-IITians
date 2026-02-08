'use client';

import React, { useRef, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useSearchParams } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';

const Contact = () => {
  const form = useRef<HTMLFormElement>(null);
  const [isSending, setIsSending] = useState(false);
  const searchParams = useSearchParams();
  
  // Extract reply parameters from URL
  const isReply = searchParams.get('reply') === 'true';
  const threadId = searchParams.get('threadId');
  const parentId = searchParams.get('parentId');
  const prefilledEmail = searchParams.get('email');
  const prefilledName = searchParams.get('name');

  useEffect(() => {
    // Pre-fill form if it's a reply
    if (isReply && form.current) {
      const emailInput = form.current.elements.namedItem('user_email') as HTMLInputElement;
      const nameInput = form.current.elements.namedItem('user_name') as HTMLInputElement;
      
      if (prefilledEmail && emailInput) {
        emailInput.value = decodeURIComponent(prefilledEmail);
      }
      if (prefilledName && nameInput) {
        nameInput.value = decodeURIComponent(prefilledName);
      }
    }
  }, [isReply, prefilledEmail, prefilledName]);

  const sendEmail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!form.current) return;
    
    const formData = new FormData(form.current);
    const data = {
      user_name: formData.get('user_name') as string,
      user_email: formData.get('user_email') as string,
      subject: formData.get('subject') as string,
      message: formData.get('message') as string,
      threadId: isReply ? threadId : undefined,
      parentId: isReply ? parentId : undefined,
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
      
      // Use reply endpoint if it's a reply, otherwise use normal contact endpoint
      const endpoint = isReply ? '/api/contact-us/reply' : '/api/contact-us';
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      
      if (res.ok) {
        toast.success(
          isReply 
            ? 'Reply sent successfully! We will get back to you soon.' 
            : 'Message sent successfully! We will get back to you soon.'
        );
        form.current.reset();
        
        // If reply was successful, redirect to contact page without params
        if (isReply) {
          globalThis.history.replaceState({}, '', '/contact');
        }
      } else if (res.status === 429) {
        // Rate limit exceeded
        toast.error(result.error || 'You have exceeded your daily message limit. Please try again tomorrow.');
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
            {isReply ? 'Reply to Conversation' : 'Contact Us'}
          </h2>
          <Separator className="w-20 mx-auto bg-cyan-500 h-1" />
          <p className="mt-2 text-lg text-muted-foreground max-w-2xl mx-auto">
            {isReply 
              ? 'Continue your conversation with us' 
              : "We'd love to hear from you — reach out for any opportunities or questions!"}
          </p>
        </div>

        {/* Reply Notice */}
        {isReply && (
          <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <InfoIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              You are replying to an existing conversation. Your message will be added to the thread.
            </AlertDescription>
          </Alert>
        )}

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