// Quick test script to debug bundle access issues
// Run this with: npx tsx debug-bundle.ts

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function debugBundleAccess() {
  try {
    console.log('🔍 Debugging Bundle Access Issue')
    console.log('================================')

    // Get all mock bundles
    const bundles = await prisma.mockBundle.findMany({
      select: {
        id: true,
        title: true,
        mockIds: true
      }
    })

    console.log(`\n📦 Found ${bundles.length} bundles:`)
    
    bundles.forEach((bundle, index) => {
      console.log(`\n${index + 1}. Bundle: "${bundle.title}" (ID: ${bundle.id})`)
      console.log(`   mockIds: ${JSON.stringify(bundle.mockIds)}`)
      console.log(`   mockIds type: ${typeof bundle.mockIds}`)
      console.log(`   mockIds length: ${bundle.mockIds?.length || 0}`)
      
      // Sample each mockId
      if (bundle.mockIds && bundle.mockIds.length > 0) {
        bundle.mockIds.forEach((mockId, idx) => {
          console.log(`   mockIds[${idx}]: "${mockId}" (type: ${typeof mockId})`)
        })
      }
    })

    // Get all mock tests for comparison
    const mocks = await prisma.mockTest.findMany({
      select: {
        id: true,
        title: true
      },
      take: 5 // Just first 5 for testing
    })

    console.log(`\n🎯 Sample Mock Tests:`)
    mocks.forEach((mock, index) => {
      console.log(`${index + 1}. Mock: "${mock.title}" (ID: ${mock.id})`)
      console.log(`   ID type: ${typeof mock.id}`)
      
      // Test against each bundle
      bundles.forEach(bundle => {
        const found = bundle.mockIds?.includes(mock.id)
        console.log(`   Found in "${bundle.title}": ${found}`)
      })
    })

    // Get bundle subscriptions
    const subscriptions = await prisma.subscription.findMany({
      where: {
        mockBundleId: { not: null },
        paid: true
      },
      include: {
        mockBundle: {
          select: { id: true, title: true, mockIds: true }
        },
        user: {
          select: { id: true, email: true }
        }
      },
      take: 3
    })

    console.log(`\n💳 Sample Bundle Subscriptions:`)
    subscriptions.forEach((sub, index) => {
      console.log(`${index + 1}. User: ${sub.user?.email}`)
      console.log(`   Bundle: "${sub.mockBundle?.title}"`)
      console.log(`   Bundle mockIds: ${JSON.stringify(sub.mockBundle?.mockIds)}`)
    })

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugBundleAccess()