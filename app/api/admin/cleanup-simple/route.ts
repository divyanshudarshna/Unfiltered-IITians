import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'

// Add a GET endpoint for testing
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ message: 'Cleanup API is working', timestamp: new Date().toISOString() })
  } catch (error) {
    return NextResponse.json({ error: 'API error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get request body
    const body = await req.json()
    if (body.confirmation !== 'CLEAR_ALL_DATA') {
      return NextResponse.json({ error: 'Invalid confirmation' }, { status: 400 })
    }

    const log: string[] = []
    log.push('🚀 Starting database cleanup...')

    // Start cleanup process - move log outside transaction
    const result = await prisma.$transaction(async (tx) => {
      const transactionLog: string[] = []
      
      // 1. Clear user activity data (attempts, progress, enrollments)
      transactionLog.push('🔄 Clearing user activity data...')
      
      const mockAttempts = await tx.mockAttempt.deleteMany({})
      transactionLog.push(`   ✅ Deleted ${mockAttempts.count} mock attempts`)

      const courseProgress = await tx.courseProgress.deleteMany({})
      transactionLog.push(`   ✅ Deleted ${courseProgress.count} course progress records`)

      const enrollments = await tx.enrollment.deleteMany({})
      transactionLog.push(`   ✅ Deleted ${enrollments.count} enrollments`)

      const sessionEnrollments = await tx.sessionEnrollment.deleteMany({})
      transactionLog.push(`   ✅ Deleted ${sessionEnrollments.count} session enrollments`)

      // 2. Clear financial data
      transactionLog.push('🔄 Clearing financial data...')
      
      const subscriptions = await tx.subscription.deleteMany({})
      transactionLog.push(`   ✅ Deleted ${subscriptions.count} subscriptions`)

      const couponUsages = await tx.couponUsage.deleteMany({})
      transactionLog.push(`   ✅ Deleted ${couponUsages.count} coupon usages`)

      const coupons = await tx.coupon.deleteMany({})
      transactionLog.push(`   ✅ Deleted ${coupons.count} coupons`)

      // 3. Clear communication data
      transactionLog.push('🔄 Clearing communication data...')
      
      const feedbackReplyRecipients = await tx.feedbackReplyRecipient.deleteMany({})
      transactionLog.push(`   ✅ Deleted ${feedbackReplyRecipients.count} feedback reply recipients`)

      const feedbackReplies = await tx.feedbackReply.deleteMany({})
      transactionLog.push(`   ✅ Deleted ${feedbackReplies.count} feedback replies`)

      const courseFeedback = await tx.courseFeedback.deleteMany({})
      transactionLog.push(`   ✅ Deleted ${courseFeedback.count} course feedback entries`)

      const announcementRecipients = await tx.announcementRecipient.deleteMany({})
      transactionLog.push(`   ✅ Deleted ${announcementRecipients.count} announcement recipients`)

      const courseAnnouncements = await tx.courseAnnouncement.deleteMany({})
      transactionLog.push(`   ✅ Deleted ${courseAnnouncements.count} course announcements`)

      const contactMessages = await tx.contactUs.deleteMany({})
      transactionLog.push(`   ✅ Deleted ${contactMessages.count} contact messages`)

      const newsletters = await tx.newsletter.deleteMany({})
      transactionLog.push(`   ✅ Deleted ${newsletters.count} newsletter subscriptions`)

      // 4. Clear session bookings - removing this section as SessionBooking model doesn't exist
      // Session enrollments are already handled above

      // 5. Reset user-specific data but keep profiles
      transactionLog.push('🔄 Resetting user activity...')
      
      const userUpdates = await tx.user.updateMany({
        data: {
          isSubscribed: false,
          subscriptionKey: null,
        }
      })
      transactionLog.push(`   ✅ Reset subscription status for ${userUpdates.count} users`)

      transactionLog.push('✅ Database cleanup completed successfully!')
      transactionLog.push('📊 Content preserved: Users, Courses, Mocks, Sessions, Lectures, Materials')
      
      return transactionLog
    }, {
      timeout: 60000 // 60 second timeout
    })

    // Merge logs
    log.push(...result)

    return NextResponse.json({ 
      success: true, 
      message: 'Database cleaned successfully',
      log 
    })

  } catch (error) {
    console.error('Database cleanup error:', error)
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to clean database',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: error instanceof Error ? error.name : 'UnknownError'
      }, 
      { status: 500 }
    )
  }
}