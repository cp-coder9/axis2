import { ClientDashboardLayout } from '@/components/client/ClientDashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  HelpCircle,
  MessageSquare,
  Book,
  Video,
  Mail,
  Phone,
  FileText,
  ExternalLink,
  Search
} from 'lucide-react'
import { useState } from 'react'

interface FAQItem {
  id: string
  question: string
  answer: string
  category: 'account' | 'projects' | 'billing' | 'technical'
}

const faqItems: FAQItem[] = [
  {
    id: '1',
    question: 'How do I view my project progress?',
    answer: 'You can view your project progress from the My Projects section. Each project card shows the current status, progress percentage, and important milestones.',
    category: 'projects'
  },
  {
    id: '2',
    question: 'How can I communicate with my project team?',
    answer: 'Use the Communication section to send messages to your project team. You can also initiate video calls and share files directly through the messaging interface.',
    category: 'projects'
  },
  {
    id: '3',
    question: 'Where can I download project files?',
    answer: 'All project files are available in the Files & Documents section. You can browse, preview, and download any files that have been shared with you.',
    category: 'projects'
  },
  {
    id: '4',
    question: 'How do I update my account information?',
    answer: 'Go to Settings > Profile to update your personal information, contact details, and company information.',
    category: 'account'
  },
  {
    id: '5',
    question: 'What payment methods are accepted?',
    answer: 'We accept all major credit cards, bank transfers, and wire payments. Contact your account manager for specific payment arrangements.',
    category: 'billing'
  },
  {
    id: '6',
    question: 'How do I schedule a meeting with my architect?',
    answer: 'Navigate to Schedule > Meetings and click "Request Meeting". Fill in the details and your preferred time slots, and your project team will confirm the meeting.',
    category: 'projects'
  }
]

const resources = [
  {
    id: '1',
    title: 'Getting Started Guide',
    description: 'Learn the basics of using the client portal',
    icon: Book,
    link: '#'
  },
  {
    id: '2',
    title: 'Video Tutorials',
    description: 'Watch step-by-step video guides',
    icon: Video,
    link: '#'
  },
  {
    id: '3',
    title: 'Documentation',
    description: 'Comprehensive platform documentation',
    icon: FileText,
    link: '#'
  }
]

export default function ClientSupportPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  
  const breadcrumbs = [
    { title: "Client Portal", href: "/client/dashboard" },
    { title: "Help & Support", isActive: true }
  ]

  const filteredFAQs = faqItems.filter(item => {
    const matchesSearch = item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <ClientDashboardLayout 
      breadcrumbs={breadcrumbs}
      userName="John Smith"
      userEmail="john.smith@example.com"
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Help & Support</h1>
          <p className="text-muted-foreground">
            Find answers to common questions or contact our support team
          </p>
        </div>

        {/* Quick Contact Section */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="p-3 rounded-lg bg-blue-100">
                  <MessageSquare className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold">Live Chat</h3>
                <p className="text-sm text-muted-foreground">
                  Chat with our support team
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  Start Chat
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="p-3 rounded-lg bg-green-100">
                  <Mail className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold">Email Support</h3>
                <p className="text-sm text-muted-foreground">
                  support@architex.com
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  Send Email
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="p-3 rounded-lg bg-purple-100">
                  <Phone className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold">Phone Support</h3>
                <p className="text-sm text-muted-foreground">
                  +1 (555) 123-4567
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  Call Us
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Help Resources */}
        <Card>
          <CardHeader>
            <CardTitle>Help Resources</CardTitle>
            <CardDescription>
              Explore our guides and documentation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {resources.map((resource) => {
                const Icon = resource.icon
                return (
                  <Card key={resource.id}>
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="p-3 rounded-lg bg-accent w-fit">
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-semibold">{resource.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {resource.description}
                          </p>
                        </div>
                        <Button variant="outline" size="sm" className="w-full">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Resource
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
            <CardDescription>
              Find quick answers to common questions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search FAQs..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={selectedCategory === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory('all')}
                >
                  All
                </Button>
                <Button
                  variant={selectedCategory === 'account' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory('account')}
                >
                  Account
                </Button>
                <Button
                  variant={selectedCategory === 'projects' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory('projects')}
                >
                  Projects
                </Button>
                <Button
                  variant={selectedCategory === 'billing' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory('billing')}
                >
                  Billing
                </Button>
              </div>
            </div>

            <div className="space-y-4 mt-6">
              {filteredFAQs.map((faq) => (
                <Card key={faq.id}>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <HelpCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between gap-4">
                            <h4 className="font-semibold">{faq.question}</h4>
                            <Badge variant="outline" className="text-xs">
                              {faq.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {faq.answer}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {filteredFAQs.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No FAQs found matching your search
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Contact Form */}
        <Card>
          <CardHeader>
            <CardTitle>Send us a message</CardTitle>
            <CardDescription>
              Can't find what you're looking for? Contact our support team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" defaultValue="John Smith" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue="john.smith@example.com" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" placeholder="What do you need help with?" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea 
                  id="message" 
                  placeholder="Describe your issue or question..."
                  rows={5}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline">Cancel</Button>
                <Button type="submit">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </ClientDashboardLayout>
  )
}
