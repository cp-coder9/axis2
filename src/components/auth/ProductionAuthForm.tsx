import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserRole } from '@/types'
import { useAppContext } from '@/contexts/AppContext'
import { signInWithGoogle, createAccountWithEmail } from '@/services/authService'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  AlertCircle, 
  Loader2, 
  User,
  Building2,
  Wifi,
  WifiOff
} from 'lucide-react'

interface ProductionAuthFormProps {
  className?: string
  onRoleRedirect?: (role: UserRole) => void
}

interface SignUpData {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
  company?: string
  role: UserRole
  agreeToTerms: boolean
}

export function ProductionAuthForm({
  className,
  onRoleRedirect,
  ...props
}: ProductionAuthFormProps & React.ComponentProps<"div">) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.FREELANCER)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('login')
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'connecting'>('online')
  
  // Sign up form state
  const [signUpData, setSignUpData] = useState<SignUpData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    company: '',
    role: UserRole.FREELANCER,
    agreeToTerms: false
  })

  const navigate = useNavigate()
  const { login, getRoleBasedRedirectPath, authState } = useAppContext()

  // Monitor authentication state changes for automatic redirect
  useEffect(() => {
    if (authState.isAuthenticated && authState.user && !authState.loading) {
      const redirectPath = getRoleBasedRedirectPath()
      console.log('Auth state changed, redirecting to:', redirectPath)
      navigate(redirectPath, { replace: true })
    }
  }, [authState.isAuthenticated, authState.user, authState.loading, navigate, getRoleBasedRedirectPath])

  // Monitor connection status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setConnectionStatus('online')
      setError(null)
    }
    
    const handleOffline = () => {
      setIsOnline(false)
      setConnectionStatus('offline')
      setError('You are currently offline. Please check your internet connection.')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Role-based redirection logic
  const handleRoleRedirection = (role: UserRole) => {
    if (onRoleRedirect) {
      onRoleRedirect(role)
      return
    }

    // Use context method for consistent redirection
    const redirectPath = getRoleBasedRedirectPath()
    navigate(redirectPath, { replace: true })
  }

  // Role configuration for UI display
  const roleConfig = {
    [UserRole.ADMIN]: {
      label: 'Admin',
      description: 'Full system access and management',
      color: 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-300',
      selectedColor: 'bg-red-500 text-white dark:bg-red-600'
    },
    [UserRole.CLIENT]: {
      label: 'Client',
      description: 'Project oversight and collaboration',
      color: 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-300',
      selectedColor: 'bg-blue-500 text-white dark:bg-blue-600'
    },
    [UserRole.FREELANCER]: {
      label: 'Freelancer',
      description: 'Project participation and delivery',
      color: 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-300',
      selectedColor: 'bg-green-500 text-white dark:bg-green-600'
    }
  }

  // Handle email/password login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isOnline) {
      setError('Please check your internet connection and try again.')
      return
    }
    
    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }

    setIsLoading(true)
    setError(null)
    setConnectionStatus('connecting')

    try {
      await login(email, password, selectedRole)
      setConnectionStatus('online')
      // Don't navigate here - let the useEffect handle it when auth state updates
      console.log('Login successful, waiting for auth state update...')
      
    } catch (error: any) {
      console.error('Authentication Error:', error)
      setConnectionStatus('offline')
      setIsLoading(false) // Only set loading to false on error
      
      // Handle specific Firebase errors for production
      if (error.message.includes('network')) {
        setError('Network connection failed. Please check your internet connection and try again.')
      } else if (error.message.includes('api-key')) {
        setError('Authentication service is temporarily unavailable. Please try again later.')
      } else {
        setError(error.message || 'Authentication failed. Please try again.')
      }
    }
    // Don't set isLoading to false here - let the redirect happen first
  }

  // Handle sign up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isOnline) {
      setError('Please check your internet connection and try again.')
      return
    }
    
    // Validation
    if (!signUpData.firstName || !signUpData.lastName || !signUpData.email || !signUpData.password) {
      setError('Please fill in all required fields')
      return
    }
    
    if (signUpData.password !== signUpData.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    
    if (signUpData.password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }
    
    if (!signUpData.agreeToTerms) {
      setError('You must agree to the terms and conditions')
      return
    }

    setIsLoading(true)
    setError(null)
    setConnectionStatus('connecting')

    try {
      await createAccountWithEmail({
        name: `${signUpData.firstName} ${signUpData.lastName}`,
        email: signUpData.email,
        password: signUpData.password,
        role: signUpData.role,
        company: signUpData.company
      })
      
      setConnectionStatus('online')
      // Don't navigate here - let the useEffect handle it when auth state updates
      console.log('Sign up successful, waiting for auth state update...')
      
    } catch (error: any) {
      console.error('Sign Up Error:', error)
      setConnectionStatus('offline')
      setIsLoading(false) // Only set loading to false on error
      
      if (error.message.includes('network')) {
        setError('Network connection failed. Please check your internet connection and try again.')
      } else if (error.message.includes('api-key')) {
        setError('Authentication service is temporarily unavailable. Please try again later.')
      } else {
        setError(error.message || 'Failed to create account. Please try again.')
      }
    }
    // Don't set isLoading to false here - let the redirect happen first
  }

  // Handle Google authentication
  const handleGoogleAuth = async () => {
    if (!isOnline) {
      setError('Please check your internet connection and try again.')
      return
    }

    setIsLoading(true)
    setError(null)
    setConnectionStatus('connecting')

    const role = activeTab === 'login' ? selectedRole : signUpData.role

    try {
      await signInWithGoogle(role)
      setConnectionStatus('online')
      handleRoleRedirection(role)
      
    } catch (error: any) {
      console.error('Google Authentication Error:', error)
      setConnectionStatus('offline')
      
      let errorMessage = 'Failed to sign in with Google. Please try again.'
      
      if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Popup was blocked by your browser. Please disable popup blockers for this site and try again.'
      } else if (error.code === 'auth/popup-closed-by-user') {
        setIsLoading(false)
        setConnectionStatus('online')
        return
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection and try again.'
      } else if (error.message.includes('api-key')) {
        errorMessage = 'Authentication service is temporarily unavailable. Please try again later.'
      } else if (error.message.includes('Cross-Origin-Opener-Policy') || error.message.includes('popup')) {
        errorMessage = 'Browser security settings are blocking the sign-in popup. Please try using email/password sign-in or contact support.'
      }
      
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl font-bold">Architex Axis</CardTitle>
            </div>
            
            {/* Connection Status Indicator */}
            <div className="flex items-center justify-center gap-2 mb-2">
              {connectionStatus === 'online' ? (
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <Wifi className="h-3 w-3" />
                  <span>Connected</span>
                </div>
              ) : connectionStatus === 'offline' ? (
                <div className="flex items-center gap-1 text-xs text-red-600">
                  <WifiOff className="h-3 w-3" />
                  <span>Offline</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-xs text-yellow-600">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Connecting...</span>
                </div>
              )}
            </div>
            
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
          </CardHeader>
          
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Login Tab */}
            <TabsContent value="login" className="space-y-4">
              <CardDescription className="text-center">
                Enter your credentials to access your account
              </CardDescription>

              {/* Role Selection for Login */}
              <div className="mb-6">
                <Label className="text-sm font-medium mb-3 block">Select Account Type</Label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(roleConfig).map(([role, config]) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setSelectedRole(role as UserRole)}
                      disabled={isLoading}
                      className={cn(
                        "p-3 rounded-lg text-xs font-medium transition-all border disabled:opacity-50",
                        selectedRole === role 
                          ? config.selectedColor 
                          : config.color
                      )}
                    >
                      {config.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  {roleConfig[selectedRole].description}
                </p>
              </div>

              {/* Google Sign In */}
              <Button
                variant="outline"
                className="w-full mb-4"
                onClick={handleGoogleAuth}
                disabled={isLoading || !isOnline}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                )}
                Continue with Google
              </Button>

              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
                </div>
              </div>

              {/* Email/Password Login Form */}
              <form onSubmit={handleEmailLogin}>
                <div className="flex flex-col gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-9"
                        disabled={isLoading || !isOnline}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid gap-2">
                    <div className="flex items-center">
                      <Label htmlFor="login-password">Password</Label>
                      <button
                        type="button"
                        className="ml-auto inline-block text-sm underline-offset-4 hover:underline text-muted-foreground bg-transparent border-none cursor-pointer disabled:opacity-50"
                        disabled={isLoading || !isOnline}
                        onClick={(e) => {
                          e.preventDefault()
                          setError('Password reset functionality will be available soon')
                        }}
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-9 pr-9"
                        disabled={isLoading || !isOnline}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1 h-7 w-7 p-0"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading || !isOnline}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                        <span className="sr-only">
                          {showPassword ? 'Hide password' : 'Show password'}
                        </span>
                      </Button>
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading || !isOnline}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      'Sign in'
                    )}
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* Sign Up Tab */}
            <TabsContent value="signup" className="space-y-4">
              <CardDescription className="text-center">
                Create your account to get started
              </CardDescription>

              {/* Google Sign Up */}
              <Button
                variant="outline"
                className="w-full mb-4"
                onClick={handleGoogleAuth}
                disabled={isLoading || !isOnline}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                )}
                Continue with Google
              </Button>

              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
                </div>
              </div>

              {/* Sign Up Form */}
              <form onSubmit={handleSignUp}>
                <div className="flex flex-col gap-4">
                  {/* Name Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="firstName"
                          placeholder="John"
                          className="pl-9"
                          value={signUpData.firstName}
                          onChange={(e) => setSignUpData({ ...signUpData, firstName: e.target.value })}
                          disabled={isLoading || !isOnline}
                          required
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        placeholder="Doe"
                        value={signUpData.lastName}
                        onChange={(e) => setSignUpData({ ...signUpData, lastName: e.target.value })}
                        disabled={isLoading || !isOnline}
                        required
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="grid gap-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="john@example.com"
                        className="pl-9"
                        value={signUpData.email}
                        onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                        disabled={isLoading || !isOnline}
                        required
                      />
                    </div>
                  </div>

                  {/* Company (Optional) */}
                  <div className="grid gap-2">
                    <Label htmlFor="company">Company (Optional)</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="company"
                        placeholder="Your Company"
                        className="pl-9"
                        value={signUpData.company}
                        onChange={(e) => setSignUpData({ ...signUpData, company: e.target.value })}
                        disabled={isLoading || !isOnline}
                      />
                    </div>
                  </div>

                  {/* Role Selection */}
                  <div className="grid gap-2">
                    <Label>Account Type</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(roleConfig).map(([role, config]) => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => setSignUpData({ ...signUpData, role: role as UserRole })}
                          disabled={isLoading || !isOnline}
                          className={cn(
                            "p-3 rounded-lg text-xs font-medium transition-all border disabled:opacity-50",
                            signUpData.role === role 
                              ? config.selectedColor 
                              : config.color
                          )}
                        >
                          {config.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Password Fields */}
                  <div className="grid gap-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create a password"
                        className="pl-9 pr-9"
                        value={signUpData.password}
                        onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                        disabled={isLoading || !isOnline}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1 h-7 w-7 p-0"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading || !isOnline}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Confirm your password"
                        className="pl-9"
                        value={signUpData.confirmPassword}
                        onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
                        disabled={isLoading || !isOnline}
                        required
                      />
                    </div>
                  </div>

                  {/* Terms Agreement */}
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="terms" 
                      checked={signUpData.agreeToTerms}
                      onCheckedChange={(checked) => 
                        setSignUpData({ ...signUpData, agreeToTerms: checked as boolean })
                      }
                      disabled={isLoading || !isOnline}
                    />
                    <Label htmlFor="terms" className="text-sm">
                      I agree to the{" "}
                      <button 
                        type="button"
                        className="underline underline-offset-4 hover:text-primary bg-transparent border-none cursor-pointer"
                      >
                        Terms of Service
                      </button>{" "}
                      and{" "}
                      <button 
                        type="button"
                        className="underline underline-offset-4 hover:text-primary bg-transparent border-none cursor-pointer"
                      >
                        Privacy Policy
                      </button>
                    </Label>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading || !isOnline}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      'Create account'
                    )}
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* Offline Notice */}
            {!isOnline && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg dark:bg-yellow-900/20 dark:border-yellow-800">
                <p className="text-xs text-yellow-700 text-center dark:text-yellow-300">
                  <strong>Offline Mode:</strong> Please check your internet connection to sign in or create an account.
                </p>
              </div>
            )}

            {/* Admin Notice */}
            {((activeTab === 'login' && selectedRole === UserRole.ADMIN) || 
              (activeTab === 'signup' && signUpData.role === UserRole.ADMIN)) && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg dark:bg-amber-900/20 dark:border-amber-800">
                <p className="text-xs text-amber-700 text-center dark:text-amber-300">
                  <strong>Admin Access:</strong> Administrative accounts require approval.
                  Contact your system administrator for admin privileges.
                </p>
              </div>
            )}
          </CardContent>
        </Tabs>
      </Card>
    </div>
  )
}