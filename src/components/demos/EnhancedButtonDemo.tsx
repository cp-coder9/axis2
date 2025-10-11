import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Demo icons
const PlayIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M19 10a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const DownloadIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const SaveIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
  </svg>
);

const DeleteIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

export const EnhancedButtonDemo: React.FC = () => {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [successStates, setSuccessStates] = useState<Record<string, boolean>>({});
  const [errorStates, setErrorStates] = useState<Record<string, boolean>>({});

  const simulateAsync = (key: string, shouldFail = false) => {
    setLoadingStates(prev => ({ ...prev, [key]: true }));
    
    setTimeout(() => {
      setLoadingStates(prev => ({ ...prev, [key]: false }));
      
      if (shouldFail) {
        setErrorStates(prev => ({ ...prev, [key]: true }));
        setTimeout(() => {
          setErrorStates(prev => ({ ...prev, [key]: false }));
        }, 2000);
      } else {
        setSuccessStates(prev => ({ ...prev, [key]: true }));
        setTimeout(() => {
          setSuccessStates(prev => ({ ...prev, [key]: false }));
        }, 2000);
      }
    }, 2000);
  };

  return (
    <div className="p-6 space-y-8 max-w-6xl mx-auto">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Enhanced Button Component Demo</h1>
        <p className="text-muted-foreground">
          Showcasing modern button features with loading states, animations, and accessibility
        </p>
        <Badge variant="secondary" className="animate-pulse-subtle">
          Task 2.2 & 2.3 Implementation
        </Badge>
      </div>

      {/* Size Variants */}
      <Card>
        <CardHeader>
          <CardTitle>Size Variants</CardTitle>
          <CardDescription>
            Enhanced size system with design token integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <Button size="xs">Extra Small</Button>
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button size="xl">Extra Large</Button>
          </div>
        </CardContent>
      </Card>

      {/* Variant Styles */}
      <Card>
        <CardHeader>
          <CardTitle>Enhanced Variants</CardTitle>
          <CardDescription>
            Modern variants with gradient support and improved hover effects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="default">Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="gradient">Gradient</Button>
            <Button variant="success">Success</Button>
            <Button variant="warning">Warning</Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading States */}
      <Card>
        <CardHeader>
          <CardTitle>Loading States & Async Feedback</CardTitle>
          <CardDescription>
            Enhanced loading indicators with timeout handling and state animations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              loading={loadingStates.save}
              success={successStates.save}
              error={errorStates.save}
              loadingText="Saving..."
              onClick={() => simulateAsync('save')}
              icon={<SaveIcon />}
            >
              Save Document
            </Button>
            
            <Button
              loading={loadingStates.download}
              success={successStates.download}
              error={errorStates.download}
              loadingText="Downloading..."
              onClick={() => simulateAsync('download')}
              icon={<DownloadIcon />}
              variant="outline"
            >
              Download File
            </Button>
            
            <Button
              loading={loadingStates.delete}
              success={successStates.delete}
              error={errorStates.delete}
              loadingText="Deleting..."
              onClick={() => simulateAsync('delete', true)}
              icon={<DeleteIcon />}
              variant="destructive"
            >
              Delete Item
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Icon Positions */}
      <Card>
        <CardHeader>
          <CardTitle>Icon Support</CardTitle>
          <CardDescription>
            Flexible icon positioning with proper spacing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button icon={<PlayIcon />} iconPosition="left">
              Play Video
            </Button>
            <Button icon={<DownloadIcon />} iconPosition="right" variant="outline">
              Download
            </Button>
            <Button icon={<SaveIcon />} iconPosition="left" variant="secondary">
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Features */}
      <Card>
        <CardHeader>
          <CardTitle>Advanced Features</CardTitle>
          <CardDescription>
            Timeout handling, haptic feedback simulation, and accessibility enhancements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Button
                loading={loadingStates.timeout}
                success={successStates.timeout}
                error={errorStates.timeout}
                timeout={3000}
                onTimeout={() => {
                  setLoadingStates(prev => ({ ...prev, timeout: false }));
                  setErrorStates(prev => ({ ...prev, timeout: true }));
                  setTimeout(() => {
                    setErrorStates(prev => ({ ...prev, timeout: false }));
                  }, 2000);
                }}
                onClick={() => simulateAsync('timeout')}
                variant="gradient"
              >
                Timeout Test (3s)
              </Button>
              
              <Button fullWidth className="md:w-auto">
                Full Width Button
              </Button>
            </div>
            
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• Haptic feedback simulation on supported devices</p>
              <p>• Enhanced focus indicators with spring animations</p>
              <p>• Ripple effects on button press</p>
              <p>• Automatic success/error state management</p>
              <p>• ARIA live regions for screen reader announcements</p>
              <p>• Reduced motion support for accessibility</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accessibility Features */}
      <Card>
        <CardHeader>
          <CardTitle>Accessibility & Performance</CardTitle>
          <CardDescription>
            WCAG 2.1 AA compliance and performance optimizations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Accessibility Features:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Proper ARIA attributes (aria-busy, aria-live)</li>
                  <li>• Enhanced focus indicators</li>
                  <li>• Keyboard navigation support</li>
                  <li>• Screen reader announcements</li>
                  <li>• Reduced motion preferences</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Performance Features:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Hardware-accelerated animations</li>
                  <li>• CSS containment for complex interactions</li>
                  <li>• Optimized re-renders with React.memo</li>
                  <li>• Efficient state management</li>
                  <li>• Minimal bundle impact</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedButtonDemo;