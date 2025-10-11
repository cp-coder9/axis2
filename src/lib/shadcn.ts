/**
 * Central re-export of shadcn/ui components
 * This makes future refactors and MCP indexing easier
 */

// Form components
export { Button, buttonVariants } from "@/components/ui/button"
export { Input } from "@/components/ui/input"
export { Label } from "@/components/ui/label"
export { Textarea } from "@/components/ui/textarea"
export { Checkbox } from "@/components/ui/checkbox"
export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectLabel, SelectGroup, SelectSeparator } from "@/components/ui/select"
export { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
export { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
export { Slider } from "@/components/ui/slider"
export { Toggle } from "@/components/ui/toggle"

// Layout components
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
export { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
export { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
export { Separator } from "@/components/ui/separator"
export { ScrollArea } from "@/components/ui/scroll-area"
export { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
export { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

// Feedback components
export { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
export { Badge, badgeVariants } from "@/components/ui/badge"
export { Progress } from "@/components/ui/progress"
export { Toast, ToastAction, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast"
export { useToast } from "@/hooks/use-toast"
export { Toaster } from "@/components/ui/toaster"

// Navigation components
export { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "@/components/ui/navigation-menu"
export { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
export { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarSeparator, MenubarTrigger } from "@/components/ui/menubar"

// Sidebar components
export { 
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar
} from "@/components/ui/sidebar"

// Display components
export { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog"
export { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
export { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table"
export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
export { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
export { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
export { Skeleton } from "@/components/ui/skeleton"
export { Switch } from "@/components/ui/switch"
export { Calendar } from "@/components/ui/calendar"
export { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command"

// Chart components
export { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent, 
  ChartLegend, 
  ChartLegendContent,
  type ChartConfig
} from "@/components/ui/chart"

// Utility exports
export { cn } from "@/lib/utils"
export { 
  shadcnClasses, 
  getStatusClasses, 
  getRoleClasses, 
  getButtonVariant, 
  layoutPatterns, 
  responsive, 
  a11y 
} from "@/lib/shadcn-utils"

// Types for component props (useful for extending components)
export type { ButtonProps } from "@/components/ui/button"
