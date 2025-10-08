export interface UserData {
  id: string
  name: string | null
  email: string
  role: "STUDENT" | "INSTRUCTOR" | "ADMIN"
  phoneNumber?: string | null
  fieldOfStudy?: string | null
  isSubscribed: boolean
  profileImageUrl?: string | null
  createdAt: string
  joinedAt: string
  
  // Statistics
  subscriptionsCount: number
  enrollmentsCount: number
  totalRevenue: number
  mockAttemptsCount: number
  avgMockScore: number
  
  // Detailed data for user details
  subscriptions?: Array<{
    id: string
    paid: boolean
    amount: number
    isActive: boolean
    purchasedAt: string
    expiresAt: string | null
    createdAt: string
    course?: {
      id: string
      title: string
      price: number
    }
    mockTest?: {
      id: string
      title: string
      price: number
    }
    mockBundle?: {
      id: string
      title: string
      basePrice: number
    }
  }>
  
  enrollments?: Array<{
    id: string
    enrolledAt: string
    progress: number
    course: {
      id: string
      title: string
      price: number
    }
  }>
  
  courseProgress?: Array<{
    id: string
    progress: number
    completed: boolean
    course: {
      id: string
      title: string
    }
    content: {
      id: string
      title: string
    }
  }>
}