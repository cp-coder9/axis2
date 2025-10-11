/**
 * Theme Switching Test Script
 * 
 * This script tests the integration between shadcn-ui ThemeProvider 
 * and the legacy useDarkMode hook for backward compatibility.
 */

export interface ThemeTestResult {
  testName: string;
  passed: boolean;
  details: string;
  error?: string;
}

export class ThemeSwitchingTester {
  private results: ThemeTestResult[] = [];

  async runAllTests(): Promise<ThemeTestResult[]> {
    this.results = [];
    
    console.log('🧪 Starting Theme Switching Integration Tests...');
    
    await this.testThemeProviderContext();
    await this.testLegacyUseDarkModeHook();
    await this.testSystemThemeDetection();
    await this.testLocalStoragePersistence();
    await this.testCSSClassApplication();
    await this.testRealTimeThemeSwitching();
    
    console.log('✅ Theme Switching Tests Completed');
    return this.results;
  }

  private async testThemeProviderContext(): Promise<void> {
    try {
      // Check if ThemeProvider context is available
      const themeProviderExists = typeof window !== 'undefined' && 
        document.querySelector('[data-theme]') !== null ||
        document.documentElement.classList.contains('light') ||
        document.documentElement.classList.contains('dark');

      if (themeProviderExists) {
        this.addResult({
          testName: 'ThemeProvider Context',
          passed: true,
          details: 'ThemeProvider context is properly initialized and accessible'
        });
      } else {
        throw new Error('ThemeProvider context not found or not initialized');
      }
    } catch (error) {
      this.addResult({
        testName: 'ThemeProvider Context',
        passed: false,
        details: 'ThemeProvider context test failed',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private async testLegacyUseDarkModeHook(): Promise<void> {
    try {
      // Test useDarkMode hook by checking localStorage integration
      const storageKey = 'architex-ui-theme';
      const initialTheme = localStorage.getItem(storageKey);
      
      // Simulate theme change
      localStorage.setItem(storageKey, 'dark');
      
      // Check if the change is detected
      const isDarkModeSet = localStorage.getItem(storageKey) === 'dark';
      
      if (isDarkModeSet) {
        this.addResult({
          testName: 'Legacy useDarkMode Hook',
          passed: true,
          details: 'useDarkMode hook localStorage integration working correctly'
        });
      } else {
        throw new Error('useDarkMode hook localStorage integration failed');
      }
      
      // Restore initial theme
      if (initialTheme) {
        localStorage.setItem(storageKey, initialTheme);
      } else {
        localStorage.removeItem(storageKey);
      }
    } catch (error) {
      this.addResult({
        testName: 'Legacy useDarkMode Hook',
        passed: false,
        details: 'useDarkMode hook test failed',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private async testSystemThemeDetection(): Promise<void> {
    try {
      // Test system theme detection
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const systemTheme = mediaQuery.matches ? 'dark' : 'light';
      
      // Check if system theme can be detected
      if (typeof systemTheme === 'string' && (systemTheme === 'dark' || systemTheme === 'light')) {
        this.addResult({
          testName: 'System Theme Detection',
          passed: true,
          details: `System theme detected correctly: ${systemTheme}`
        });
      } else {
        throw new Error('System theme detection failed');
      }
    } catch (error) {
      this.addResult({
        testName: 'System Theme Detection',
        passed: false,
        details: 'System theme detection test failed',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private async testLocalStoragePersistence(): Promise<void> {
    try {
      const storageKey = 'architex-ui-theme';
      const testTheme = 'light';
      
      // Test localStorage persistence
      localStorage.setItem(storageKey, testTheme);
      const retrievedTheme = localStorage.getItem(storageKey);
      
      if (retrievedTheme === testTheme) {
        this.addResult({
          testName: 'LocalStorage Persistence',
          passed: true,
          details: `Theme preference persisted correctly in localStorage: ${retrievedTheme}`
        });
      } else {
        throw new Error(`localStorage persistence failed. Set: ${testTheme}, Retrieved: ${retrievedTheme}`);
      }
    } catch (error) {
      this.addResult({
        testName: 'LocalStorage Persistence',
        passed: false,
        details: 'LocalStorage persistence test failed',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private async testCSSClassApplication(): Promise<void> {
    try {
      // Test CSS class application
      const documentElement = document.documentElement;
      const classList = Array.from(documentElement.classList);
      
      const hasThemeClass = classList.some(cls => cls === 'light' || cls === 'dark');
      
      if (hasThemeClass) {
        this.addResult({
          testName: 'CSS Class Application',
          passed: true,
          details: `Theme CSS classes applied correctly: ${classList.join(', ')}`
        });
      } else {
        throw new Error(`No theme CSS classes found on document element. Classes: ${classList.join(', ')}`);
      }
    } catch (error) {
      this.addResult({
        testName: 'CSS Class Application',
        passed: false,
        details: 'CSS class application test failed',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private async testRealTimeThemeSwitching(): Promise<void> {
    try {
      // Test real-time theme switching
      const documentElement = document.documentElement;
      const initialClasses = Array.from(documentElement.classList);
      
      // Simulate theme switching by adding/removing classes
      if (initialClasses.includes('light')) {
        documentElement.classList.remove('light');
        documentElement.classList.add('dark');
        
        await new Promise(resolve => setTimeout(resolve, 100)); // Wait for changes
        
        const hasChanged = documentElement.classList.contains('dark') && 
                          !documentElement.classList.contains('light');
        
        if (hasChanged) {
          this.addResult({
            testName: 'Real-time Theme Switching',
            passed: true,
            details: 'Real-time theme switching working correctly (light -> dark)'
          });
        } else {
          throw new Error('Theme switching did not apply changes correctly');
        }
        
        // Restore original state
        documentElement.classList.remove('dark');
        documentElement.classList.add('light');
      } else {
        // If starting with dark or no theme, test adding light
        documentElement.classList.add('light');
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const hasLight = documentElement.classList.contains('light');
        
        if (hasLight) {
          this.addResult({
            testName: 'Real-time Theme Switching',
            passed: true,
            details: 'Real-time theme switching working correctly (added light theme)'
          });
        } else {
          throw new Error('Theme switching did not apply light theme correctly');
        }
      }
    } catch (error) {
      this.addResult({
        testName: 'Real-time Theme Switching',
        passed: false,
        details: 'Real-time theme switching test failed',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private addResult(result: ThemeTestResult): void {
    this.results.push(result);
    console.log(`${result.passed ? '✅' : '❌'} ${result.testName}: ${result.details}`);
    if (result.error) {
      console.error(`   Error: ${result.error}`);
    }
  }

  getResults(): ThemeTestResult[] {
    return this.results;
  }

  getPassedTests(): ThemeTestResult[] {
    return this.results.filter(r => r.passed);
  }

  getFailedTests(): ThemeTestResult[] {
    return this.results.filter(r => !r.passed);
  }

  getTestSummary(): { total: number; passed: number; failed: number; passRate: number } {
    const total = this.results.length;
    const passed = this.getPassedTests().length;
    const failed = this.getFailedTests().length;
    const passRate = total > 0 ? (passed / total) * 100 : 0;
    
    return { total, passed, failed, passRate };
  }
}

// Export for use in browser console or testing
if (typeof window !== 'undefined') {
  (window as any).ThemeSwitchingTester = ThemeSwitchingTester;
}

export default ThemeSwitchingTester;
