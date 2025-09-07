export type User = {
  id: string
  name: string
  email: string
  createdAt: string
  isSubscribed: boolean
  subscriptions?: { id: string; courseId: string; paid: boolean }[]
  enrollments?: { id: string; courseId: string }[]
  mockAttempts?: { id: string; score: number }[]
  courseProgress?: { id: string; courseId: string; progress: number }[]
}
