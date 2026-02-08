'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, MessageSquare, Send, Loader2, Lock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

type Message = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  conversationType: 'NEW_INQUIRY' | 'ADMIN_REPLY' | 'USER_REPLY';
  createdAt: string;
  status: string;
};

type ThreadData = {
  threadId: string;
  originalInquiry: {
    id: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    createdAt: string;
  };
  messages: Message[];
  latestMessage: Message;
};

export default function ReplyPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const threadId = searchParams.get('threadId');
  const prefillEmail = searchParams.get('email');
  const prefillName = searchParams.get('name');
  
  const [threadData, setThreadData] = useState<ThreadData | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [hasReplied, setHasReplied] = useState(false);
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);

  console.log('📧 Reply page loaded with params:', { threadId, prefillEmail, prefillName });

  useEffect(() => {
    if (!threadId) {
      toast.error('Unauthorized access');
      router.push('/contact');
      return;
    }

    fetchThreadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId, router]);

  const fetchThreadData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/contact-us/thread/${threadId}`);
      
      if (!res.ok) {
        if (res.status === 404) {
          toast.error('Thread not found');
        } else {
          toast.error('Failed to load conversation');
        }
        router.push('/contact');
        return;
      }

      const data = await res.json();
      setThreadData(data);
    } catch (error) {
      console.error('Error fetching thread:', error);
      toast.error('Failed to load conversation');
      router.push('/contact');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!replyMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (!threadData) {
      toast.error('Thread data not available');
      return;
    }

    try {
      setSending(true);

      const res = await fetch('/api/contact-us/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId: threadData.threadId,
          parentId: threadData.latestMessage.id,
          user_name: prefillName || threadData.originalInquiry.name,
          user_email: prefillEmail || threadData.originalInquiry.email,
          message: replyMessage,
        }),
      });

      const result = await res.json();

      if (res.ok) {
        toast.success('Reply sent successfully!');
        setHasReplied(true);
        setReplyMessage('');
        
        // Scroll to top to show success message
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (res.status === 429) {
        toast.error(result.error || 'Daily limit exceeded');
      } else {
        throw new Error(result.error || 'Failed to send reply');
      }
    } catch (error) {
      console.error('Reply error:', error);
      toast.error('Failed to send reply. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const getConversationTypeBadge = (type: Message['conversationType']) => {
    switch (type) {
      case 'NEW_INQUIRY':
        return <Badge className="bg-blue-600">Your Inquiry</Badge>;
      case 'ADMIN_REPLY':
        return <Badge className="bg-purple-600">Admin Reply</Badge>;
      case 'USER_REPLY':
        return <Badge className="bg-cyan-600">Your Reply</Badge>;
      default:
        return null;
    }
  };

  const getMessageBackgroundClass = (type: Message['conversationType']) => {
    switch (type) {
      case 'ADMIN_REPLY':
        return 'bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800';
      case 'USER_REPLY':
        return 'bg-cyan-50 dark:bg-cyan-950 border-cyan-200 dark:border-cyan-800';
      default:
        return 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (!threadData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Unable to load conversation. Redirecting...
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <section className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Continue Conversation
          </h1>
          <Separator className="w-20 mx-auto bg-cyan-500 h-1" />
          <p className="text-lg text-muted-foreground">
            Reply to your inquiry: <strong>{threadData.originalInquiry.subject}</strong>
          </p>
        </div>

        {/* Success Message after reply */}
        {hasReplied && (
          <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
            <Lock className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              <strong>Reply Sent!</strong> Your message has been sent successfully. 
              This conversation thread is now locked. If you need further assistance, 
              please <a href="/contact" className="underline font-semibold">start a new inquiry</a>.
            </AlertDescription>
          </Alert>
        )}

        {/* Admin's Latest Reply - Highlighted */}
        {threadData.messages.some(m => m.conversationType === 'ADMIN_REPLY') && (
          <Card className="border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                <MessageSquare className="h-5 w-5" />
                Admin&apos;s Reply
              </CardTitle>
            </CardHeader>
            <CardContent>
              {threadData.messages
                .filter(m => m.conversationType === 'ADMIN_REPLY')
                .slice(-1)
                .map((msg) => (
                  <div key={msg.id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                        {msg.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(msg.createdAt).toLocaleString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                      <p className="text-sm whitespace-pre-wrap">
                        {msg.message.split('\n\n-------')[0]}
                      </p>
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        )}

        {/* Conversation Thread */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Full Conversation History
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {threadData.messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-4 rounded-lg border ${getMessageBackgroundClass(msg.conversationType)}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getConversationTypeBadge(msg.conversationType)}
                    <span className="text-sm font-semibold">{msg.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(msg.createdAt).toLocaleString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap text-foreground/90">
                  {msg.message.split('\n\n-------')[0]}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* User Info Display */}
        <Card className="bg-blue-50/50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Your Name</Label>
                <p className="font-semibold">{prefillName || threadData.originalInquiry.name}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Your Email</Label>
                <p className="font-semibold">{prefillEmail || threadData.originalInquiry.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reply Form */}
        {hasReplied ? (
          <Card className="border-green-200 dark:border-green-800">
            <CardContent className="pt-6 text-center space-y-4">
              <Lock className="h-12 w-12 mx-auto text-green-600 dark:text-green-400" />
              <h3 className="text-xl font-semibold">Thread Locked</h3>
              <p className="text-muted-foreground">
                This conversation has been submitted. If you need further assistance,
                please start a new inquiry.
              </p>
              <Button onClick={() => router.push('/contact')} variant="outline">
                Go to Contact Page
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Send Your Reply</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitReply} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reply-message">Message *</Label>
                  <Textarea
                    ref={replyTextareaRef}
                    id="reply-message"
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type your reply here..."
                    rows={6}
                    className="resize-none"
                    required
                    disabled={sending}
                  />
                  <p className="text-xs text-muted-foreground">
                    Replying as: <strong>{threadData.originalInquiry.email}</strong>
                  </p>
                </div>

                <Alert className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <AlertDescription className="text-amber-800 dark:text-amber-200 text-sm">
                    <strong>Note:</strong> Once you send this reply, this conversation thread will be locked. 
                    You won&apos;t be able to send another reply on this page. Please ensure your message is complete.
                  </AlertDescription>
                </Alert>

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    disabled={sending || !replyMessage.trim()}
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
                  >
                    {sending ? (
                      <>
                        <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Send Reply
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/contact')}
                    disabled={sending}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}
