import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  HelpCircle, 
  MessageCircle,
  Book,
  FileQuestion,
  Video,
  Send,
  ExternalLink
} from 'lucide-react';

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const helpCategories = [
    { name: 'Getting Started', icon: Book, articles: 12 },
    { name: 'Account Management', icon: HelpCircle, articles: 8 },
    { name: 'Project Setup', icon: FileQuestion, articles: 15 },
    { name: 'Troubleshooting', icon: MessageCircle, articles: 10 },
  ];

  const popularArticles = [
    { title: 'How to create a new project', views: 1245, helpful: 98 },
    { title: 'Managing user permissions', views: 892, helpful: 95 },
    { title: 'Setting up notifications', views: 756, helpful: 92 },
    { title: 'Exporting reports', views: 634, helpful: 89 },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Help Center</h1>
          <p className="text-muted-foreground">
            Find answers and get support
          </p>
        </div>
        <Button>
          <MessageCircle className="w-4 h-4 mr-2" />
          Contact Support
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <HelpCircle className="h-16 w-16 mx-auto text-blue-500" />
            <h2 className="text-2xl font-bold">How can we help you?</h2>
            <div className="max-w-2xl mx-auto">
              <Input
                placeholder="Search for help articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-lg h-12"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Help Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {helpCategories.map((category) => (
          <Card key={category.name} className="hover:bg-accent transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <category.icon className="h-12 w-12 mx-auto text-blue-500" />
                <h3 className="font-semibold">{category.name}</h3>
                <Badge variant="secondary">{category.articles} articles</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="articles" className="space-y-4">
        <TabsList>
          <TabsTrigger value="articles">Articles</TabsTrigger>
          <TabsTrigger value="videos">Videos</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
        </TabsList>

        {/* Articles Tab */}
        <TabsContent value="articles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Popular Articles</CardTitle>
              <CardDescription>Most viewed help articles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {popularArticles.map((article, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer">
                    <div className="flex items-center gap-4">
                      <FileQuestion className="h-8 w-8 text-blue-500" />
                      <div>
                        <p className="font-medium">{article.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {article.views} views • {article.helpful}% found helpful
                        </p>
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Videos Tab */}
        <TabsContent value="videos">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Video Tutorials
              </CardTitle>
              <CardDescription>Learn with step-by-step video guides</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { title: 'Getting Started Guide', duration: '5:32' },
                  { title: 'Advanced Features Overview', duration: '8:45' },
                  { title: 'Project Management Tips', duration: '6:15' },
                  { title: 'User Administration', duration: '4:20' },
                ].map((video, index) => (
                  <Card key={index} className="hover:bg-accent transition-colors cursor-pointer">
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                          <Video className="h-12 w-12 text-muted-foreground" />
                        </div>
                        <h3 className="font-medium">{video.title}</h3>
                        <Badge variant="outline">{video.duration}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FAQ Tab */}
        <TabsContent value="faq">
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
              <CardDescription>Quick answers to common questions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { q: 'How do I reset my password?', a: 'Click on "Forgot Password" on the login page...' },
                  { q: 'Can I invite team members?', a: 'Yes, go to Team Management and click "Add Member"...' },
                  { q: 'How do I export data?', a: 'Navigate to Data Library and click the Export button...' },
                  { q: 'What are the system requirements?', a: 'Modern web browser with JavaScript enabled...' },
                ].map((faq, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">{faq.q}</h3>
                    <p className="text-sm text-muted-foreground">{faq.a}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Tab */}
        <TabsContent value="contact">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Contact Support
              </CardTitle>
              <CardDescription>Get in touch with our support team</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Subject</label>
                <Input placeholder="Brief description of your issue" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Message</label>
                <textarea
                  className="w-full min-h-[150px] px-3 py-2 border rounded-md"
                  placeholder="Describe your issue in detail..."
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center space-y-2">
                      <MessageCircle className="h-8 w-8 mx-auto text-blue-500" />
                      <h3 className="font-semibold">Live Chat</h3>
                      <p className="text-sm text-muted-foreground">Available 9AM-5PM EST</p>
                      <Button variant="outline" size="sm">Start Chat</Button>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center space-y-2">
                      <Send className="h-8 w-8 mx-auto text-green-500" />
                      <h3 className="font-semibold">Email Support</h3>
                      <p className="text-sm text-muted-foreground">support@example.com</p>
                      <Button variant="outline" size="sm">Send Email</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <Button className="w-full">
                <Send className="h-4 w-4 mr-2" />
                Submit Request
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
