import { ClientDashboardLayout } from '@/components/client/ClientDashboardLayout'
import { ClientFileAccessSystem } from '@/components/client/ClientFileAccessSystem'

export default function ClientFilesPage() {
  const breadcrumbs = [
    { title: "Client Portal", href: "/client" },
    { title: "Files", isActive: true }
  ]

  const handleDownloadFile = async (fileId: string) => {
    // In a real app, this would generate a secure download URL
    console.log('Downloading file:', fileId)
    
    // Simulate API call to get secure download URL
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // In a real app, this would trigger the actual download
    // window.open(secureDownloadUrl, '_blank')
  }

  const handlePreviewFile = async (fileId: string): Promise<string> => {
    // In a real app, this would generate a secure preview URL using Cloudinary transformations
    console.log('Previewing file:', fileId)
    
    // Simulate API call to get secure preview URL
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Return a mock preview URL (in real app, this would be a Cloudinary URL with transformations)
    return `https://via.placeholder.com/800x600/0ea5e9/ffffff?text=File+Preview+${fileId}`
  }

  const handleStarFile = async (fileId: string, starred: boolean) => {
    // In a real app, this would update the file's starred status
    console.log('Starring file:', { fileId, starred })
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300))
  }

  const handleShareFile = (fileId: string) => {
    // In a real app, this would open a share dialog or copy a secure share link
    console.log('Sharing file:', fileId)
    
    // For now, just copy a mock share URL to clipboard
    const shareUrl = `${window.location.origin}/shared/files/${fileId}`
    navigator.clipboard.writeText(shareUrl).then(() => {
      // In a real app, you'd show a toast notification
      console.log('Share URL copied to clipboard:', shareUrl)
    })
  }

  return (
    <ClientDashboardLayout 
      breadcrumbs={breadcrumbs}
      userName="John Smith"
      userEmail="john.smith@example.com"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Project Files</h1>
            <p className="text-muted-foreground">
              Access and download files shared by your project teams
            </p>
          </div>
        </div>

        <ClientFileAccessSystem 
          onDownloadFile={handleDownloadFile}
          onPreviewFile={handlePreviewFile}
          onStarFile={handleStarFile}
          onShareFile={handleShareFile}
        />
      </div>
    </ClientDashboardLayout>
  )
}