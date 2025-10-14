import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useTheme } from "@/components/theme-provider"
import { useAppContext } from "@/contexts/AppContext"
import { useNavigate } from "react-router-dom"
import { Bell, Search, Settings, LogOut, User, Sun, Moon, Monitor, MessageSquare, Clock, FileText } from "lucide-react"
import { cn } from "@/lib/shadcn-utils"
import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"

interface User {
  name: string
  email: string
  role: 'Admin' | 'Freelancer' | 'Client'
  avatar?: string
  avatarUrl?: string
}

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'error'
  timestamp: Date
  read: boolean
  icon?: React.ReactNode
}

// Mock user data - this would come from your auth context
const mockUser: User = {
  name: "John Doe",
  email: "john.doe@architex.com",
  role: "Admin",
  avatar: undefined
}

// Mock notifications - this would come from your notification context
const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Project Update',
    message: 'Modern Office Complex project has been updated',
    type: 'info',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    read: false,
    icon: <FileText className="h-4 w-4" />
  },
  {
    id: '2',
    title: 'Timer Alert',
    message: 'You have 30 minutes remaining on your current task',
    type: 'warning',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    read: false,
    icon: <Clock className="h-4 w-4" />
  },
  {
    id: '3',
    title: 'New Message',
    message: 'You have a new message from client',
    type: 'success',
    timestamp: new Date(Date.now() - 60 * 60 * 1000),
    read: true,
    icon: <MessageSquare className="h-4 w-4" />
  }
]

export function HeaderContent() {
  const { setTheme } = useTheme()
  const { logout, user } = useAppContext()
  const navigate = useNavigate()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K for search focus
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const ThemeToggle = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="h-9 w-9">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <Monitor className="mr-2 h-4 w-4" />
          <span>System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      await logout()
      toast.success('Logged out successfully')
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Failed to log out. Please try again.')
    } finally {
      setIsLoggingOut(false)
    }
  }

  const UserMenu = () => {
    // Use actual user data if available, fallback to mock
    const displayUser = user || mockUser
    const userName = displayUser.name || displayUser.email?.split('@')[0] || 'User'
    const userEmail = displayUser.email || mockUser.email
    const userRole = displayUser.role || mockUser.role
    const userAvatar = displayUser.avatarUrl || mockUser.avatar

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 rounded-full">
            <Avatar className="h-9 w-9">
              <AvatarImage src={userAvatar} alt={userName} />
              <AvatarFallback className="text-sm">
                {userName.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{userName}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {userEmail}
              </p>
              <Badge variant="secondary" className="w-fit mt-1">
                {userRole}
              </Badge>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate('/profile')}>
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/settings')}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-600 focus:text-red-600"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>{isLoggingOut ? 'Logging out...' : 'Log out'}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  const NotificationCenter = () => {
    const unreadCount = mockNotifications.filter(n => !n.read).length

    return (
      <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon" className="relative h-9 w-9">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
            <span className="sr-only">View notifications ({unreadCount} unread)</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="end">
          <Card className="border-0 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Notifications</CardTitle>
              <CardDescription>
                You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[300px] overflow-y-auto">
                {mockNotifications.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    No notifications yet
                  </div>
                ) : (
                  <div className="space-y-1">
                    {mockNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={cn(
                          "flex items-start gap-3 p-3 hover:bg-muted/50 transition-colors cursor-pointer",
                          !notification.read && "bg-muted/30"
                        )}
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          {notification.icon || <Bell className="h-4 w-4" />}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">{notification.title}</p>
                            {!notification.read && (
                              <div className="h-2 w-2 bg-blue-500 rounded-full" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatRelativeTime(notification.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </PopoverContent>
      </Popover>
    )
  }

  const SearchBar = () => (
    <div className="relative max-w-sm">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        ref={searchRef}
        type="search"
        placeholder="Search projects, tasks... (⌘K)"
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        className="pl-8 w-[300px]"
      />
    </div>
  )

  return (
    <div className="flex flex-1 items-center justify-between">
      {/* Left side - Search */}
      <div className="flex items-center space-x-4">
        <h1 className="text-lg font-semibold">Architex Axis Dashboard</h1>
      </div>

      {/* Center - Search */}
      <div className="hidden md:block">
        <SearchBar />
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center space-x-2">
        {/* Mobile search button */}
        <Button
          variant="outline"
          size="icon"
          className="md:hidden h-9 w-9"
          onClick={() => searchRef.current?.focus()}
        >
          <Search className="h-4 w-4" />
          <span className="sr-only">Search</span>
        </Button>

        <ThemeToggle />
        <NotificationCenter />
        <UserMenu />
      </div>
    </div>
  )
}

// Helper function to format relative time
function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`

  return date.toLocaleDateString()
}

// Legacy export for backward compatibility
export { HeaderContent as Header }
