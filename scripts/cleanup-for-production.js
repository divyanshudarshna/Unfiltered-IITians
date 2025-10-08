/**
 * Database Cleanup Script for Production Launch
 * Run with: node scripts/cleanup-for-production.js
 */

const { PrismaClient } = require('@prisma/client')
const dotenv = require('dotenv')
const path = require('path')

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const prisma = new PrismaClient()

async function clearProductionData() {
  console.log('🚀 Starting database cleanup for production launch...\n')
  
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
    await prisma.testimonial.deleteMany({})
    console.log('✅ Cleared testimonials')
    
    await prisma.studentSuccessStory.deleteMany({})
    console.log('✅ Cleared student success stories')
    
    // Clear contact messages
    await prisma.contactUs.deleteMany({})
    console.log('✅ Cleared contact messages')
    
    // Clear FAQ
    await prisma.fAQ.deleteMany({})
    console.log('✅ Cleared FAQ entries')
    
    // Clear newsletter
    await prisma.newsletter.deleteMany({})
    console.log('✅ Cleared newsletter subscriptions')
    
    console.log('\n🎥 Clearing media and educational content...')
    
    // Clear YouTube content
    await prisma.youtubeVideo.deleteMany({})
    console.log('✅ Cleared YouTube videos')
    
    await prisma.youtubeCategory.deleteMany({})
    console.log('✅ Cleared YouTube categories')
    
    // Clear educational materials
    await prisma.material.deleteMany({})
    console.log('✅ Cleared materials')
    
    await prisma.materialCategory.deleteMany({})
    console.log('✅ Cleared material categories')
    
    // Clear uploaded files/settings
    await prisma.settingsUpload.deleteMany({})
    console.log('✅ Cleared settings uploads')
    
    console.log('\n🎓 Clearing course content (keeping course structure)...')
    
    // Clear course content but keep courses
    await prisma.quiz.deleteMany({})
    console.log('✅ Cleared quizzes')
    
    await prisma.lecture.deleteMany({})
    console.log('✅ Cleared lectures')
    
    await prisma.content.deleteMany({})
    console.log('✅ Cleared course content')
    
    await prisma.courseDetail.deleteMany({})
    console.log('✅ Cleared course details')
    
    console.log('\n📊 Database cleanup completed successfully!')
    console.log('\n📋 PRESERVED DATA:')
    console.log('✅ Users (profiles only)')
    console.log('✅ Courses (structure only)')
    console.log('✅ MockTests (structure only)')
    console.log('✅ MockBundles (structure only)')
    console.log('✅ Sessions (structure only)')
    
    console.log('\n🗑️  CLEARED DATA:')
    console.log('❌ All user activity (attempts, progress, enrollments)')
    console.log('❌ All subscriptions and payments')
    console.log('❌ All feedback and announcements')
    console.log('❌ All testimonials and contact messages')
    console.log('❌ All educational content and materials')
    console.log('❌ All coupons and usage tracking')
    console.log('❌ All file uploads and settings')
    
    // Get final counts
    const userCount = await prisma.user.count()
    const courseCount = await prisma.course.count()
    const mockTestCount = await prisma.mockTest.count()
    const mockBundleCount = await prisma.mockBundle.count()
    const sessionCount = await prisma.session.count()
    
    console.log('\n📈 REMAINING DATA COUNTS:')
    console.log(`👥 Users: ${userCount}`)
    console.log(`📚 Courses: ${courseCount}`)
    console.log(`📝 Mock Tests: ${mockTestCount}`)
    console.log(`📦 Mock Bundles: ${mockBundleCount}`)
    console.log(`💼 Sessions: ${sessionCount}`)
    
    console.log('\n🎉 Your database is now ready for production launch!')
    
  } catch (error) {
    console.error('❌ Error during database cleanup:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Optional: Reset user subscription status
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