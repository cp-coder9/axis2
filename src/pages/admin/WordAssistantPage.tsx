import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  FileText, 
  Download,
  Wand2,
  FileCheck,
  Clock
} from 'lucide-react';

export default function WordAssistantPage() {
  const templates = [
    { name: 'Project Proposal', icon: FileText, count: 5 },
    { name: 'Meeting Minutes', icon: FileCheck, count: 12 },
    { name: 'Technical Report', icon: FileText, count: 8 },
    { name: 'Status Update', icon: Clock, count: 15 },
  ];

  const recentDocuments = [
    { name: 'Q4_Project_Proposal.docx', generated: '2 hours ago', status: 'completed' },
    { name: 'Team_Meeting_Minutes.docx', generated: '1 day ago', status: 'completed' },
    { name: 'Technical_Spec_v2.docx', generated: '3 days ago', status: 'completed' },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-purple-500" />
            Word Assistant
          </h1>
          <p className="text-muted-foreground">
            AI-powered document generation and editing
          </p>
        </div>
        <Button>
          <Wand2 className="w-4 h-4 mr-2" />
          New Document
        </Button>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <FileText className="h-12 w-12 mx-auto text-blue-500" />
              <h3 className="font-semibold">Smart Templates</h3>
              <p className="text-sm text-muted-foreground">
                Pre-built templates for common documents
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <Wand2 className="h-12 w-12 mx-auto text-purple-500" />
              <h3 className="font-semibold">AI Generation</h3>
              <p className="text-sm text-muted-foreground">
                Generate content with AI assistance
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <FileCheck className="h-12 w-12 mx-auto text-green-500" />
              <h3 className="font-semibold">Quality Check</h3>
              <p className="text-sm text-muted-foreground">
                Automatic grammar and style checking
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Templates Section */}
      <Card>
        <CardHeader>
          <CardTitle>Document Templates</CardTitle>
          <CardDescription>Start with a pre-built template</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {templates.map((template) => (
              <Card key={template.name} className="hover:bg-accent transition-colors cursor-pointer">
                <CardContent className="pt-6">
                  <div className="text-center space-y-2">
                    <template.icon className="h-8 w-8 mx-auto text-blue-500" />
                    <p className="font-medium">{template.name}</p>
                    <Badge variant="secondary">{template.count} used</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Documents */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Documents</CardTitle>
              <CardDescription>Your recently generated documents</CardDescription>
            </div>
            <Button variant="outline" size="sm">View All</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentDocuments.map((doc, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <FileText className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="font-medium">{doc.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Generated {doc.generated}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
