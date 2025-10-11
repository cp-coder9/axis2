import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThemeValidation } from '@/components/theme-validation';
import { ThemeToggle } from '@/components/theme-toggle';
import { ThemeSwitchingTester, ThemeTestResult } from '@/utils/theme-switching-tester';
import { AlertCircle, CheckCircle, Play, RotateCcw } from 'lucide-react';

/**
 * Comprehensive Theme System Integration Component
 * Combines ThemeValidation, ThemeSwitchingTester, and ThemeToggle
 * for complete theme system management and testing
 */
export function ThemeSystemIntegration() {
  const [testResults, setTestResults] = useState<ThemeTestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [tester] = useState(() => new ThemeSwitchingTester());

  const runThemeTests = async () => {
    setIsRunningTests(true);
    try {
      const results = await tester.runAllTests();
      setTestResults(results);
    } catch (error) {
      console.error('Theme testing failed:', error);
    } finally {
      setIsRunningTests(false);
    }
  };

  const resetTests = () => {
    setTestResults([]);
  };

  const testSummary = tester.getTestSummary();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Theme System Management</h2>
          <p className="text-muted-foreground">
            Comprehensive theme validation, testing, and management tools
          </p>
        </div>
        <ThemeToggle />
      </div>

      <Tabs defaultValue="validation" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="validation">Theme Validation</TabsTrigger>
          <TabsTrigger value="testing">Automated Testing</TabsTrigger>
          <TabsTrigger value="results">Test Results</TabsTrigger>
        </TabsList>

        <TabsContent value="validation" className="space-y-4">
          <ThemeValidation />
        </TabsContent>

        <TabsContent value="testing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Automated Theme Testing</CardTitle>
              <CardDescription>
                Run comprehensive tests to validate theme system integration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button 
                  onClick={runThemeTests} 
                  disabled={isRunningTests}
                  className="flex items-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  {isRunningTests ? 'Running Tests...' : 'Run Theme Tests'}
                </Button>
                <Button 
                  onClick={resetTests} 
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
              </div>

              {testResults.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground">Total Tests</p>
                    <p className="text-2xl font-bold">{testSummary.total}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground">Passed</p>
                    <p className="text-2xl font-bold text-green-600">{testSummary.passed}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground">Pass Rate</p>
                    <p className="text-2xl font-bold">{testSummary.passRate.toFixed(1)}%</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
              <CardDescription>
                Detailed results from theme system testing
              </CardDescription>
            </CardHeader>
            <CardContent>
              {testResults.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No test results available. Run tests to see results.
                </div>
              ) : (
                <div className="space-y-3">
                  {testResults.map((result, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                      {result.passed ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium">{result.testName}</p>
                          <Badge variant={result.passed ? 'default' : 'destructive'}>
                            {result.passed ? 'Pass' : 'Fail'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{result.details}</p>
                        {result.error && (
                          <p className="text-xs text-red-600 font-mono mt-1">{result.error}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ThemeSystemIntegration;