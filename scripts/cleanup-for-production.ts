/**
 * Database Cleanup Script for Production Launch
 * 
 * This script clears all user activity and test data while preserving:
 * - Users (but only core user data)
 * - MockTests (complete structure and content)
 * - Courses (complete structure and content) 
 * - MockBundles (complete structure and content)
 * - Sessions (complete structure and content)
 * 
 * CLEARS:
 * - All user activity data (attempts, enrollments, subscriptions, progress)
 * - All feedback and announcements
 * - All testimonials and contact messages
 * - All newsletter signups
 * - Selected test/dummy content only
 */

import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const prisma = new PrismaClient()

async function clearProductionData() {
  console.log('🚀 Starting database cleanup for production launch...\n')
  
  // Check if DATABASE_URL is available
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not found!')
    console.error('💡 Please make sure you have a .env file with DATABASE_URL set.')
    console.error('💡 Or run this script from your Next.js project directory.')
    throw new Error('DATABASE_URL environment variable is required')
  }
  
  console.log('✅ Database connection configured')
  
  try {
    // Step 1: Clear all user activity and interaction data
    console.log('📊 Clearing user activity data...')
    
    // Clear feedback system (must be in order due to relations)
    await prisma.feedbackReplyRecipient.deleteMany({})
    console.log('✅ Cleared feedback reply recipients')
    
    await prisma.feedbackReply.deleteMany({})
    console.log('✅ Cleared feedback replies')
    
    await prisma.courseFeedback.deleteMany({})
    console.log('✅ Cleared course feedback')
    
    // Clear announcements
    await prisma.announcementRecipient.deleteMany({})
    console.log('✅ Cleared announcement recipients')
    
    await prisma.courseAnnouncement.deleteMany({})
    console.log('✅ Cleared course announcements')
    
    // Clear user progress and activity
    await prisma.courseProgress.deleteMany({})
    console.log('✅ Cleared course progress')
    
    await prisma.mockAttempt.deleteMany({})
    console.log('✅ Cleared mock attempts')
    
    await prisma.sessionEnrollment.deleteMany({})
    console.log('✅ Cleared session enrollments')
    
    // Clear subscriptions and enrollments (must clear coupon usage first)
    await prisma.couponUsage.deleteMany({})
    console.log('✅ Cleared coupon usage')
    
    await prisma.subscription.deleteMany({})
    console.log('✅ Cleared subscriptions')
    
    await prisma.enrollment.deleteMany({})
    console.log('✅ Cleared course enrollments')
    
    // Clear coupons
    await prisma.coupon.deleteMany({})
    console.log('✅ Cleared coupons')
    
    console.log('\n📝 Clearing content and communication data...')
    
    // Clear testimonials and success stories
    // await prisma.testimonial.deleteMany({})
    // console.log('✅ Cleared testimonials')
    
    await prisma.studentSuccessStory.deleteMany({})
    console.log('✅ Cleared student success stories')
    
    // Clear contact messages
    await prisma.contactUs.deleteMany({})
    console.log('✅ Cleared contact messages')
    
    // Clear FAQ
    // await prisma.fAQ.deleteMany({})
    // console.log('✅ Cleared FAQ entries')
    
    // Clear newsletter
    await prisma.newsletter.deleteMany({})
    console.log('✅ Cleared newsletter subscriptions')
    
    console.log('\n🎥 Clearing media and educational content...')
    
    // Clear YouTube content
    // await prisma.youtubeVideo.deleteMany({})
    // console.log('✅ Cleared YouTube videos')
    
    // await prisma.youtubeCategory.deleteMany({})
    // console.log('✅ Cleared YouTube categories')
    
    // // Clear educational materials
    // await prisma.material.deleteMany({})
    // console.log('✅ Cleared materials')
    
    // await prisma.materialCategory.deleteMany({})
    // console.log('✅ Cleared material categories')
    
    // Clear uploaded files/settings
    // await prisma.settingsUpload.deleteMany({})
    // console.log('✅ Cleared settings uploads')
    
    console.log('\n🎓 Course content will be preserved...')
    
    // Course content is preserved - keeping all courses, lectures, quizzes, and content
    // await prisma.quiz.deleteMany({})
    // console.log('✅ Cleared quizzes')
    
    // await prisma.lecture.deleteMany({})
    // console.log('✅ Cleared lectures')
    
    // await prisma.content.deleteMany({})
    // console.log('✅ Cleared course content')
    
    // await prisma.courseDetail.deleteMany({})
    // console.log('✅ Cleared course details')
    
    console.log('🎓 All course content preserved as requested')
    
    console.log('\n📊 Database cleanup completed successfully!')
    console.log('\n📋 PRESERVED DATA:')
    console.log('✅ Users (profiles only)')
    console.log('✅ Courses (complete structure and content)')
    console.log('✅ MockTests (complete structure and content)')
    console.log('✅ MockBundles (complete structure and content)')
    console.log('✅ Sessions (complete structure and content)')
    console.log('✅ All course lectures, quizzes, and materials')
    
    console.log('\n🗑️  CLEARED DATA:')
    console.log('❌ All user activity (attempts, progress, enrollments)')
    console.log('❌ All subscriptions and payments')
    console.log('❌ All feedback and announcements')
    console.log('❌ Selected contact messages and newsletters')
    console.log('❌ All coupons and usage tracking')
    
    // Get final counts
    const userCount = await prisma.user.count()
    const courseCount = await prisma.course.count()
    const mockTestCount = await prisma.mockTest.count()
    const mockBundleCount = await prisma.mockBundle.count()
    const sessionCount = await prisma.session.count()
    const contentCount = await prisma.content.count()
    const lectureCount = await prisma.lecture.count()
    
    console.log('\n📈 REMAINING DATA COUNTS:')
    console.log(`👥 Users: ${userCount}`)
    console.log(`📚 Courses: ${courseCount}`)
    console.log(`📝 Mock Tests: ${mockTestCount}`)
    console.log(`📦 Mock Bundles: ${mockBundleCount}`)
    console.log(`💼 Sessions: ${sessionCount}`)
    console.log(`📖 Course Content: ${contentCount}`)
    console.log(`🎥 Lectures: ${lectureCount}`)
    
    console.log('\n🎉 Your database is ready for production with all content preserved!')
    
  } catch (error) {
    console.error('❌ Error during database cleanup:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Optional: Reset user subscription status (if you want all users to start fresh)
async function resetUserSubscriptionStatus() {
  console.log('\n🔄 Resetting user subscription status...')
  
  await prisma.user.updateMany({
    data: {
      isSubscribed: false,
      subscriptionKey: null
    }
  })
  
  console.log('✅ All users reset to non-subscribed status')
}

// Main execution
async function main() {
  console.log('⚠️  PRODUCTION DATABASE CLEANUP')
  console.log('⚠️  This will permanently delete all test/dummy data!')
  console.log('⚠️  Make sure you have a backup before proceeding.\n')
  
  // Uncomment the next 3 lines if you want to add a confirmation prompt
  // const readline = require('readline').createInterface({ input: process.stdin, output: process.stdout })
  // const answer = await new Promise(resolve => readline.question('Type "CONFIRM" to proceed: ', resolve))
  // if (answer !== 'CONFIRM') { console.log('Operation cancelled.'); process.exit(0); }
  
  await clearProductionData()
  
  // Uncomment if you want to reset user subscription status
  // await resetUserSubscriptionStatus()
  
  console.log('\n✨ Database cleanup completed successfully!')
  console.log('🚀 Your application is ready for production launch!')
}

// Run the cleanup
main()
  .catch((error) => {
    console.error('💥 Fatal error:', error)
    process.exit(1)
  })