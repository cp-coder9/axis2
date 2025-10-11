import * as React from "react"
import { Button } from "@/components/ui/button"
import { 
  ResponsiveModal, 
  ResponsiveModalHeader, 
  ResponsiveModalFooter, 
  ResponsiveModalTitle, 
  ResponsiveModalDescription 
} from "@/components/ui/responsive-modal"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogFooter, 
  DialogTitle, 
  DialogDescription,
  DialogTrigger 
} from "@/components/ui/dialog"
import { 
  BottomSheet, 
  BottomSheetContent, 
  BottomSheetHeader, 
  BottomSheetFooter, 
  BottomSheetTitle, 
  BottomSheetDescription,
  BottomSheetTrigger 
} from "@/components/ui/bottom-sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useResponsiveModalState } from "@/hooks/useResponsiveModal"
import { Sparkles, Smartphone, Monitor, Palette, Settings, User, FileText } from "lucide-react"

export function GlassmorphismModalDemo() {
  const responsiveModal = useResponsiveModalState()
  const [dialogVariant, setDialogVariant] = React.useState<"default" | "glass" | "solid" | "minimal">("glass")
  const [overlayVariant, setOverlayVariant] = React.useState<"default" | "glass" | "blur">("glass")

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">Glassmorphism Modal System</h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Experience modern modal interactions with glassmorphism effects, responsive behavior, 
          and smooth spring animations. Automatically adapts between desktop dialogs and mobile bottom sheets.
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Monitor className="h-4 w-4" />
          <span>Desktop: Dialog</span>
          <span className="mx-2">•</span>
          <Smartphone className="h-4 w-4" />
          <span>Mobile: Bottom Sheet</span>
        </div>
      </div>

      <Tabs defaultValue="responsive" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="responsive">Responsive</TabsTrigger>
          <TabsTrigger value="variants">Variants</TabsTrigger>
          <TabsTrigger value="mobile">Mobile Only</TabsTrigger>
          <TabsTrigger value="examples">Examples</TabsTrigger>
        </TabsList>

        <TabsContent value="responsive" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Responsive Modal System
              </CardTitle>
              <CardDescription>
                Automatically switches between dialog and bottom sheet based on screen size
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Dialog Variant</Label>
                  <select 
                    value={dialogVariant} 
                    onChange={(e) => setDialogVariant(e.target.value as any)}
                    className="w-full p-2 border rounded-md bg-background"
                  >
                    <option value="default">Default</option>
                    <option value="glass">Glass</option>
                    <option value="solid">Solid</option>
                    <option value="minimal">Minimal</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Overlay Variant</Label>
                  <select 
                    value={overlayVariant} 
                    onChange={(e) => setOverlayVariant(e.target.value as any)}
                    className="w-full p-2 border rounded-md bg-background"
                  >
                    <option value="default">Default</option>
                    <option value="glass">Glass</option>
                    <option value="blur">Blur</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <Button onClick={responsiveModal.openModal} className="w-full">
                    Open Responsive Modal
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <ResponsiveModal
            open={responsiveModal.isOpen}
            onOpenChange={responsiveModal.setIsOpen}
            dialogVariant={dialogVariant}
            overlayVariant={overlayVariant}
          >
            <ResponsiveModalHeader>
              <ResponsiveModalTitle>Responsive Modal Example</ResponsiveModalTitle>
              <ResponsiveModalDescription>
                This modal automatically adapts to your screen size. On desktop, it appears as a centered dialog. 
                On mobile, it slides up as a bottom sheet with drag-to-dismiss functionality.
              </ResponsiveModalDescription>
            </ResponsiveModalHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" placeholder="Enter your name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="Enter your email" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" placeholder="Enter your message" rows={3} />
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Glassmorphism</Badge>
                <Badge variant="secondary">Responsive</Badge>
                <Badge variant="secondary">Spring Animations</Badge>
                <Badge variant="secondary">Touch Gestures</Badge>
              </div>
            </div>

            <ResponsiveModalFooter>
              <Button variant="outline" onClick={responsiveModal.closeModal}>
                Cancel
              </Button>
              <Button onClick={responsiveModal.closeModal}>
                Save Changes
              </Button>
            </ResponsiveModalFooter>
          </ResponsiveModal>
        </TabsContent>

        <TabsContent value="variants" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Glass Variant */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <Sparkles className="h-5 w-5" />
                  Glass Effect
                </Button>
              </DialogTrigger>
              <DialogContent variant="glass" overlayVariant="glass">
                <DialogHeader>
                  <DialogTitle>Glass Modal</DialogTitle>
                  <DialogDescription>
                    Beautiful glassmorphism effect with backdrop blur
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <p className="text-sm text-muted-foreground">
                    This modal uses glassmorphism effects for a modern, translucent appearance.
                  </p>
                </div>
                <DialogFooter>
                  <Button>Got it</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Solid Variant */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <Monitor className="h-5 w-5" />
                  Solid
                </Button>
              </DialogTrigger>
              <DialogContent variant="solid" overlayVariant="default">
                <DialogHeader>
                  <DialogTitle>Solid Modal</DialogTitle>
                  <DialogDescription>
                    Traditional solid background with enhanced shadows
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <p className="text-sm text-muted-foreground">
                    Classic modal design with solid background and enhanced shadow effects.
                  </p>
                </div>
                <DialogFooter>
                  <Button>Got it</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Minimal Variant */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <Settings className="h-5 w-5" />
                  Minimal
                </Button>
              </DialogTrigger>
              <DialogContent variant="minimal" overlayVariant="blur">
                <DialogHeader>
                  <DialogTitle>Minimal Modal</DialogTitle>
                  <DialogDescription>
                    Clean, minimal design with subtle backdrop
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <p className="text-sm text-muted-foreground">
                    Minimal design approach with subtle styling and clean lines.
                  </p>
                </div>
                <DialogFooter>
                  <Button>Got it</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Large Size */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <FileText className="h-5 w-5" />
                  Large Size
                </Button>
              </DialogTrigger>
              <DialogContent variant="glass" size="2xl" overlayVariant="glass">
                <DialogHeader>
                  <DialogTitle>Large Glass Modal</DialogTitle>
                  <DialogDescription>
                    Extra large modal with glassmorphism effects
                  </DialogDescription>
                </DialogHeader>
                <div className="py-8 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>First Name</Label>
                      <Input placeholder="John" />
                    </div>
                    <div className="space-y-2">
                      <Label>Last Name</Label>
                      <Input placeholder="Doe" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Bio</Label>
                    <Textarea placeholder="Tell us about yourself..." rows={4} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline">Cancel</Button>
                  <Button>Save Profile</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </TabsContent>

        <TabsContent value="mobile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Mobile Bottom Sheet Examples
              </CardTitle>
              <CardDescription>
                Bottom sheets with drag-to-dismiss and different heights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <BottomSheet>
                  <BottomSheetTrigger asChild>
                    <Button variant="outline" className="h-16 flex-col gap-1">
                      <span className="text-sm font-medium">Auto Height</span>
                      <span className="text-xs text-muted-foreground">Fits content</span>
                    </Button>
                  </BottomSheetTrigger>
                  <BottomSheetContent variant="glass" height="auto">
                    <BottomSheetHeader>
                      <BottomSheetTitle>Auto Height Sheet</BottomSheetTitle>
                      <BottomSheetDescription>
                        This sheet adjusts its height based on content
                      </BottomSheetDescription>
                    </BottomSheetHeader>
                    <div className="py-4">
                      <p className="text-sm text-muted-foreground">
                        The bottom sheet automatically sizes itself to fit the content.
                        Try dragging down to dismiss!
                      </p>
                    </div>
                    <BottomSheetFooter>
                      <Button>Action</Button>
                    </BottomSheetFooter>
                  </BottomSheetContent>
                </BottomSheet>

                <BottomSheet>
                  <BottomSheetTrigger asChild>
                    <Button variant="outline" className="h-16 flex-col gap-1">
                      <span className="text-sm font-medium">Half Height</span>
                      <span className="text-xs text-muted-foreground">50% screen</span>
                    </Button>
                  </BottomSheetTrigger>
                  <BottomSheetContent variant="glass" height="half">
                    <BottomSheetHeader>
                      <BottomSheetTitle>Half Height Sheet</BottomSheetTitle>
                      <BottomSheetDescription>
                        Takes up half the screen height
                      </BottomSheetDescription>
                    </BottomSheetHeader>
                    <div className="py-4 space-y-4">
                      <div className="space-y-2">
                        <Label>Search</Label>
                        <Input placeholder="Search for something..." />
                      </div>
                      <div className="space-y-2">
                        <Label>Filter</Label>
                        <Input placeholder="Filter results..." />
                      </div>
                    </div>
                    <BottomSheetFooter>
                      <Button variant="outline">Clear</Button>
                      <Button>Apply</Button>
                    </BottomSheetFooter>
                  </BottomSheetContent>
                </BottomSheet>

                <BottomSheet>
                  <BottomSheetTrigger asChild>
                    <Button variant="outline" className="h-16 flex-col gap-1">
                      <span className="text-sm font-medium">Full Height</span>
                      <span className="text-xs text-muted-foreground">85% screen</span>
                    </Button>
                  </BottomSheetTrigger>
                  <BottomSheetContent variant="glass" height="full">
                    <BottomSheetHeader>
                      <BottomSheetTitle>Full Height Sheet</BottomSheetTitle>
                      <BottomSheetDescription>
                        Nearly full screen for complex forms
                      </BottomSheetDescription>
                    </BottomSheetHeader>
                    <div className="py-4 space-y-4">
                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                          <Label>Project Name</Label>
                          <Input placeholder="Enter project name" />
                        </div>
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Textarea placeholder="Project description..." rows={3} />
                        </div>
                        <div className="space-y-2">
                          <Label>Team Members</Label>
                          <Input placeholder="Add team members..." />
                        </div>
                        <div className="space-y-2">
                          <Label>Due Date</Label>
                          <Input type="date" />
                        </div>
                      </div>
                    </div>
                    <BottomSheetFooter>
                      <Button variant="outline">Cancel</Button>
                      <Button>Create Project</Button>
                    </BottomSheetFooter>
                  </BottomSheetContent>
                </BottomSheet>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="examples" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Profile Modal</CardTitle>
                <CardDescription>Example of a form modal with glassmorphism</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveModal
                  dialogVariant="glass"
                  overlayVariant="glass"
                  bottomSheetVariant="glass"
                  bottomSheetHeight="full"
                >
                  <Button className="w-full">
                    <User className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                  <ResponsiveModalHeader>
                    <ResponsiveModalTitle>Edit Profile</ResponsiveModalTitle>
                    <ResponsiveModalDescription>
                      Update your profile information
                    </ResponsiveModalDescription>
                  </ResponsiveModalHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>First Name</Label>
                        <Input defaultValue="John" />
                      </div>
                      <div className="space-y-2">
                        <Label>Last Name</Label>
                        <Input defaultValue="Doe" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input type="email" defaultValue="john@example.com" />
                    </div>
                    <div className="space-y-2">
                      <Label>Bio</Label>
                      <Textarea defaultValue="Software developer passionate about UI/UX" rows={3} />
                    </div>
                  </div>
                  <ResponsiveModalFooter>
                    <Button variant="outline">Cancel</Button>
                    <Button>Save Changes</Button>
                  </ResponsiveModalFooter>
                </ResponsiveModal>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Settings Modal</CardTitle>
                <CardDescription>Configuration modal with tabs</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveModal
                  dialogVariant="minimal"
                  overlayVariant="blur"
                  dialogSize="xl"
                >
                  <Button variant="outline" className="w-full">
                    <Settings className="h-4 w-4 mr-2" />
                    Open Settings
                  </Button>
                  <ResponsiveModalHeader>
                    <ResponsiveModalTitle>Settings</ResponsiveModalTitle>
                    <ResponsiveModalDescription>
                      Manage your application preferences
                    </ResponsiveModalDescription>
                  </ResponsiveModalHeader>
                  <Tabs defaultValue="general" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="general">General</TabsTrigger>
                      <TabsTrigger value="appearance">Appearance</TabsTrigger>
                      <TabsTrigger value="notifications">Notifications</TabsTrigger>
                    </TabsList>
                    <TabsContent value="general" className="space-y-4">
                      <div className="space-y-2">
                        <Label>Language</Label>
                        <select className="w-full p-2 border rounded-md bg-background">
                          <option>English</option>
                          <option>Spanish</option>
                          <option>French</option>
                        </select>
                      </div>
                    </TabsContent>
                    <TabsContent value="appearance" className="space-y-4">
                      <div className="space-y-2">
                        <Label>Theme</Label>
                        <select className="w-full p-2 border rounded-md bg-background">
                          <option>Light</option>
                          <option>Dark</option>
                          <option>System</option>
                        </select>
                      </div>
                    </TabsContent>
                    <TabsContent value="notifications" className="space-y-4">
                      <div className="space-y-2">
                        <Label>Email Notifications</Label>
                        <select className="w-full p-2 border rounded-md bg-background">
                          <option>All</option>
                          <option>Important only</option>
                          <option>None</option>
                        </select>
                      </div>
                    </TabsContent>
                  </Tabs>
                  <ResponsiveModalFooter>
                    <Button variant="outline">Reset</Button>
                    <Button>Save Settings</Button>
                  </ResponsiveModalFooter>
                </ResponsiveModal>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}