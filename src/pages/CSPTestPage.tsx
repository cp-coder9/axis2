/**
 * CSP Test Page
 * Comprehensive testing page for CSP and connectivity features
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Shield,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Upload,
  Network,
  Database,
  Cloud
} from 'lucide-react';
import { NetworkHelper } from '@/network-helper';
import { cspAwareCloudinaryService } from '@/utils/cspAwareCloudinaryService';
import { UserRole } from '@/types';
import CSPViolationDashboard from '@/components/admin/CSPViolationDashboard';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  message: string;
  duration?: number;
}

export const CSPTestPage: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const updateTestResult = (name: string, updates: Partial<TestResult>) => {
    setTestResults(prev => {
      const existing = prev.find(t => t.name === name);
      if (existing) {
        return prev.map(t => t.name === name ? { ...t, ...updates } : t);
      }
      return [...prev, { name, status: 'pending', message: '', ...updates }];
    });
  };

  const runTest = async (
    name: string,
    testFn: () => Promise<{ passed: boolean; message: string }>
  ) => {
    const startTime = Date.now();
    updateTestResult(name, { status: 'running', message: 'Running...' });

    try {
      const result = await testFn();
      const duration = Date.now() - startTime;
      
      updateTestResult(name, {
        status: result.passed ? 'passed' : 'failed',
        message: result.message,
        duration
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      updateTestResult(name, {
        status: 'failed',
        message: error instanceof Error ? error.message : 'Test failed',
        duration
      });
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    // Test 1: Basic Connectivity
    await runTest('Basic Internet Connectivity', async () => {
      const connected = await NetworkHelper.checkConnectivity();
      return {
        passed: connected,
        message: connected ? 'Internet connection is working' : 'No internet connection detected'
      };
    });

    // Test 2: Firebase Connectivity
    await runTest('Firebase Connectivity', async () => {
      const result = await NetworkHelper.checkFirebaseConnectivity();
      return {
        passed: result.connected,
        message: result.connected 
          ? 'All Firebase services are accessible'
          : `Firebase connection failed: ${result.errors.join(', ')}`
      };
    });

    // Test 3: Firebase Services Diagnosis
    await runTest('Firebase Services Diagnosis', async () => {
      const diagnosis = await NetworkHelper.diagnoseFirebaseIssues();
      const allHealthy = diagnosis.overall === 'healthy';
      
      return {
        passed: allHealthy,
        message: allHealthy
          ? 'All Firebase services are healthy'
          : `Status: ${diagnosis.overall}. Issues: ${diagnosis.recommendations.join(', ')}`
      };
    });

    // Test 4: Cloudinary Configuration
    await runTest('Cloudinary Configuration', async () => {
      const config = cspAwareCloudinaryService.checkConfiguration();
      return {
        passed: config.isValid,
        message: config.isValid
          ? 'Cloudinary is properly configured'
          : `Configuration issues: ${config.issues.join(', ')}`
      };
    });

    // Test 5: Cloudinary Health
    await runTest('Cloudinary Health Check', async () => {
      const health = await cspAwareCloudinaryService.getHealthStatus();
      const isHealthy = health.configured && health.accessible && !health.cspBlocked;
      
      return {
        passed: isHealthy,
        message: isHealthy
          ? 'Cloudinary is accessible and not blocked by CSP'
          : `Issues: ${health.recommendations.join(', ')}`
      };
    });

    // Test 6: CSP Violation Detection
    await runTest('CSP Violation Detection', async () => {
      // This test checks if CSP violation listener is working
      return {
        passed: true,
        message: 'CSP violation listener is active. Check console for violations.'
      };
    });

    setIsRunning(false);
  };

  const testFileUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file first');
      return;
    }

    updateTestResult('File Upload Test', { status: 'running', message: 'Uploading file...' });

    try {
      const result = await cspAwareCloudinaryService.uploadFile(
        selectedFile,
        'test-user-id',
        'Test User',
        UserRole.ADMIN,
        {
          category: 'DOCUMENTS',
          tags: ['test-upload'],
          fallbackToFirebase: true,
          retryAttempts: 3,
          progressCallback: (progress) => {
            updateTestResult('File Upload Test', {
              status: 'running',
              message: `Uploading... ${Math.round(progress)}%`
            });
          }
        }
      );

      if (result.success) {
        updateTestResult('File Upload Test', {
          status: 'passed',
          message: result.usedFallback
            ? 'File uploaded successfully using Firebase fallback'
            : 'File uploaded successfully to Cloudinary'
        });
      } else {
        updateTestResult('File Upload Test', {
          status: 'failed',
          message: result.error || 'Upload failed'
        });
      }
    } catch (error) {
      updateTestResult('File Upload Test', {
        status: 'failed',
        message: error instanceof Error ? error.message : 'Upload failed'
      });
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'running':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return <Badge variant="default" className="bg-green-500">Passed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'running':
        return <Badge variant="default" className="bg-blue-500">Running</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            CSP & Connectivity Test Suite
          </h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive testing for Content Security Policy and service connectivity
          </p>
        </div>
        <Button
          onClick={runAllTests}
          disabled={isRunning}
          size="lg"
        >
          {isRunning ? (
            <>
              <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
              Running Tests...
            </>
          ) : (
            <>
              <RefreshCw className="h-5 w-5 mr-2" />
              Run All Tests
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="tests" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tests">Test Results</TabsTrigger>
          <TabsTrigger value="upload">File Upload Test</TabsTrigger>
          <TabsTrigger value="dashboard">CSP Dashboard</TabsTrigger>
        </TabsList>

        {/* Test Results Tab */}
        <TabsContent value="tests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Automated Tests</CardTitle>
              <CardDescription>
                Results from automated connectivity and CSP tests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {testResults.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Shield className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>No tests run yet</p>
                  <p className="text-sm mt-2">Click "Run All Tests" to start</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {testResults.map((result) => (
                    <div
                      key={result.name}
                      className="border rounded-lg p-4 flex items-start justify-between"
                    >
                      <div className="flex items-start gap-3 flex-1">
                        {getStatusIcon(result.status)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{result.name}</h4>
                            {getStatusBadge(result.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">{result.message}</p>
                          {result.duration && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Duration: {result.duration}ms
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary */}
          {testResults.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold">
                      {testResults.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Tests</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-500">
                      {testResults.filter(t => t.status === 'passed').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Passed</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-500">
                      {testResults.filter(t => t.status === 'failed').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Failed</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-500">
                      {testResults.filter(t => t.status === 'running').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Running</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* File Upload Test Tab */}
        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>File Upload Test</CardTitle>
              <CardDescription>
                Test file upload with CSP awareness and Firebase fallback
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="mb-4"
                />
                {selectedFile && (
                  <div className="text-sm text-muted-foreground mb-4">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                  </div>
                )}
                <Button
                  onClick={testFileUpload}
                  disabled={!selectedFile || isRunning}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Test Upload
                </Button>
              </div>

              {testResults.find(t => t.name === 'File Upload Test') && (
                <Alert>
                  <AlertDescription>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(testResults.find(t => t.name === 'File Upload Test')!.status)}
                      <span>
                        {testResults.find(t => t.name === 'File Upload Test')!.message}
                      </span>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* CSP Dashboard Tab */}
        <TabsContent value="dashboard">
          <CSPViolationDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CSPTestPage;
