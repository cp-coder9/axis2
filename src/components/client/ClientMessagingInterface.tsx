import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  MessageCircle, 
  Send, 
  Search, 
  Filter,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Paperclip,
  Phone,
  Video,
  MoreHorizontal
} from 'lucide-react'

interface Message {
  id: string
  content: string
  senderId: string
  senderName: string
  senderRole: 'admin' | 'architect' | 'client' | 'system'
  timestamp: string
  projectId?: string
  projectName?: string
  isRead: boolean
  attachments?: Attachment[]
}

interface Attachment {
  id: string
  name: string
  type: string
  size: string
  url: string
}

interface Contact {
  id: string
  name: string
  role: string
  email: string
  avatar?: string
  isOnline: boolean
  lastSeen?: string
  projectIds: string[]
}

interface Conversation {
  id: string
  type: 'project' | 'direct'
  name: string
  participants: Contact[]
  lastMessage?: Message
  unreadCount: number
  projectId?: string
  projectName?: string
}

interface ClientMessagingInterfaceProps {
  conversations?: Conversation[]
  contacts?: Contact[]
  onSendMessage?: (conversationId: string, content: string, attachments?: File[]) => Promise<void>
  onMarkAsRead?: (messageId: string) => void
  onStartCall?: (contactId: string, type: 'voice' | 'video') => void
}

const defaultConversations: Conversation[] = [
  {
    id: '1',
    type: 'project',
    name: 'Office Redesign Team',
    participants: [
      {
        id: '1',
        name: 'Sarah Johnson',
        role: 'Lead Architect',
        email: 'sarah@architex.com',
        isOnline: true,
        projectIds: ['1']
      },
      {
        id: '2',
        name: 'Admin Team',
        role: 'Project Admin',
        email: 'admin@architex.com',
        isOnline: true,
        projectIds: ['1']
      }
    ],
    lastMessage: {
      id: '1',
      content: 'Updated floor plans are ready for your review. I\'ve incorporated all the feedback from our last meeting.',
      senderId: '1',
      senderName: 'Sarah Johnson',
      senderRole: 'architect',
      timestamp: '2024-01-15T14:30:00Z',
      projectId: '1',
      projectName: 'Office Redesign',
      isRead: false
    },
    unreadCount: 2,
    projectId: '1',
    projectName: 'Office Redesign'
  },
  {
    id: '2',
    type: 'project',
    name: 'Residential Complex Team',
    participants: [
      {
        id: '3',
        name: 'Michael Chen',
        role: 'Lead Architect',
        email: 'michael@architex.com',
        isOnline: false,
        lastSeen: '2024-01-15T12:00:00Z',
        projectIds: ['2']
      }
    ],
    lastMessage: {
      id: '2',
      content: 'The 3D renderings for the residential complex are complete. Would you like to schedule a presentation?',
      senderId: '3',
      senderName: 'Michael Chen',
      senderRole: 'architect',
      timestamp: '2024-01-14T16:45:00Z',
      projectId: '2',
      projectName: 'Residential Complex',
      isRead: true
    },
    unreadCount: 0,
    projectId: '2',
    projectName: 'Residential Complex'
  }
]

const defaultMessages: Message[] = [
  {
    id: '1',
    content: 'Hello! Welcome to the Office Redesign project. I\'m Sarah, your lead architect for this project.',
    senderId: '1',
    senderName: 'Sarah Johnson',
    senderRole: 'architect',
    timestamp: '2024-01-10T09:00:00Z',
    projectId: '1',
    projectName: 'Office Redesign',
    isRead: true
  },
  {
    id: '2',
    content: 'Thank you Sarah! I\'m excited to work with you on this project. When can we schedule our first design review?',
    senderId: 'client',
    senderName: 'John Smith',
    senderRole: 'client',
    timestamp: '2024-01-10T09:15:00Z',
    projectId: '1',
    projectName: 'Office Redesign',
    isRead: true
  },
  {
    id: '3',
    content: 'I have some initial concepts ready. How about we meet this Friday at 2 PM?',
    senderId: '1',
    senderName: 'Sarah Johnson',
    senderRole: 'architect',
    timestamp: '2024-01-10T09:30:00Z',
    projectId: '1',
    projectName: 'Office Redesign',
    isRead: true
  },
  {
    id: '4',
    content: 'Perfect! Friday at 2 PM works great for me. Should I prepare anything specific for the meeting?',
    senderId: 'client',
    senderName: 'John Smith',
    senderRole: 'client',
    timestamp: '2024-01-10T09:45:00Z',
    projectId: '1',
    projectName: 'Office Redesign',
    isRead: true
  },
  {
    id: '5',
    content: 'Updated floor plans are ready for your review. I\'ve incorporated all the feedback from our last meeting.',
    senderId: '1',
    senderName: 'Sarah Johnson',
    senderRole: 'architect',
    timestamp: '2024-01-15T14:30:00Z',
    projectId: '1',
    projectName: 'Office Redesign',
    isRead: false,
    attachments: [
      {
        id: '1',
        name: 'Floor_Plans_v3.2.pdf',
        type: 'application/pdf',
        size: '2.4 MB',
        url: '#'
      }
    ]
  }
]

