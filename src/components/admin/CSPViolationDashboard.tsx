/**
 * CSP Violation Dashboard
 * Admin component for monitoring and managing Content Security Policy violations
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Download,
  Trash2,
  ExternalLink,
  Info
} from 'lucide-react';
import { NetworkHelper } from '@/network-helper';
import { cspAwareCloudinaryService } from '@/utils/cspAwareCloudinaryService';

interface CSPViolation {
  id: string;
  timestamp: Date;
  blockedURI: string;
  violatedDirective: string;
  documentURI: string;
  sourceFile?: string;
  lineNumber?: number;
  columnNumber?: number;
}

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'failed';
  details: string;
  cspBlocked: boolean;
}

export const CSPViolationDashboard: React.FC = () => {
  const [violations, setViolations] = useState<CSPViolation[]>([]);
  const [serviceStatuses, setServiceStatuses] = useState<ServiceStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Listen for CSP violations
  useEffect(() => {
    const handleCSPViolation = (event: SecurityPolicyViolationEvent) => {
      const violation: CSPViolation = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        blockedURI: event.blockedURI,
        violatedDirective: event.violatedDirective,
        documentURI: event.documentURI,
        sourceFile: event.sourceFile,
        lineNumber: event.lineNumber,
        columnNumber: event.columnNumber
      };

      setViolations(prev => [violation, ...prev].slice(0, 100)); // Keep last 100
    };

    document.addEventListener('securitypolicyviolation', handleCSPViolation as EventListener);

    return () => {
      document.removeEventListener('securitypolicyviolation', handleCSPViolation as EventListener);
    };
  }, []);

  // Check service statuses
  const checkServiceStatuses = useCallback(async () => {
    setIsLoading(true);

    try {
      // Check Firebase services
      const firebaseDiagnosis = await NetworkHelper.diagnoseFirebaseIssues();
      
      const firebaseStatuses: ServiceStatus[] = [
        {
          name: 'Firebase Auth',
          status: firebaseDiagnosis.services.auth.status === 'ok' ? 'healthy' : 
                  firebaseDiagnosis.services.auth.status === 'csp_blocked' ? 'degraded' : 'failed',
          details: firebaseDiagnosis.services.auth.details || 'No issues detected',
          cspBlocked: firebaseDiagnosis.services.auth.status === 'csp_blocked'
        },
        {
          name: 'Firebase Firestore',
          status: firebaseDiagnosis.services.firestore.status === 'ok' ? 'healthy' : 
                  firebaseDiagnosis.services.firestore.status === 'csp_blocked' ? 'degraded' : 'failed',
          details: firebaseDiagnosis.services.firestore.details || 'No issues detected',
          cspBlocked: firebaseDiagnosis.services.firestore.status === 'csp_blocked'
        },
        {
          name: 'Firebase Storage',
          status: firebaseDiagnosis.services.storage.status === 'ok' ? 'healthy' : 
                  firebaseDiagnosis.services.storage.status === 'csp_blocked' ? 'degraded' : 'failed',
          details: firebaseDiagnosis.services.storage.details || 'No issues detected',
          cspBlocked: firebaseDiagnosis.services.storage.status === 'csp_blocked'
        }
      ];

      // Check Cloudinary
      const cloudinaryHealth = await cspAwareCloudinaryService.getHealthStatus();
      const cloudinaryStatus: ServiceStatus = {
        name: 'Cloudinary',
        status: !cloudinaryHealth.configured ? 'failed' :
                cloudinaryHealth.cspBlocked ? 'degraded' :
                cloudinaryHealth.accessible ? 'healthy' : 'failed',
        details: !cloudinaryHealth.configured ? 'Not configured' :
                 cloudinaryHealth.cspBlocked ? 'Blocked by CSP' :
                 cloudinaryHealth.accessible ? 'Accessible' : 'Connection failed',
        cspBlocked: cloudinaryHealth.cspBlocked
      };

      setServiceStatuses([...firebaseStatuses, cloudinaryStatus]);
    } catch (error) {
      console.error('Failed to check service statuses:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load and auto-refresh
  useEffect(() => {
    checkServiceStatuses();

    if (autoRefresh) {
      const interval = setInterval(checkServiceStatuses, 30000); // Every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, checkServiceStatuses]);

  const clearViolations = () => {
    setViolations([]);
  };

  const exportViolations = () => {
    const data = JSON.stringify(violations, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `csp-violations-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge variant="default" className="bg-green-500">Healthy</Badge>;
      case 'degraded':
        return <Badge variant="default" className="bg-yellow-500">Degraded</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            CSP & Connectivity Monitor
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor Content Security Policy violations and service connectivity
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto-Refresh On' : 'Auto-Refresh Off'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={checkServiceStatuses}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Service Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {serviceStatuses.map((service) => (
          <Card key={service.name}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <span>{service.name}</span>
                {getStatusIcon(service.status)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {getStatusBadge(service.status)}
                <p className="text-xs text-muted-foreground">{service.details}</p>
                {service.cspBlocked && (
                  <Alert className="mt-2">
                    <AlertTriangle className="h-3 w-3" />
                    <AlertDescription className="text-xs">
                      Blocked by CSP
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CSP Violations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>CSP Violations</CardTitle>
              <CardDescription>
                Recent Content Security Policy violations ({violations.length})
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {violations.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportViolations}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearViolations}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {violations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p>No CSP violations detected</p>
              <p className="text-sm mt-2">Your application is compliant with the Content Security Policy</p>
            </div>
          ) : (
            <div className="space-y-3">
              {violations.slice(0, 10).map((violation) => (
                <div key={violation.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="destructive">{violation.violatedDirective}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {violation.timestamp.toLocaleString()}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-start gap-2">
                          <span className="font-medium min-w-[100px]">Blocked URI:</span>
                          <span className="text-muted-foreground break-all">{violation.blockedURI}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-medium min-w-[100px]">Document:</span>
                          <span className="text-muted-foreground break-all">{violation.documentURI}</span>
                        </div>
                        {violation.sourceFile && (
                          <div className="flex items-start gap-2">
                            <span className="font-medium min-w-[100px]">Source:</span>
                            <span className="text-muted-foreground break-all">
                              {violation.sourceFile}:{violation.lineNumber}:{violation.columnNumber}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP`, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {violations.length > 10 && (
                <p className="text-sm text-muted-foreground text-center pt-2">
                  Showing 10 of {violations.length} violations
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommendations */}
      {serviceStatuses.some(s => s.cspBlocked) && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium mb-2">CSP Configuration Recommendations:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Add Firebase domains to connect-src directive</li>
              <li>Add Cloudinary domains to connect-src and img-src directives</li>
              <li>Enable Firebase Storage as fallback for file uploads</li>
              <li>Review and update your Content Security Policy headers</li>
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default CSPViolationDashboard;
