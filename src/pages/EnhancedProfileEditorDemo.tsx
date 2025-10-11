import React, { useState } from 'react'
import { EnhancedProfileEditor } from '@/components/profile/EnhancedProfileEditor'
import { User, UserRole } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

/**
 * Demo page for testing EnhancedProfileEditor component
 * This page demonstrates all features and role-based behaviors
 */

export default function EnhancedProfileEditorDemo() {
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.FREELANCER)
  const [updateCount, setUpdateCount] = useState(0)

  // Mock users for different roles
  const mockFreelancerUser: User = {
    id: 'freelancer-demo-1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: UserRole.FREELANCER,
    title: 'Senior Architect',
    phone: '+1 (555) 123-4567',
    hourlyRate: 75,
    avatarUrl: '',
    createdAt: new Date('2024-01-15'),
    lastSeen: new Date(),
    skills: ['Architecture', 'Design', 'CAD', 'BIM'],
    preferences: {
      theme: 'light',
      notifications: {
        email: true,
        push: false,
        inApp: true
      }
    }
  }

  const mockClientUser: User = {
    id: 'client-demo-1',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    role: UserRole.CLIENT,
    title: 'Project Manager',
    company: 'Acme Corporation',
    phone: '+1 (555) 987-6543',
    avatarUrl: '',
    createdAt: new Date('2024-02-20'),
    lastSeen: new Date(),
    preferences: {
      theme: 'light',
      notifications: {
        email: true,
        push: false,
        inApp: true
      }
    }
  }

  const mockAdminUser: User = {
    id: 'admin-demo-1',
    name: 'Admin User',
    email: 'admin@example.com',
    role: UserRole.ADMIN,
    title: 'System Administrator',
    phone: '+1 (555) 555-5555',
    avatarUrl: '',
    createdAt: new Date('2023-12-01'),
    lastSeen: new Date(),
    preferences: {
      theme: 'light',
      notifications: {
        email: true,
        push: true,
        inApp: true
      }
    }
  }

  // Get current user based on selected role
  const getCurrentUser = (): User => {
    switch (selectedRole) {
      case UserRole.FREELANCER:
        return mockFreelancerUser
      case UserRole.CLIENT:
        return mockClientUser
      case UserRole.ADMIN:
        return mockAdminUser
      default:
        return mockFreelancerUser
    }
  }

  const currentUser = getCurrentUser()

  // Mock update handler
  const handleUpdate = async (updates: Partial<User>) => {
    console.log('Profile update requested:', updates)
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setUpdateCount(prev => prev + 1)
    toast.success(`Profile updated successfully! (Update #${updateCount + 1})`)
    
    console.log('Updated user data:', { ...currentUser, ...updates })
  }

  // Mock avatar upload handler
  const handleAvatarUpload = async (file: File): Promise<string> => {
    console.log('Avatar upload requested:', file.name, file.size, file.type)
    
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Return mock URL
    const mockUrl = `https://example.com/avatars/${currentUser.id}/${Date.now()}.jpg`
    toast.success('Avatar uploaded successfully!')
    
    return mockUrl
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">
                EnhancedProfileEditor Demo
              </h1>
              <p className="text-muted-foreground mt-2">
                Test the comprehensive profile editing component with real-time validation
              </p>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              Task 6.1 Complete ✓
            </Badge>
          </div>

          {/* Role Selector */}
          <Card>
            <CardHeader>
              <CardTitle>Select User Role to Test</CardTitle>
              <CardDescription>
                Switch between different user roles to see role-specific fields and behaviors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button
                  variant={selectedRole === UserRole.FREELANCER ? 'default' : 'outline'}
                  onClick={() => setSelectedRole(UserRole.FREELANCER)}
                  className="flex-1"
                >
                  Freelancer
                  {selectedRole === UserRole.FREELANCER && ' (Active)'}
                </Button>
                <Button
                  variant={selectedRole === UserRole.CLIENT ? 'default' : 'outline'}
                  onClick={() => setSelectedRole(UserRole.CLIENT)}
                  className="flex-1"
                >
                  Client
                  {selectedRole === UserRole.CLIENT && ' (Active)'}
                </Button>
                <Button
                  variant={selectedRole === UserRole.ADMIN ? 'default' : 'outline'}
                  onClick={() => setSelectedRole(UserRole.ADMIN)}
                  className="flex-1"
                >
                  Admin
                  {selectedRole === UserRole.ADMIN && ' (Active)'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Current User Info */}
          <Card>
            <CardHeader>
              <CardTitle>Current Test User</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{currentUser.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{currentUser.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Role</p>
                  <Badge>{currentUser.role}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Updates</p>
                  <p className="font-medium">{updateCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feature Highlights */}
        <Card>
          <CardHeader>
            <CardTitle>Component Features</CardTitle>
            <CardDescription>
              All features implemented and tested
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <Badge variant="default" className="mt-1">✓</Badge>
                <div>
                  <p className="font-medium">Real-time Validation</p>
                  <p className="text-sm text-muted-foreground">
                    Field-level validation with visual feedback
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="default" className="mt-1">✓</Badge>
                <div>
                  <p className="font-medium">Profile Completeness</p>
                  <p className="text-sm text-muted-foreground">
                    Progress tracking and missing field alerts
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="default" className="mt-1">✓</Badge>
                <div>
                  <p className="font-medium">Role-Based Fields</p>
                  <p className="text-sm text-muted-foreground">
                    Dynamic fields based on user role
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="default" className="mt-1">✓</Badge>
                <div>
                  <p className="font-medium">Avatar Management</p>
                  <p className="text-sm text-muted-foreground">
                    Upload, crop, and manage profile pictures
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="default" className="mt-1">✓</Badge>
                <div>
                  <p className="font-medium">Permission Checks</p>
                  <p className="text-sm text-muted-foreground">
                    Role-based access control for editing
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="default" className="mt-1">✓</Badge>
                <div>
                  <p className="font-medium">Unsaved Changes</p>
                  <p className="text-sm text-muted-foreground">
                    Warning system for unsaved modifications
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Component Demo */}
        <Tabs defaultValue="self-edit" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="self-edit">Self Profile Edit</TabsTrigger>
            <TabsTrigger value="admin-edit">Admin Editing Other User</TabsTrigger>
          </TabsList>

          {/* Self Edit Tab */}
          <TabsContent value="self-edit" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Edit Your Own Profile</CardTitle>
                <CardDescription>
                  Testing scenario: User editing their own profile
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EnhancedProfileEditor
                  user={currentUser}
                  currentUser={currentUser}
                  onUpdate={handleUpdate}
                  onAvatarUpload={handleAvatarUpload}
                  canDelete={false}
                  showAllSections={true}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Admin Edit Tab */}
          <TabsContent value="admin-edit" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Admin Editing Another User</CardTitle>
                <CardDescription>
                  Testing scenario: Admin user editing a freelancer's profile
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EnhancedProfileEditor
                  user={mockFreelancerUser}
                  currentUser={mockAdminUser}
                  onUpdate={handleUpdate}
                  onAvatarUpload={handleAvatarUpload}
                  canDelete={true}
                  showAllSections={true}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Testing Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Testing Instructions</CardTitle>
            <CardDescription>
              How to test all component features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">1. Role-Specific Fields</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Switch to Freelancer: See hourly rate, skills, bio, portfolio fields</li>
                  <li>Switch to Client: See company field instead of hourly rate</li>
                  <li>Switch to Admin: See admin-specific notification preferences</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">2. Real-time Validation</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Edit any field and click outside (blur) to trigger validation</li>
                  <li>See green checkmark for valid fields, red alert for invalid</li>
                  <li>View validation suggestions for invalid fields</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">3. Profile Completeness</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Check the completeness percentage at the top</li>
                  <li>See which fields are missing or invalid</li>
                  <li>Complete fields to increase the percentage</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">4. Tab Navigation</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Basic Info: Edit personal and professional details</li>
                  <li>Avatar: Upload and manage profile picture</li>
                  <li>Preferences: Set timezone and language</li>
                  <li>Notifications: Configure notification preferences</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">5. Form Submission</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Make changes to see "unsaved changes" warning</li>
                  <li>Click "Save Changes" to submit (watch console for data)</li>
                  <li>See success toast notification</li>
                  <li>Button is disabled when no changes are made</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Console Output Info */}
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-blue-900 dark:text-blue-100">
              Developer Console
            </CardTitle>
            <CardDescription className="text-blue-700 dark:text-blue-300">
              Open browser DevTools to see detailed logs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              All profile updates and avatar uploads are logged to the console with full data.
              Press F12 to open DevTools and monitor the Console tab.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