export function ClientMessagingInterface({
  conversations = defaultConversations,
  contacts = [],
  onSendMessage,
  onMarkAsRead,
  onStartCall
}: ClientMessagingInterfaceProps) {
  const [selectedConversation, setSelectedConversation] = React.useState<Conversation | null>(conversations[0] || null)
  const [messages, setMessages] = React.useState<Message[]>(defaultMessages)
  const [newMessage, setNewMessage] = React.useState('')
  const [searchTerm, setSearchTerm] = React.useState('')
  const [filterType, setFilterType] = React.useState<'all' | 'project' | 'direct'>('all')

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conv.participants.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesFilter = filterType === 'all' || conv.type === filterType
    return matchesSearch && matchesFilter
  })

  const conversationMessages = messages.filter(msg => 
    selectedConversation?.projectId ? msg.projectId === selectedConversation.projectId : false
  )

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
    }
  }

  const getRoleColor = (role: Message['senderRole']) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800'
      case 'architect':
        return 'bg-blue-100 text-blue-800'
      case 'client':
        return 'bg-green-100 text-green-800'
      case 'system':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-red-500',
      'bg-yellow-500',
      'bg-indigo-500'
    ]
    const index = name.charCodeAt(0) % colors.length
    return colors[index]
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return

    try {
      await onSendMessage?.(selectedConversation.id, newMessage)
      
      // Add message to local state (in real app, this would come from server)
      const message: Message = {
        id: Date.now().toString(),
        content: newMessage,
        senderId: 'client',
        senderName: 'John Smith',
        senderRole: 'client',
        timestamp: new Date().toISOString(),
        projectId: selectedConversation.projectId,
        projectName: selectedConversation.projectName,
        isRead: true
      }
      
      setMessages(prev => [...prev, message])
      setNewMessage('')
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="flex h-[600px] border rounded-lg overflow-hidden">
      {/* Conversations Sidebar */}
      <div className="w-1/3 border-r flex flex-col">
        {/* Search and Filter */}
        <div className="p-4 border-b space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Tabs value={filterType} onValueChange={(value) => setFilterType(value as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="project">Projects</TabsTrigger>
              <TabsTrigger value="direct">Direct</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                role="button"
                tabIndex={0}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedConversation?.id === conversation.id
                    ? 'bg-primary/10 border border-primary/20'
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => setSelectedConversation(conversation)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedConversation(conversation);
                  }
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-sm truncate">{conversation.name}</h4>
                    {conversation.type === 'project' && (
                      <Badge variant="outline" className="text-xs">
                        Project
                      </Badge>
                    )}
                  </div>
                  {conversation.unreadCount > 0 && (
                    <Badge className="bg-red-500 text-white text-xs min-w-[20px] h-5 flex items-center justify-center">
                      {conversation.unreadCount}
                    </Badge>
                  )}
                </div>
                
                {conversation.lastMessage && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground truncate">
                      {conversation.lastMessage.senderName}: {conversation.lastMessage.content}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatTimestamp(conversation.lastMessage.timestamp)}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <h3 className="font-semibold">{selectedConversation.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{selectedConversation.participants.length} participants</span>
                      {selectedConversation.projectName && (
                        <>
                          <Separator orientation="vertical" className="h-4" />
                          <span>{selectedConversation.projectName}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {conversationMessages.map((message) => (
                  <div key={message.id} className="flex items-start gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className={getAvatarColor(message.senderName)}>
                        {message.senderName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{message.senderName}</span>
                        <Badge className={getRoleColor(message.senderRole)}>
                          {message.senderRole}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatTimestamp(message.timestamp)}
                        </span>
                        {!message.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                      
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-sm">{message.content}</p>
                        
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {message.attachments.map((attachment) => (
                              <div key={attachment.id} className="flex items-center gap-2 p-2 bg-background rounded border">
                                <Paperclip className="h-4 w-4 text-muted-foreground" />
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{attachment.name}</p>
                                  <p className="text-xs text-muted-foreground">{attachment.size}</p>
                                </div>
                                <Button variant="outline" size="sm">
                                  Download
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Textarea
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="min-h-[60px] resize-none"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Button variant="outline" size="sm">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    size="sm"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
              <p className="text-muted-foreground">
                Choose a conversation from the sidebar to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}