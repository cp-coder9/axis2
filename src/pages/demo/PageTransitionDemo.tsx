import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageTransition } from '@/components/ui/page-transition';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TransitionType } from '@/hooks/usePageTransition';

export default function PageTransitionDemo() {
  const [transitionType, setTransitionType] = useState<TransitionType>('spring');
  const [currentPage, setCurrentPage] = useState(1);

  const pages = [
    {
      id: 1,
      title: 'Page 1',
      description: 'This is the first demo page',
      color: 'bg-blue-50 dark:bg-blue-950'
    },
    {
      id: 2,
      title: 'Page 2',
      description: 'This is the second demo page',
      color: 'bg-green-50 dark:bg-green-950'
    },
    {
      id: 3,
      title: 'Page 3',
      description: 'This is the third demo page',
      color: 'bg-purple-50 dark:bg-purple-950'
    }
  ];

  const currentPageData = pages.find(p => p.id === currentPage) || pages[0];

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">Page Transition Demo</h1>
        <p className="text-muted-foreground">
          Experience smooth page transitions with different animation types
        </p>
      </div>

      {/* Transition Type Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Transition Type</CardTitle>
          <CardDescription>
            Choose different animation styles for page transitions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={transitionType === 'spring' ? 'default' : 'outline'}
              onClick={() => setTransitionType('spring')}
            >
              Spring
            </Button>
            <Button
              variant={transitionType === 'fade' ? 'default' : 'outline'}
              onClick={() => setTransitionType('fade')}
            >
              Fade
            </Button>
            <Button
              variant={transitionType === 'slide' ? 'default' : 'outline'}
              onClick={() => setTransitionType('slide')}
            >
              Slide
            </Button>
            <Button
              variant={transitionType === 'scale' ? 'default' : 'outline'}
              onClick={() => setTransitionType('scale')}
            >
              Scale
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Page Navigation */}
      <Card>
        <CardHeader>
          <CardTitle>Navigate Between Pages</CardTitle>
          <CardDescription>
            Click buttons to see the {transitionType} transition in action
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {pages.map((page) => (
              <Button
                key={page.id}
                variant={currentPage === page.id ? 'default' : 'outline'}
                onClick={() => setCurrentPage(page.id)}
              >
                Go to {page.title}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Animated Page Content */}
      <PageTransition type={transitionType} key={currentPage}>
        <Card className={`${currentPageData.color} border-2`}>
          <CardHeader>
            <CardTitle className="text-3xl">{currentPageData.title}</CardTitle>
            <CardDescription className="text-lg">
              {currentPageData.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              This content animates in using the <strong>{transitionType}</strong> transition.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-4xl font-bold text-primary">42</div>
                  <p className="text-sm text-muted-foreground mt-2">Projects</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-4xl font-bold text-primary">128</div>
                  <p className="text-sm text-muted-foreground mt-2">Tasks</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-4xl font-bold text-primary">95%</div>
                  <p className="text-sm text-muted-foreground mt-2">Complete</p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </PageTransition>

      {/* Implementation Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Implementation Guide</CardTitle>
          <CardDescription>
            How to use page transitions in your application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Basic Usage</h3>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
              <code>{`import { PageTransition } from '@/components/ui/page-transition';

function MyPage() {
  return (
    <PageTransition type="spring">
      <div>Your page content</div>
    </PageTransition>
  );
}`}</code>
            </pre>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">With React Router</h3>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
              <code>{`import { RouteTransition } from '@/components/ui/page-transition';

function App() {
  return (
    <Routes>
      <Route path="/" element={
        <RouteTransition type="spring">
          <HomePage />
        </RouteTransition>
      } />
    </Routes>
  );
}`}</code>
            </pre>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Available Transition Types</h3>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li><strong>spring</strong> - Bouncy, natural spring animation</li>
              <li><strong>fade</strong> - Simple fade in/out</li>
              <li><strong>slide</strong> - Slide from right to left</li>
              <li><strong>scale</strong> - Scale up/down effect</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Accessibility</h3>
            <p className="text-muted-foreground">
              All transitions respect the <code>prefers-reduced-motion</code> media query.
              Users who prefer reduced motion will see instant transitions without animation.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Back to Demos */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <Link to="/demo/micro-interactions">
              <Button variant="outline">← Micro-Interactions Demo</Button>
            </Link>
            <Link to="/demo/skeleton">
              <Button variant="outline">Skeleton Demo →</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
