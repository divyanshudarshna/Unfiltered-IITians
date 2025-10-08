import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

/**
 * Production Database Cleanup API Route
 * 
 * ⚠️ WARNING: This endpoint permanently deletes all test/dummy data!
 * Only use this before going to production.
 * 
 * Usage: POST /api/admin/cleanup-production
 * Requires: Admin authentication
 */

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req)
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: { role: true }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Get confirmation from request body
    const body = await req.json()
    if (body.confirmation !== 'CLEAR_ALL_DATA') {
      return NextResponse.json({ 
        error: 'Confirmation required. Send { "confirmation": "CLEAR_ALL_DATA" }' 
      }, { status: 400 })
    }

    console.log('🚀 Starting database cleanup for production launch...')
    
    const cleanupLog = []
    
    // Step 1: Clear all user activity and interaction data
    cleanupLog.push('📊 Clearing user activity data...')
    
    // Clear feedback system (must be in order due to relations)
    await prisma.feedbackReplyRecipient.deleteMany({})
    cleanupLog.push('✅ Cleared feedback reply recipients')
    
    await prisma.feedbackReply.deleteMany({})
    cleanupLog.push('✅ Cleared feedback replies')
    
    await prisma.courseFeedback.deleteMany({})
    cleanupLog.push('✅ Cleared course feedback')
    
    // Clear announcements
    await prisma.announcementRecipient.deleteMany({})
    cleanupLog.push('✅ Cleared announcement recipients')
    
    await prisma.courseAnnouncement.deleteMany({})
    cleanupLog.push('✅ Cleared course announcements')
    
    // Clear user progress and activity
    await prisma.courseProgress.deleteMany({})
    cleanupLog.push('✅ Cleared course progress')
    
    await prisma.mockAttempt.deleteMany({})
    cleanupLog.push('✅ Cleared mock attempts')
    
    await prisma.sessionEnrollment.deleteMany({})
    cleanupLog.push('✅ Cleared session enrollments')
    
    // Clear subscriptions and enrollments (must clear coupon usage first)
    await prisma.couponUsage.deleteMany({})
    cleanupLog.push('✅ Cleared coupon usage')
    
    await prisma.subscription.deleteMany({})
    cleanupLog.push('✅ Cleared subscriptions')
    
    await prisma.enrollment.deleteMany({})
    cleanupLog.push('✅ Cleared course enrollments')
    
    // Clear coupons
    await prisma.coupon.deleteMany({})
    cleanupLog.push('✅ Cleared coupons')
    
    cleanupLog.push('📝 Clearing content and communication data...')
    
    // Clear testimonials and success stories
    await prisma.testimonial.deleteMany({})
    cleanupLog.push('✅ Cleared testimonials')
    
    await prisma.studentSuccessStory.deleteMany({})
    cleanupLog.push('✅ Cleared student success stories')
    
    // Clear contact messages
    await prisma.contactUs.deleteMany({})
    cleanupLog.push('✅ Cleared contact messages')
    
    // Clear FAQ
    await prisma.fAQ.deleteMany({})
    cleanupLog.push('✅ Cleared FAQ entries')
    
    // Clear newsletter
    await prisma.newsletter.deleteMany({})
    cleanupLog.push('✅ Cleared newsletter subscriptions')
    
    cleanupLog.push('🎥 Clearing media and educational content...')
    
    // Clear YouTube content
    await prisma.youtubeVideo.deleteMany({})
    cleanupLog.push('✅ Cleared YouTube videos')
    
    await prisma.youtubeCategory.deleteMany({})
    cleanupLog.push('✅ Cleared YouTube categories')
    
    // Clear educational materials
    await prisma.material.deleteMany({})
    cleanupLog.push('✅ Cleared materials')
    
    await prisma.materialCategory.deleteMany({})
    cleanupLog.push('✅ Cleared material categories')
    
    // Clear uploaded files/settings
    await prisma.settingsUpload.deleteMany({})
    cleanupLog.push('✅ Cleared settings uploads')
    
    cleanupLog.push('🎓 Clearing course content (keeping course structure)...')
    
    // Clear course content but keep courses
    await prisma.quiz.deleteMany({})
    cleanupLog.push('✅ Cleared quizzes')
    
    await prisma.lecture.deleteMany({})
    cleanupLog.push('✅ Cleared lectures')
    
    await prisma.content.deleteMany({})
    cleanupLog.push('✅ Cleared course content')
    
    await prisma.courseDetail.deleteMany({})
    cleanupLog.push('✅ Cleared course details')
    
    // Get final counts
    const finalCounts = {
      users: await prisma.user.count(),
      courses: await prisma.course.count(),
      mockTests: await prisma.mockTest.count(),
      mockBundles: await prisma.mockBundle.count(),
      sessions: await prisma.session.count()
    }
    
    cleanupLog.push('📊 Database cleanup completed successfully!')
    
    return NextResponse.json({
      success: true,
      message: 'Database cleaned successfully for production launch',
      log: cleanupLog,
      finalCounts,
      preservedData: [
        'Users (profiles only)',
        'Courses (structure only)',
        'MockTests (structure only)',
        'MockBundles (structure only)',
        'Sessions (structure only)'
      ],
      clearedData: [
        'All user activity (attempts, progress, enrollments)',
        'All subscriptions and payments',
        'All feedback and announcements',
        'All testimonials and contact messages',
        'All educational content and materials',
        'All coupons and usage tracking',
        'All file uploads and settings'
      ]
    })
    
  } catch (error) {
    console.error('Error during database cleanup:', error)
    return NextResponse.json(
      { 
        error: 'Failed to clean database', 
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}