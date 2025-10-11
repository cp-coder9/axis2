/**
 * Central shadcn-ui component exports
 * This file makes it easier to import components and aids MCP server indexing
 */

// Core UI Components
export { Button, buttonVariants } from "../ui/button"
export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card"
export { Input } from "../ui/input"
export { Label } from "../ui/label"
export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectLabel } from "../ui/select"
export { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "../ui/dialog"
export { Badge, badgeVariants } from "../ui/badge"

// Form Components
export { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "../ui/form"
export { Checkbox } from "../ui/checkbox"
export { Textarea } from "../ui/textarea"
export { Alert, AlertDescription, AlertTitle } from "../ui/alert"

// Layout Components
export { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"

// Navigation Components
export { NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger, NavigationMenuViewport } from "../ui/navigation-menu"
export { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "../ui/sheet"
export { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from "../ui/dropdown-menu"
export { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
export { Separator } from "../ui/separator"

// Utility functions
export { cn } from "../../lib/utils"

// Re-export types for TypeScript support
export type { ButtonProps } from "../ui/button"
