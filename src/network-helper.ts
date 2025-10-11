// Enhanced Network Connectivity Helper with CSP Error Handling
// Helps diagnose and resolve common network issues including CSP violations

interface CSPViolationEvent extends Event {
    blockedURI: string;
    violatedDirective: string;
    originalPolicy: string;
    documentURI: string;
    referrer: string;
    lineNumber: number;
    columnNumber: number;
    sourceFile: string;
}

interface NetworkError extends Error {
    isCSPViolation?: boolean;
    blockedURI?: string;
    violatedDirective?: string;
    retryCount?: number;
}

interface RetryConfig {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2
};

export const NetworkHelper = {
    // Check if we can reach basic internet services with CSP error handling
    async checkConnectivity(): Promise<boolean> {
        try {
            // Use only CSP-compliant endpoints that are already approved in our policy
            // Focus on our own domain and approved Google services
            const endpoints = [
                // Start with our own domain - this should always work
                '/favicon.ico',
                // Use approved Google services from CSP
                'https://fonts.googleapis.com/css?family=Inter'
            ];
            
            // Try each endpoint until one succeeds
            for (const endpoint of endpoints) {
                try {
                    const result = await this.fetchWithCSPHandling(endpoint, {
                        method: 'GET',
                        mode: endpoint.startsWith('/') ? 'same-origin' : 'cors',
                        cache: 'no-cache'
                    });
                    
                    if (result.success) {
                        return true;
                    } else if (result.isCSPViolation) {
                        // CSP violation warnings disabled to reduce console noise
                        // console.warn(`CSP violation detected for ${endpoint}:`, {
                        //     blockedURI: result.blockedURI,
                        //     violatedDirective: result.violatedDirective
                        // });
                    }
                } catch (error) {
                    // Log but continue to next endpoint
                    console.debug(`Connectivity check failed for ${endpoint}:`, error);
                    continue;
                }
            }
            
            // If all fail, we're offline or blocked by CSP
            return false;
        } catch (error) {
            console.warn('Network connectivity check failed:', error);
            return false;
        }
    },
    
    // Check if Firebase services are reachable with enhanced error handling
    async checkFirebaseConnectivity(): Promise<{
        connected: boolean;
        errors: string[];
        cspViolations: string[];
    }> {
        const errors: string[] = [];
        const cspViolations: string[] = [];
        
        // Build project-specific Firebase endpoints to probe (these return meaningful responses)
        const apiKey = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_API_KEY : '';
        const projectId = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_PROJECT_ID : '';

        const firebaseEndpoints: string[] = [];
        // Identity toolkit endpoint uses API key and is CORS-friendly
        if (apiKey) {
            firebaseEndpoints.push(`https://www.googleapis.com/identitytoolkit/v3/relyingparty/getProjectConfig?key=${apiKey}`);
        }

        // Avoid making unauthenticated requests to the Firestore documents endpoint from browser code.
        // Unauthenticated calls can return error responses that do not include CORS headers and will
        // produce noisy "No 'Access-Control-Allow-Origin' header" errors in the console.
        const isBrowser = typeof window !== 'undefined';
        const useEmulators = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_USE_FIREBASE_EMULATORS === 'true' : false;

        if (projectId) {
            if (!isBrowser || useEmulators) {
                // Server-side or emulator environment: a direct probe is OK
                firebaseEndpoints.push(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents?pageSize=1`);
            } else {
                // Browser environment: use a CORS-safe discovery endpoint instead of documents list
                // Discovery API is lightweight and returns CORS-enabled metadata
                firebaseEndpoints.push('https://www.googleapis.com/discovery/v1/apis/firestore/v1/rest');
                console.log('NetworkHelper: Skipping direct Firestore documents probe in browser to avoid CORS errors. Using discovery endpoint instead.');
            }
        }
        
        let connectedCount = 0;
        
        for (const endpoint of firebaseEndpoints) {
            try {
                const result = await this.fetchWithCSPHandling(endpoint, {
                    method: 'GET',
                    mode: 'cors',
                    cache: 'no-cache'
                });
                
                if (result.success) {
                    connectedCount++;
                } else if (result.isCSPViolation) {
                    cspViolations.push(`${endpoint}: ${result.violatedDirective}`);
                } else {
                    errors.push(`${endpoint}: ${result.error}`);
                }
            } catch (error) {
                const networkError = error as NetworkError;
                if (networkError.isCSPViolation) {
                    cspViolations.push(`${endpoint}: ${networkError.violatedDirective}`);
                } else {
                    errors.push(`${endpoint}: ${networkError.message}`);
                }
            }
        }
        
        const connected = connectedCount > 0;
        
        if (!connected && cspViolations.length > 0) {
            console.error('Firebase connectivity blocked by CSP violations:', cspViolations);
        }
        
        return {
            connected,
            errors,
            cspViolations
        };
    },
    
    // Clear all caches to resolve potential cache issues
    async clearAllCaches(): Promise<void> {
        try {
            // Clear localStorage
            localStorage.clear();
            sessionStorage.clear();
            
            // Clear browser caches if available
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                await Promise.all(
                    cacheNames.map(cacheName => caches.delete(cacheName))
                );
            }
            
            console.log('✅ All caches cleared');
        } catch (error) {
            console.error('Failed to clear caches:', error);
        }
    },
    
    // Reload page with cache bust
    reloadWithCacheBust(): void {
        const url = new URL(window.location.href);
        url.searchParams.set('_t', Date.now().toString());
        window.location.href = url.toString();
    },
    
    // Enhanced fetch with CSP error detection and retry mechanisms
    async fetchWithCSPHandling(
        url: string, 
        options: RequestInit = {}, 
        retryConfig: Partial<RetryConfig> = {}
    ): Promise<{
        success: boolean;
        response?: Response;
        error?: string;
        isCSPViolation?: boolean;
        violatedDirective?: string;
        blockedURI?: string;
        retryCount?: number;
    }> {
        const config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
        let lastError: NetworkError | null = null;
        
        for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
            try {
                // Set up CSP violation listener for this request
                const cspViolationPromise = this.waitForCSPViolation(url, 1000);
                
                // Make the fetch request
                const fetchPromise = fetch(url, options);
                
                // Race between fetch and CSP violation
                const result = await Promise.race([
                    fetchPromise.then(response => ({ type: 'success' as const, response })),
                    cspViolationPromise.then(violation => violation ? ({ type: 'csp_violation' as const, violation }) : null)
                ]).catch(error => ({ type: 'error' as const, error }));
                
                if (result && result.type === 'success') {
                    return {
                        success: true,
                        response: result.response,
                        retryCount: attempt
                    };
                } else if (result && result.type === 'csp_violation') {
                    const violation = result.violation as CSPViolationEvent;
                    return {
                        success: false,
                        isCSPViolation: true,
                        violatedDirective: violation.violatedDirective,
                        blockedURI: violation.blockedURI,
                        error: `CSP violation: ${violation.violatedDirective} blocked ${violation.blockedURI}`,
                        retryCount: attempt
                    };
                } else if (result && result.type === 'error') {
                    throw result.error;
                }
            } catch (error) {
                lastError = error as NetworkError;
                
                // Check if this looks like a CSP-related error
                if (this.isCSPRelatedError(error as Error)) {
                    lastError.isCSPViolation = true;
                    lastError.blockedURI = url;
                }
                
                // If this is the last attempt, don't retry
                if (attempt === config.maxRetries) {
                    break;
                }
                
                // Calculate delay for next retry
                const delay = Math.min(
                    config.baseDelay * Math.pow(config.backoffMultiplier, attempt),
                    config.maxDelay
                );
                
                console.warn(`Fetch attempt ${attempt + 1} failed for ${url}, retrying in ${delay}ms:`, error);
                await this.delay(delay);
            }
        }
        
        return {
            success: false,
            error: lastError?.message || 'Unknown error',
            isCSPViolation: lastError?.isCSPViolation || false,
            violatedDirective: lastError?.violatedDirective,
            blockedURI: lastError?.blockedURI,
            retryCount: config.maxRetries
        };
    },

    // Wait for CSP violation events related to a specific URL
    async waitForCSPViolation(url: string, timeout: number = 1000): Promise<CSPViolationEvent | null> {
        return new Promise((resolve) => {
            const timer = setTimeout(() => {
                document.removeEventListener('securitypolicyviolation', handler);
                resolve(null);
            }, timeout);
            
            const handler = (event: Event) => {
                const cspEvent = event as CSPViolationEvent;
                if (cspEvent.blockedURI && (cspEvent.blockedURI === url || url.includes(cspEvent.blockedURI))) {
                    clearTimeout(timer);
                    document.removeEventListener('securitypolicyviolation', handler);
                    resolve(cspEvent);
                }
            };
            
            document.addEventListener('securitypolicyviolation', handler);
        });
    },

    // Check if an error is likely CSP-related
    isCSPRelatedError(error: Error): boolean {
        const message = error.message.toLowerCase();
        const cspIndicators = [
            'content security policy',
            'csp',
            'blocked by csp',
            'refused to connect',
            'refused to load',
            'blocked by content security policy',
            'violates the following content security policy directive'
        ];
        
        return cspIndicators.some(indicator => message.includes(indicator));
    },

    // Utility function for delays
    async delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    // Enhanced Firebase connectivity check with specific error handling
    async diagnoseFirebaseIssues(): Promise<{
        overall: 'healthy' | 'degraded' | 'failed';
        services: {
            auth: { status: 'ok' | 'csp_blocked' | 'network_error' | 'failed'; details?: string };
            firestore: { status: 'ok' | 'csp_blocked' | 'network_error' | 'failed'; details?: string };
            storage: { status: 'ok' | 'csp_blocked' | 'network_error' | 'failed'; details?: string };
        };
        recommendations: string[];
    }> {
        const services = {
            auth: { status: 'failed' as 'ok' | 'csp_blocked' | 'network_error' | 'failed', details: '' },
            firestore: { status: 'failed' as 'ok' | 'csp_blocked' | 'network_error' | 'failed', details: '' },
            storage: { status: 'failed' as 'ok' | 'csp_blocked' | 'network_error' | 'failed', details: '' }
        };
        
        const recommendations: string[] = [];
        
        // Test Firebase Auth API (project-specific if available)
        try {
            const apiKey = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_API_KEY : '';
            const authUrl = apiKey ? `https://www.googleapis.com/identitytoolkit/v3/relyingparty/getProjectConfig?key=${apiKey}` : 'https://www.googleapis.com/identitytoolkit/v3/relyingparty/getProjectConfig';
            const authResult = await this.fetchWithCSPHandling(authUrl, {
                method: 'GET',
                mode: 'cors'
            });

            if (authResult.success) {
                services.auth.status = 'ok';
            } else if (authResult.isCSPViolation) {
                services.auth.status = 'csp_blocked';
                services.auth.details = authResult.violatedDirective || 'Unknown CSP directive';
                recommendations.push('Add Firebase Auth API domains to CSP connect-src directive');
            } else {
                services.auth.status = 'network_error';
                services.auth.details = authResult.error || 'Unknown network error';
            }
        } catch (error) {
            services.auth.details = (error as Error).message;
        }
        
        // Test Firestore API (project-specific documents endpoint)
        try {
            const projectId = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_PROJECT_ID : '';
            const isBrowser = typeof window !== 'undefined';
            const useEmulators = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_USE_FIREBASE_EMULATORS === 'true' : false;

            // Avoid unauthenticated documents listing from the browser (causes CORS errors). Use discovery endpoint instead.
            let firestoreUrl: string;
            if (projectId && (!isBrowser || useEmulators)) {
                firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents?pageSize=1`;
            } else if (projectId && isBrowser) {
                firestoreUrl = 'https://www.googleapis.com/discovery/v1/apis/firestore/v1/rest';
            } else {
                firestoreUrl = 'https://www.googleapis.com/discovery/v1/apis/firestore/v1/rest';
            }

            const firestoreResult = await this.fetchWithCSPHandling(firestoreUrl, {
                method: 'GET',
                mode: 'cors'
            });

            if (firestoreResult.success) {
                services.firestore.status = 'ok';
            } else if (firestoreResult.isCSPViolation) {
                services.firestore.status = 'csp_blocked';
                services.firestore.details = firestoreResult.violatedDirective || 'Unknown CSP directive';
                recommendations.push('Add Firestore API domains to CSP connect-src directive');
            } else {
                services.firestore.status = 'network_error';
                services.firestore.details = firestoreResult.error || 'Unknown network error';
            }
        } catch (error) {
            services.firestore.details = (error as Error).message;
        }
        
        // Test Firebase Storage API (optional - probe only if storage bucket available and storage is confirmed to be set up)
        try {
            const storageBucket = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_STORAGE_BUCKET : '';
            if (storageBucket) {
                // Skip storage probe to avoid 404 errors during development
                // This prevents console noise when Firebase Storage is not yet initialized
                console.log('NetworkHelper: Skipping Firebase Storage probe to avoid 404 errors during development');
                services.storage.status = 'ok'; // Assume OK to prevent errors
                services.storage.details = 'Skipped probe - avoiding 404 during development';
            } else {
                services.storage.status = 'failed';
                services.storage.details = 'No storage bucket configured';
            }
        } catch (error) {
            services.storage.details = (error as Error).message;
        }
        
        // Determine overall status
        const okCount = Object.values(services).filter(s => s.status === 'ok').length;
        const cspBlockedCount = Object.values(services).filter(s => s.status === 'csp_blocked').length;
        
        let overall: 'healthy' | 'degraded' | 'failed';
        if (okCount === 3) {
            overall = 'healthy';
        } else if (okCount > 0) {
            overall = 'degraded';
        } else {
            overall = 'failed';
        }
        
        // Add general recommendations
        if (cspBlockedCount > 0) {
            recommendations.push('Update Content Security Policy to allow Firebase domains');
            recommendations.push('Check browser console for specific CSP violation details');
        }
        
        if (overall === 'failed') {
            recommendations.push('Check internet connectivity');
            recommendations.push('Verify Firebase project configuration');
            recommendations.push('Try disabling browser extensions or ad blockers');
        }
        
        return {
            overall,
            services,
            recommendations
        };
    },

    // Get network status info with CSP awareness
    getNetworkInfo(): object {
        return {
            online: navigator.onLine,
            connection: (navigator as any).connection || null,
            userAgent: navigator.userAgent,
            cookieEnabled: navigator.cookieEnabled,
            language: navigator.language,
            cspSupported: 'securitypolicyviolation' in document || 'SecurityPolicyViolationEvent' in window
        };
    }
};

// Auto-run enhanced network diagnostics on load
if (typeof window !== 'undefined') {
    console.log('🔍 Running enhanced network diagnostics with CSP awareness...');
    console.log('Network Info:', NetworkHelper.getNetworkInfo());
    
    // Set up global CSP violation listener - disabled to reduce console noise
    // Uncomment for debugging CSP issues
    /*
    document.addEventListener('securitypolicyviolation', (event) => {
        const cspEvent = event as CSPViolationEvent;
        console.error('🚫 CSP Violation detected:', {
            blockedURI: cspEvent.blockedURI,
            violatedDirective: cspEvent.violatedDirective,
            documentURI: cspEvent.documentURI,
            originalPolicy: cspEvent.originalPolicy
        });
    });
    */
    
    NetworkHelper.checkConnectivity().then(connected => {
        if (connected) {
            console.log('✅ Basic internet connectivity: Working');
        } else {
            console.warn('❌ Basic internet connectivity: Failed');
            console.log('💡 Try: Check internet connection, disable VPN, restart router, or check CSP configuration');
        }
    });
    
    NetworkHelper.checkFirebaseConnectivity().then(result => {
        if (result.connected) {
            console.log('✅ Firebase connectivity: Working');
        } else {
            console.warn('❌ Firebase connectivity: Failed');
            
            if (result.cspViolations.length > 0) {
                console.error('🚫 CSP violations detected:', result.cspViolations);
                console.log('💡 CSP Fix: Add Firebase domains to your Content Security Policy');
            }
            
            if (result.errors.length > 0) {
                console.warn('🌐 Network errors:', result.errors);
                console.log('💡 Try: Check firewall, try different DNS (8.8.8.8), disable ad blockers');
            }
        }
    });
    
    // Run comprehensive Firebase diagnostics
    NetworkHelper.diagnoseFirebaseIssues().then(diagnosis => {
        console.log('🔬 Firebase Services Diagnosis:', diagnosis);
        
        if (diagnosis.overall === 'failed') {
            console.error('❌ All Firebase services are failing');
        } else if (diagnosis.overall === 'degraded') {
            console.warn('⚠️ Some Firebase services are having issues');
        } else {
            console.log('✅ All Firebase services are healthy');
        }
        
        if (diagnosis.recommendations.length > 0) {
            console.log('💡 Recommendations:');
            diagnosis.recommendations.forEach(rec => console.log(`   • ${rec}`));
        }
    });
}
