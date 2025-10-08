/**
 * Simple Database Cleanup Script
 * 
 * This is a simplified version that you can run by calling the API endpoint:
 * POST /api/admin/cleanup-simple
 * 
 * Or create a simple page to trigger it.
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function CleanupPage() {
  const [loading, setLoading] = useState(false)
  const [log, setLog] = useState<string[]>([])
  const [testResult, setTestResult] = useState<string>('')

  const testAPI = async () => {
    try {
      const response = await fetch('/api/admin/cleanup-simple', {
        method: 'GET'
      })
      
      if (response.ok) {
        const data = await response.json()
        setTestResult(`✅ API Working: ${data.message}`)
      } else {
        setTestResult(`❌ API Error: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      setTestResult(`❌ Network Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  const runCleanup = async () => {
    // First confirmation
    const firstConfirm = confirm(
      '⚠️ PRODUCTION DATABASE CLEANUP\n\n' +
      'This will permanently delete:\n' +
      '• All user activity data\n' +
      '• All payments & subscriptions\n' +
      '• All feedback & announcements\n' +
      '• Contact messages & newsletters\n\n' +
      'Are you sure you want to continue?'
    )
    
    if (!firstConfirm) return

    // Second confirmation for safety
    const secondConfirm = confirm(
      '🚨 FINAL CONFIRMATION\n\n' +
      'This action CANNOT be undone!\n\n' +
      'Type "YES" in your mind and click OK to proceed with database cleanup.'
    )
    
    if (!secondConfirm) return

    setLoading(true)
    setLog(['🚀 Starting database cleanup for production...'])

    try {
      const response = await fetch('/api/admin/cleanup-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ confirmation: 'CLEAR_ALL_DATA' })
      })

      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)

      const data = await response.json()
      console.log('Response data:', data)

      if (response.ok) {
        setLog(data.log || ['✅ Cleanup completed successfully'])
        toast.success('🎉 Database cleaned successfully! Ready for production!', {
          duration: 5000,
        })
      } else {
        throw new Error(data.error || 'Failed to clean database')
      }
    } catch (error) {
      console.error('Cleanup error:', error)
      toast.error('❌ Failed to clean database')
      setLog(prev => [...prev, `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold text-red-600 dark:text-red-400">
            🧹 Production Database Cleanup
          </CardTitle>
          <p className="text-center text-muted-foreground">
            Prepare your database for production launch
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg border-2 border-red-200 dark:border-red-800">
            <h3 className="font-bold text-red-800 dark:text-red-200 mb-3 text-lg">
              ⚠️ DANGER ZONE - What will be DELETED:
            </h3>
            <ul className="text-sm text-red-700 dark:text-red-300 space-y-2">
              <li>• 🗑️ All user activity (attempts, progress, enrollments)</li>
              <li>• 💳 All subscriptions and payments</li>
              <li>• 💬 All feedback and announcements</li>
              <li>• 📧 Contact messages and newsletters</li>
              <li>• 📊 All user statistics (reset to 0)</li>
            </ul>
          </div>

          <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border-2 border-green-200 dark:border-green-800">
            <h3 className="font-bold text-green-800 dark:text-green-200 mb-3 text-lg">
              ✅ SAFE - What will be PRESERVED:
            </h3>
            <ul className="text-sm text-green-700 dark:text-green-300 space-y-2">
              <li>• 👤 User profiles and accounts</li>
              <li>• 📚 All courses with complete content</li>
              <li>• 🎯 All mock tests and bundles</li>
              <li>• 🎓 All guidance sessions</li>
              <li>• 📖 All lectures and materials</li>
              <li>• 🏗️ Complete platform structure</li>
            </ul>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
              📋 Cleanup Process:
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              This process will clear all test data while keeping your platform structure intact. 
              Perfect for launching with a clean slate while preserving all your content.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={testAPI}
              variant="outline"
              className="flex-1"
            >
              🔧 Test API Connection
            </Button>
          </div>

          {testResult && (
            <div className={`p-3 rounded-lg border text-sm ${
              testResult.includes('✅') 
                ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
                : 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
            }`}>
              {testResult}
            </div>
          )}

          <Button
            onClick={runCleanup}
            disabled={loading}
            className={`w-full h-12 text-lg font-bold ${
              loading 
                ? "bg-gray-500" 
                : "bg-red-600 hover:bg-red-700 text-white"
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <span className="animate-spin mr-2">🔄</span>
                <span>Cleaning Database...</span>
              </div>
            ) : (
              <>
                🧹 CLEAN DATABASE FOR PRODUCTION
              </>
            )}
          </Button>

          {log.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border">
              <h3 className="font-semibold mb-2">Cleanup Log:</h3>
              <div className="space-y-1 text-sm font-mono">
                {log.map((line, index) => (
                  <div key={`log-${index}-${line.slice(0, 10)}`} className="text-gray-700 dark:text-gray-300">
                    {line}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}