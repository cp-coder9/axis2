import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import InteractiveChartDemo from '@/components/charts/InteractiveChartDemo';
import AccessibleChart from '@/components/charts/AccessibleChart';
import InteractiveChart from '@/components/charts/InteractiveChart';

// Sample data for demonstrations
const sampleData = {
  chartData: [
    { name: 'Jan', revenue: 4000, expenses: 2400, profit: 1600 },
    { name: 'Feb', revenue: 3000, expenses: 1398, profit: 1602 },
    { name: 'Mar', revenue: 2000, expenses: 9800, profit: -7800 },
    { name: 'Apr', revenue: 2780, expenses: 3908, profit: -1128 },
    { name: 'May', revenue: 1890, expenses: 4800, profit: -2910 },
    { name: 'Jun', revenue: 2390, expenses: 3800, profit: -1410 },
    { name: 'Jul', revenue: 3490, expenses: 4300, profit: -810 },
    { name: 'Aug', revenue: 4200, expenses: 3200, profit: 1000 },
    { name: 'Sep', revenue: 5100, expenses: 2900, profit: 2200 },
    { name: 'Oct', revenue: 6200, expenses: 3100, profit: 3100 },
    { name: 'Nov', revenue: 7100, expenses: 3400, profit: 3700 },
    { name: 'Dec', revenue: 8300, expenses: 3800, profit: 4500 },
  ],
  config: {
    revenue: {
      label: 'Revenue',
      color: 'hsl(var(--chart-1))',
    },
    expenses: {
      label: 'Expenses',
      color: 'hsl(var(--chart-2))',
    },
    profit: {
      label: 'Profit',
      color: 'hsl(var(--chart-3))',
    },
  },
};

const projectData = {
  chartData: [
    { name: 'Week 1', completed: 12, inProgress: 8, pending: 15 },
    { name: 'Week 2', completed: 18, inProgress: 12, pending: 10 },
    { name: 'Week 3', completed: 25, inProgress: 10, pending: 8 },
    { name: 'Week 4', completed: 32, inProgress: 7, pending: 5 },
    { name: 'Week 5', completed: 38, inProgress: 5, pending: 3 },
    { name: 'Week 6', completed: 42, inProgress: 3, pending: 2 },
  ],
  config: {
    completed: {
      label: 'Completed',
      color: 'hsl(142, 76%, 36%)',
    },
    inProgress: {
      label: 'In Progress',
      color: 'hsl(48, 96%, 53%)',
    },
    pending: {
      label: 'Pending',
      color: 'hsl(0, 84%, 60%)',
    },
  },
};

const ChartInteractiveFeaturesDemo: React.FC = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Interactive Chart Features Demo</h1>
        <p className="text-muted-foreground">
          Comprehensive demonstration of advanced chart interactions including zoom, pan, 
          selection tools, and enhanced tooltips.
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="interactive">Interactive Demo</TabsTrigger>
          <TabsTrigger value="accessible">Accessible Chart</TabsTrigger>
          <TabsTrigger value="standard">Standard Interactive</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Feature Overview</CardTitle>
              <CardDescription>
                All interactive chart features implemented for task 3.5
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      Zoom Functionality
                      <Badge variant="secondary">Implemented</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />
                      <div>
                        <strong>Domain Selection:</strong> Click and drag to select a specific range
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />
                      <div>
                        <strong>Mouse Wheel:</strong> Scroll to zoom in and out
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />
                      <div>
                        <strong>Zoom Controls:</strong> Buttons and slider for precise control
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />
                      <div>
                        <strong>Zoom to Selection:</strong> Automatically zoom to selected data
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      Pan Capability
                      <Badge variant="secondary">Implemented</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />
                      <div>
                        <strong>Mouse Drag:</strong> Click and drag to pan across the chart
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />
                      <div>
                        <strong>Touch Support:</strong> Pinch and drag on touch devices
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />
                      <div>
                        <strong>Pan Mode Toggle:</strong> Enable/disable pan mode
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />
                      <div>
                        <strong>Reset Function:</strong> Return to original view
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      Selection Tools
                      <Badge variant="secondary">Implemented</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />
                      <div>
                        <strong>Point Selection:</strong> Click individual data points
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />
                      <div>
                        <strong>Box Selection:</strong> Drag to select rectangular area
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />
                      <div>
                        <strong>Lasso Mode:</strong> Select and zoom to area
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />
                      <div>
                        <strong>Export Selection:</strong> Export selected data to CSV
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      Enhanced Tooltips
                      <Badge variant="secondary">Implemented</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />
                      <div>
                        <strong>Trend Information:</strong> Show trend direction and percentage
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />
                      <div>
                        <strong>Statistics:</strong> Display min, max, avg, and median
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />
                      <div>
                        <strong>Additional Info:</strong> Context-specific data details
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />
                      <div>
                        <strong>Rich Formatting:</strong> Color-coded with visual indicators
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-lg">Implementation Notes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>
                    <strong>Note from tasks.md:</strong> Zoom/pan already implemented in ChartZoomPanSystem
                  </p>
                  <p>
                    This implementation extends the existing zoom/pan functionality with:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Advanced selection tools (point, box, lasso modes)</li>
                    <li>Enhanced tooltips with trend analysis and statistics</li>
                    <li>Domain selection with visual feedback</li>
                    <li>Selection export capabilities</li>
                    <li>Comprehensive demo showcasing all features</li>
                  </ul>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interactive" className="space-y-6">
          <InteractiveChartDemo
            data={sampleData}
            title="Financial Performance Analysis"
            description="Explore all interactive features: zoom, pan, selection, and enhanced tooltips"
            height={450}
          />

          <InteractiveChartDemo
            data={projectData}
            title="Project Task Progress"
            description="Track task completion over time with interactive analysis tools"
            height={400}
          />
        </TabsContent>

        <TabsContent value="accessible" className="space-y-6">
          <AccessibleChart
            data={sampleData}
            title="Accessible Financial Chart"
            description="Keyboard navigation and screen reader support"
            type="line"
            height={400}
            enableKeyboardNavigation={true}
            enableScreenReader={true}
            enableDataAnnouncement={true}
            autoPlay={true}
            autoPlayInterval={2000}
          />

          <Card>
            <CardHeader>
              <CardTitle>Accessibility Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><strong>Keyboard Navigation:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Arrow Left/Right: Navigate between data points</li>
                <li>Arrow Up/Down: Navigate between data series</li>
                <li>Enter/Space: Announce current value</li>
                <li>Home: Reset to beginning</li>
                <li>P: Toggle auto-play</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="standard" className="space-y-6">
          <InteractiveChart
            data={sampleData}
            title="Standard Interactive Chart"
            type="line"
            height={400}
            enableZoom={true}
            enableFilter={true}
            enableExport={true}
            showTrend={true}
          />

          <InteractiveChart
            data={projectData}
            title="Project Tasks Bar Chart"
            type="bar"
            height={400}
            enableZoom={true}
            enableFilter={true}
            enableExport={true}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ChartInteractiveFeaturesDemo;
