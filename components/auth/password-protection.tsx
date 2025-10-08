"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Shield, Lock } from "lucide-react"
import { toast } from "sonner"

interface PasswordProtectionProps {
  readonly children: React.ReactNode
}

const HARDCODED_USERNAME = "ADMIN-2413"
const HARDCODED_PASSWORD = "RAJ-2413"

export function PasswordProtection({ children }: PasswordProtectionProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  // Check if already authenticated from localStorage
  useEffect(() => {
    const authStatus = localStorage.getItem('dev-auth-status')
    const authTime = localStorage.getItem('dev-auth-time')
    
    if (authStatus === 'authenticated' && authTime) {
      const authTimestamp = parseInt(authTime)
      const currentTime = Date.now()
      const hoursPassed = (currentTime - authTimestamp) / (1000 * 60 * 60)
      
      // Session expires after 24 hours
      if (hoursPassed < 24) {
        setIsAuthenticated(true)
      } else {
        // Clear expired session
        localStorage.removeItem('dev-auth-status')
        localStorage.removeItem('dev-auth-time')
      }
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Simulate a small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 1000))

    if (username === HARDCODED_USERNAME && password === HARDCODED_PASSWORD) {
      setIsAuthenticated(true)
      localStorage.setItem('dev-auth-status', 'authenticated')
      localStorage.setItem('dev-auth-time', Date.now().toString())
      toast.success("Access granted! Welcome to developer panel.")
    } else {
      toast.error("Invalid credentials. Access denied.")
      setUsername("")
      setPassword("")
    }

    setLoading(false)
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem('dev-auth-status')
    localStorage.removeItem('dev-auth-time')
    setUsername("")
    setPassword("")
    toast.success("Logged out successfully")
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/20"></div>
        <Card className="w-full max-w-md relative z-10 shadow-2xl border-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
          <CardHeader className="space-y-1 text-center pb-4">
            <div className="mx-auto w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Developer Access
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              This is a protected developer route. Please enter your credentials.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Authenticating...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Access Developer Panel
                  </div>
                )}
              </Button>
            </form>
            <div className="mt-6 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-800 dark:text-amber-200 text-center">
                🔒 This route is protected for developer access only. Unauthorized access is not permitted.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen bg-background">
      {/* Logout Button */}
      <div className="absolute top-4 right-4 z-50">
        <Button
          onClick={handleLogout}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Shield className="h-4 w-4" />
          Logout Dev Panel
        </Button>
      </div>
      <div className="w-full">
        {children}
      </div>
    </div>
  )
}