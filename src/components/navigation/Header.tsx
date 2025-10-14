import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useTheme } from "@/components/theme-provider"
import { Bell, Search, Settings, LogOut, User, Sun, Moon, Monitor, Menu } from "lucide-react"
import { cn, shadcnClasses, responsive } from "@/lib/shadcn-utils"
import { useState, useEffect, useRef } from "react"
import { useAppContext } from "@/contexts/AppContext"
import { NotificationCenter } from "@/components/notifications/NotificationCenter"

interface HeaderProps {
  onMobileMenuToggle?: () => void
  className?: string
  showMobileMenu?: boolean
}

interface User {
  name: string
  email: string
  role: 'Admin' | 'Freelancer' | 'Client'
  avatar?: string
}

export function Header({ className, showMobileMenu = true, onMobileMenuToggle }: HeaderProps) {
  const { setTheme } = useTheme()
  const { user, logout } = useAppContext()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")
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

  const UserMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user?.avatarUrl} alt={user?.name} />
            <AvatarFallback className="text-sm">
              {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user?.name || 'User'}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email || 'No email'}
            </p>
            <Badge variant="secondary" className="w-fit mt-1">
              {user?.role || 'Unknown'}
            </Badge>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-600 focus:text-red-600"
          onClick={() => logout()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  const NotificationCenterWrapper = () => {
    if (!user?.id) return null;

    return <NotificationCenter />;
  }

  const SearchBar = () => (
    <div className="relative flex-1 max-w-sm">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        ref={searchRef}
        type="search"
        placeholder="Search projects, tasks... (⌘K)"
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px]"
      />
    </div>
  )

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      className
    )}>
      <div className={cn("flex h-14 items-center", responsive.padding)}>

        {/* Mobile Menu Toggle */}
        {showMobileMenu && (
          <Button
            variant="outline"
            size="icon"
            className="mr-2 md:hidden h-9 w-9"
            onClick={onMobileMenuToggle}
          >
            <Menu className="h-4 w-4" />
            <span className="sr-only">Toggle mobile menu</span>
          </Button>
        )}

        {/* Mobile Logo (shown when mobile menu is not displayed) */}
        {!showMobileMenu && (
          <div className="mr-4 flex md:hidden">
            <a className={cn("flex items-center space-x-2", shadcnClasses.linkBase)} href="/">
              <div className="h-6 w-6 bg-architex-primary rounded"></div>
              <span className="font-bold">Architex Axis</span>
            </a>
          </div>
        )}

        {/* Desktop Logo */}
        <div className="mr-6 hidden md:flex">
          <a className={cn("flex items-center space-x-2", shadcnClasses.linkBase)} href="/">
            <div className="h-6 w-6 bg-architex-primary rounded"></div>
            <span className="hidden font-bold sm:inline-block">
              Architex Axis
            </span>
          </a>
        </div>

        {/* Search and Actions */}
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">

          {/* Search Bar - Hidden on mobile when space is limited */}
          <div className="hidden sm:block">
            <SearchBar />
          </div>

          {/* Right side actions */}
          <nav className="flex items-center space-x-2">
            {/* Mobile search button */}
            <Button
              variant="outline"
              size="icon"
              className="sm:hidden h-9 w-9"
              onClick={() => searchRef.current?.focus()}
            >
              <Search className="h-4 w-4" />
              <span className="sr-only">Search</span>
            </Button>

            <ThemeToggle />
            <NotificationCenterWrapper />
            <UserMenu />
          </nav>
        </div>
      </div>

      {/* Mobile search bar (revealed when search button is tapped) */}
      <div className="block sm:hidden border-t">
        <div className={cn("py-2", responsive.padding)}>
          <SearchBar />
        </div>
      </div>
    </header>
  )
}
