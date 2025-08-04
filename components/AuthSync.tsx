// components/AuthSync.tsx
'use client'
import { useSyncUserWithDB } from '@/hooks/useSyncUserWithDB'

export const AuthSync = () => {
  useSyncUserWithDB()
  return null // No UI, just logic
}
