import { ClientDashboardLayout } from '@/components/client/ClientDashboardLayout'
import { ClientMessagingInterface } from '@/components/client/ClientMessagingInterface'

export default function ClientMessagesPage() {
  const breadcrumbs = [
    { title: "Client Portal", href: "/client" },
    { title: "Messages", isActive: true }
  ]

  const handleSendMessage = async (conversationId: string, content: string, attachments?: File[]) => {
    // In a real app, this would send the message to the server
    console.log('Sending message:', { conversationId, content, attachments })
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  const handleMarkAsRead = (messageId: string) => {
    // In a real app, this would mark the message as read on the server
    console.log('Marking message as read:', messageId)
  }

  const handleStartCall = (contactId: string, type: 'voice' | 'video') => {
    // In a real app, this would initiate a call
    console.log('Starting call:', { contactId, type })
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
            <h1 className="text-3xl font-bold">Messages</h1>
            <p className="text-muted-foreground">
              Communicate with your project teams and architects
            </p>
          </div>
        </div>

        <ClientMessagingInterface 
          onSendMessage={handleSendMessage}
          onMarkAsRead={handleMarkAsRead}
          onStartCall={handleStartCall}
        />
      </div>
    </ClientDashboardLayout>
  )
}