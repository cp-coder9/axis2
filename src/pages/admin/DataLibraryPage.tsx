import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Database, 
  Search, 
  Filter,
  Download,
  Upload,
  FolderOpen,
  File,
  Image,
  FileText
} from 'lucide-react';

export default function DataLibraryPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const dataCategories = [
    { name: 'Documents', count: 245, icon: FileText, color: 'blue' },
    { name: 'Images', count: 189, icon: Image, color: 'purple' },
    { name: 'Files', count: 432, icon: File, color: 'green' },
    { name: 'Archives', count: 56, icon: FolderOpen, color: 'orange' },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Data Library</h1>
          <p className="text-muted-foreground">
            Centralized repository for all project data and files
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button>
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </Button>
        </div>
      </div>

      {/* Category Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {dataCategories.map((category) => (
          <Card key={category.name}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{category.name}</p>
                  <p className="text-2xl font-bold">{category.count}</p>
                </div>
                <category.icon className={`h-8 w-8 text-${category.color}-500`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Browse Data</CardTitle>
              <CardDescription>Search and filter your data library</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files and folders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Tabs defaultValue="all" className="w-full">
            <TabsList>
              <TabsTrigger value="all">All Files</TabsTrigger>
              <TabsTrigger value="recent">Recent</TabsTrigger>
              <TabsTrigger value="shared">Shared</TabsTrigger>
              <TabsTrigger value="starred">Starred</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4 mt-4">
              {[
                { name: 'Project_Proposal.pdf', type: 'PDF', size: '2.4 MB', modified: '2 hours ago' },
                { name: 'Design_Assets.zip', type: 'Archive', size: '45.2 MB', modified: '1 day ago' },
                { name: 'Meeting_Notes.docx', type: 'Document', size: '124 KB', modified: '3 days ago' },
                { name: 'Budget_Report.xlsx', type: 'Spreadsheet', size: '856 KB', modified: '1 week ago' },
              ].map((file, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors">
                  <div className="flex items-center gap-4">
                    <FileText className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {file.type} • {file.size} • Modified {file.modified}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                    <Button variant="ghost" size="sm">
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="recent">
              <p className="text-muted-foreground py-8 text-center">Recent files will be displayed here</p>
            </TabsContent>

            <TabsContent value="shared">
              <p className="text-muted-foreground py-8 text-center">Shared files will be displayed here</p>
            </TabsContent>

            <TabsContent value="starred">
              <p className="text-muted-foreground py-8 text-center">Starred files will be displayed here</p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
