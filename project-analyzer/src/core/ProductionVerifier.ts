/**
 * Production Verifier - Verify features work in production
 * PM-10: Production Verification (3-tier)
 *
 * Three-tier verification strategy:
 * Tier 1: URL Verification - Feature pages exist and load
 * Tier 2: Functionality Verification - Buttons work, forms submit, interactions succeed
 * Tier 3: API Verification - Endpoints return expected data
 */

import { PlaywrightDriver } from '../../../shared/src/core/PlaywrightDriver';
import { NetworkMonitor } from '../../../shared/src/core/NetworkMonitor';
import { ScreenshotCapture } from '../../../shared/src/core/ScreenshotCapture';

export interface VerificationTarget {
  featureId: string;
  featureName: string;
  productionUrl: string;
  stagingUrl?: string;
  tier1?: Tier1Check[];
  tier2?: Tier2Check[];
  tier3?: Tier3Check[];
}

export interface Tier1Check {
  url: string;
  expectedStatus?: number;
  expectedTitle?: string;
  expectedElement?: string;
}

export interface Tier2Check {
  type: 'button' | 'form' | 'link' | 'interaction';
  selector: string;
  action?: 'click' | 'fill' | 'submit';
  data?: Record<string, string>;
  expectedResult?: string;
}

export interface Tier3Check {
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  expectedStatus?: number;
  expectedData?: any;
  headers?: Record<string, string>;
}

export interface VerificationResult {
  featureId: string;
  featureName: string;
  environment: 'production' | 'staging';
  tier1: TierResult;
  tier2: TierResult;
  tier3: TierResult;
  overall: 'pass' | 'fail' | 'partial';
  timestamp: string;
  screenshotPath?: string;
}

export interface TierResult {
  passed: number;
  failed: number;
  total: number;
  checks: CheckResult[];
  status: 'pass' | 'fail' | 'partial' | 'skipped';
}

export interface CheckResult {
  name: string;
  passed: boolean;
  message: string;
  details?: any;
}

export interface VerificationOptions {
  captureScreenshots?: boolean;
  screenshotDir?: string;
  timeout?: number;
  retries?: number;
  compareStaging?: boolean;
}

export class ProductionVerifier {
  private driver: PlaywrightDriver;
  private networkMonitor: NetworkMonitor;
  private screenshotCapture: ScreenshotCapture;

  constructor() {
    this.driver = new PlaywrightDriver({
      headless: true,
      browser: 'chromium'
    });
    this.networkMonitor = new NetworkMonitor(this.driver);
    this.screenshotCapture = new ScreenshotCapture(this.driver);
  }

  /**
   * Verify a feature in production
   */
  async verify(
    target: VerificationTarget,
    options: VerificationOptions = {}
  ): Promise<VerificationResult> {
    const timeout = options.timeout || 30000;
    const retries = options.retries || 2;

    try {
      await this.driver.launch();
      await this.networkMonitor.startMonitoring();

      // Navigate to production URL
      await this.driver.navigateTo(target.productionUrl, { timeout });

      // Tier 1: URL Verification
      const tier1 = await this.verifyTier1(target.tier1 || [], options);

      // Tier 2: Functionality Verification
      const tier2 = await this.verifyTier2(target.tier2 || [], options);

      // Tier 3: API Verification
      const tier3 = await this.verifyTier3(target.tier3 || [], options);

      // Capture screenshot if requested
      let screenshotPath: string | undefined;
      if (options.captureScreenshots) {
        const dir = options.screenshotDir || './screenshots';
        screenshotPath = `${dir}/${target.featureId}-production.png`;
        await this.screenshotCapture.captureFullPage(screenshotPath);
      }

      // Calculate overall status
      const overall = this.calculateOverallStatus(tier1, tier2, tier3);

      const result: VerificationResult = {
        featureId: target.featureId,
        featureName: target.featureName,
        environment: 'production',
        tier1,
        tier2,
        tier3,
        overall,
        timestamp: new Date().toISOString(),
        screenshotPath
      };

      // Compare with staging if requested
      if (options.compareStaging && target.stagingUrl) {
        const stagingResult = await this.verifyStaging(target, options);
        // Could add comparison logic here
      }

      return result;

    } finally {
      await this.networkMonitor.stopMonitoring();
      await this.driver.close();
    }
  }

  /**
   * Verify multiple features
   */
  async verifyMultiple(
    targets: VerificationTarget[],
    options: VerificationOptions = {}
  ): Promise<VerificationResult[]> {
    const results: VerificationResult[] = [];

    for (const target of targets) {
      try {
        const result = await this.verify(target, options);
        results.push(result);
      } catch (error) {
        console.error(`Failed to verify feature ${target.featureId}:`, error);
        results.push(this.createErrorResult(target, error));
      }
    }

    return results;
  }

  /**
   * Tier 1: URL Verification
   */
  private async verifyTier1(
    checks: Tier1Check[],
    options: VerificationOptions
  ): Promise<TierResult> {
    if (checks.length === 0) {
      return this.createSkippedResult('Tier 1');
    }

    const results: CheckResult[] = [];
    let passed = 0;
    let failed = 0;

    for (const check of checks) {
      try {
        // Navigate to URL
        const response = await this.driver.navigateTo(check.url, {
          timeout: options.timeout || 30000
        });

        // Check HTTP status
        let statusCheck = true;
        if (check.expectedStatus) {
          statusCheck = response?.status() === check.expectedStatus;
          if (!statusCheck) {
            results.push({
              name: `URL: ${check.url}`,
              passed: false,
              message: `Expected status ${check.expectedStatus}, got ${response?.status()}`
            });
            failed++;
            continue;
          }
        }

        // Check page title
        if (check.expectedTitle) {
          const title = await this.driver.page.title();
          if (!title.includes(check.expectedTitle)) {
            results.push({
              name: `URL: ${check.url}`,
              passed: false,
              message: `Expected title to contain "${check.expectedTitle}", got "${title}"`
            });
            failed++;
            continue;
          }
        }

        // Check for expected element
        if (check.expectedElement) {
          const element = await this.driver.page.$(check.expectedElement);
          if (!element) {
            results.push({
              name: `URL: ${check.url}`,
              passed: false,
              message: `Expected element "${check.expectedElement}" not found`
            });
            failed++;
            continue;
          }
        }

        // All checks passed
        results.push({
          name: `URL: ${check.url}`,
          passed: true,
          message: 'URL loads successfully'
        });
        passed++;

      } catch (error) {
        results.push({
          name: `URL: ${check.url}`,
          passed: false,
          message: `Failed to load: ${error instanceof Error ? error.message : String(error)}`
        });
        failed++;
      }
    }

    return {
      passed,
      failed,
      total: checks.length,
      checks: results,
      status: failed === 0 ? 'pass' : (passed > 0 ? 'partial' : 'fail')
    };
  }

  /**
   * Tier 2: Functionality Verification
   */
  private async verifyTier2(
    checks: Tier2Check[],
    options: VerificationOptions
  ): Promise<TierResult> {
    if (checks.length === 0) {
      return this.createSkippedResult('Tier 2');
    }

    const results: CheckResult[] = [];
    let passed = 0;
    let failed = 0;

    for (const check of checks) {
      try {
        switch (check.type) {
          case 'button':
            const buttonResult = await this.verifyButton(check);
            results.push(buttonResult);
            if (buttonResult.passed) passed++;
            else failed++;
            break;

          case 'form':
            const formResult = await this.verifyForm(check);
            results.push(formResult);
            if (formResult.passed) passed++;
            else failed++;
            break;

          case 'link':
            const linkResult = await this.verifyLink(check);
            results.push(linkResult);
            if (linkResult.passed) passed++;
            else failed++;
            break;

          case 'interaction':
            const interactionResult = await this.verifyInteraction(check);
            results.push(interactionResult);
            if (interactionResult.passed) passed++;
            else failed++;
            break;
        }
      } catch (error) {
        results.push({
          name: `${check.type}: ${check.selector}`,
          passed: false,
          message: `Failed: ${error instanceof Error ? error.message : String(error)}`
        });
        failed++;
      }
    }

    return {
      passed,
      failed,
      total: checks.length,
      checks: results,
      status: failed === 0 ? 'pass' : (passed > 0 ? 'partial' : 'fail')
    };
  }

  /**
   * Verify button functionality
   */
  private async verifyButton(check: Tier2Check): Promise<CheckResult> {
    try {
      // Check if button exists
      const button = await this.driver.page.$(check.selector);
      if (!button) {
        return {
          name: `Button: ${check.selector}`,
          passed: false,
          message: 'Button not found'
        };
      }

      // Check if button is visible and enabled
      const isVisible = await button.isVisible();
      const isEnabled = await button.isEnabled();

      if (!isVisible) {
        return {
          name: `Button: ${check.selector}`,
          passed: false,
          message: 'Button is not visible'
        };
      }

      if (!isEnabled) {
        return {
          name: `Button: ${check.selector}`,
          passed: false,
          message: 'Button is disabled'
        };
      }

      // Click button if action is specified
      if (check.action === 'click') {
        await button.click();
        await this.driver.page.waitForTimeout(1000);

        // Check for expected result
        if (check.expectedResult) {
          const element = await this.driver.page.$(check.expectedResult);
          if (!element) {
            return {
              name: `Button: ${check.selector}`,
              passed: false,
              message: `Expected result element "${check.expectedResult}" not found after click`
            };
          }
        }
      }

      return {
        name: `Button: ${check.selector}`,
        passed: true,
        message: 'Button is functional'
      };

    } catch (error) {
      return {
        name: `Button: ${check.selector}`,
        passed: false,
        message: `Error: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Verify form functionality
   */
  private async verifyForm(check: Tier2Check): Promise<CheckResult> {
    try {
      // Find form
      const form = await this.driver.page.$(check.selector);
      if (!form) {
        return {
          name: `Form: ${check.selector}`,
          passed: false,
          message: 'Form not found'
        };
      }

      // Fill form if data provided
      if (check.data) {
        for (const [field, value] of Object.entries(check.data)) {
          await this.driver.page.fill(`${check.selector} ${field}`, value);
        }
      }

      // Submit form if action is specified
      if (check.action === 'submit') {
        await form.evaluate((el) => (el as HTMLFormElement).submit());
        await this.driver.page.waitForTimeout(2000);

        // Check for expected result
        if (check.expectedResult) {
          const element = await this.driver.page.$(check.expectedResult);
          if (!element) {
            return {
              name: `Form: ${check.selector}`,
              passed: false,
              message: `Expected result element "${check.expectedResult}" not found after submit`
            };
          }
        }
      }

      return {
        name: `Form: ${check.selector}`,
        passed: true,
        message: 'Form is functional'
      };

    } catch (error) {
      return {
        name: `Form: ${check.selector}`,
        passed: false,
        message: `Error: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Verify link functionality
   */
  private async verifyLink(check: Tier2Check): Promise<CheckResult> {
    try {
      const link = await this.driver.page.$(check.selector);
      if (!link) {
        return {
          name: `Link: ${check.selector}`,
          passed: false,
          message: 'Link not found'
        };
      }

      const href = await link.getAttribute('href');
      if (!href) {
        return {
          name: `Link: ${check.selector}`,
          passed: false,
          message: 'Link has no href attribute'
        };
      }

      return {
        name: `Link: ${check.selector}`,
        passed: true,
        message: `Link points to ${href}`
      };

    } catch (error) {
      return {
        name: `Link: ${check.selector}`,
        passed: false,
        message: `Error: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Verify custom interaction
   */
  private async verifyInteraction(check: Tier2Check): Promise<CheckResult> {
    try {
      const element = await this.driver.page.$(check.selector);
      if (!element) {
        return {
          name: `Interaction: ${check.selector}`,
          passed: false,
          message: 'Element not found'
        };
      }

      // Perform action
      if (check.action === 'click') {
        await element.click();
      } else if (check.action === 'fill' && check.data) {
        const value = Object.values(check.data)[0];
        await element.fill(value);
      }

      await this.driver.page.waitForTimeout(1000);

      return {
        name: `Interaction: ${check.selector}`,
        passed: true,
        message: 'Interaction successful'
      };

    } catch (error) {
      return {
        name: `Interaction: ${check.selector}`,
        passed: false,
        message: `Error: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Tier 3: API Verification
   */
  private async verifyTier3(
    checks: Tier3Check[],
    options: VerificationOptions
  ): Promise<TierResult> {
    if (checks.length === 0) {
      return this.createSkippedResult('Tier 3');
    }

    const results: CheckResult[] = [];
    let passed = 0;
    let failed = 0;

    for (const check of checks) {
      try {
        const result = await this.verifyAPIEndpoint(check);
        results.push(result);
        if (result.passed) passed++;
        else failed++;
      } catch (error) {
        results.push({
          name: `API: ${check.endpoint}`,
          passed: false,
          message: `Failed: ${error instanceof Error ? error.message : String(error)}`
        });
        failed++;
      }
    }

    return {
      passed,
      failed,
      total: checks.length,
      checks: results,
      status: failed === 0 ? 'pass' : (passed > 0 ? 'partial' : 'fail')
    };
  }

  /**
   * Verify API endpoint
   */
  private async verifyAPIEndpoint(check: Tier3Check): Promise<CheckResult> {
    try {
      const method = check.method || 'GET';
      const response = await fetch(check.endpoint, {
        method,
        headers: check.headers || {}
      });

      // Check status code
      if (check.expectedStatus && response.status !== check.expectedStatus) {
        return {
          name: `API: ${check.endpoint}`,
          passed: false,
          message: `Expected status ${check.expectedStatus}, got ${response.status}`
        };
      }

      // Check response data if expected
      if (check.expectedData) {
        const data = await response.json();
        // Simple check - in production, you'd want deep equality
        if (JSON.stringify(data) !== JSON.stringify(check.expectedData)) {
          return {
            name: `API: ${check.endpoint}`,
            passed: false,
            message: 'Response data does not match expected data',
            details: { received: data, expected: check.expectedData }
          };
        }
      }

      return {
        name: `API: ${check.endpoint}`,
        passed: true,
        message: `API responded with status ${response.status}`
      };

    } catch (error) {
      return {
        name: `API: ${check.endpoint}`,
        passed: false,
        message: `Error: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Verify staging environment
   */
  private async verifyStaging(
    target: VerificationTarget,
    options: VerificationOptions
  ): Promise<VerificationResult> {
    if (!target.stagingUrl) {
      throw new Error('Staging URL not provided');
    }

    // Close current session
    await this.driver.close();

    // Create new target for staging
    const stagingTarget = { ...target, productionUrl: target.stagingUrl };

    // Verify staging
    await this.driver.launch();
    const result = await this.verify(stagingTarget, options);
    result.environment = 'staging';

    return result;
  }

  /**
   * Calculate overall status
   */
  private calculateOverallStatus(
    tier1: TierResult,
    tier2: TierResult,
    tier3: TierResult
  ): 'pass' | 'fail' | 'partial' {
    const allPassed = [tier1, tier2, tier3].every(t =>
      t.status === 'pass' || t.status === 'skipped'
    );

    const allFailed = [tier1, tier2, tier3].every(t =>
      t.status === 'fail' || t.status === 'skipped'
    );

    if (allPassed) return 'pass';
    if (allFailed) return 'fail';
    return 'partial';
  }

  /**
   * Create skipped result
   */
  private createSkippedResult(tierName: string): TierResult {
    return {
      passed: 0,
      failed: 0,
      total: 0,
      checks: [],
      status: 'skipped'
    };
  }

  /**
   * Create error result
   */
  private createErrorResult(target: VerificationTarget, error: any): VerificationResult {
    return {
      featureId: target.featureId,
      featureName: target.featureName,
      environment: 'production',
      tier1: this.createSkippedResult('Tier 1'),
      tier2: this.createSkippedResult('Tier 2'),
      tier3: this.createSkippedResult('Tier 3'),
      overall: 'fail',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Generate verification report
   */
  generateReport(results: VerificationResult[]): string {
    const lines: string[] = [];

    lines.push('# Production Verification Report');
    lines.push('');
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push('');

    // Summary
    const passed = results.filter(r => r.overall === 'pass').length;
    const failed = results.filter(r => r.overall === 'fail').length;
    const partial = results.filter(r => r.overall === 'partial').length;

    lines.push('## Summary');
    lines.push('');
    lines.push(`- ✅ Passed: ${passed}`);
    lines.push(`- ❌ Failed: ${failed}`);
    lines.push(`- ⚠️  Partial: ${partial}`);
    lines.push(`- **Total**: ${results.length}`);
    lines.push('');

    // Individual results
    lines.push('## Feature Results');
    lines.push('');

    for (const result of results) {
      const icon = result.overall === 'pass' ? '✅' : result.overall === 'fail' ? '❌' : '⚠️';
      lines.push(`### ${icon} ${result.featureName} (${result.featureId})`);
      lines.push('');
      lines.push(`**Status**: ${result.overall}`);
      lines.push(`**Timestamp**: ${result.timestamp}`);
      lines.push('');

      // Tier results
      for (const [tierName, tierResult] of [
        ['Tier 1 (URL)', result.tier1],
        ['Tier 2 (Functionality)', result.tier2],
        ['Tier 3 (API)', result.tier3]
      ]) {
        lines.push(`#### ${tierName}`);
        lines.push(`Status: ${tierResult.status} | Passed: ${tierResult.passed}/${tierResult.total}`);
        lines.push('');

        if (tierResult.checks.length > 0) {
          for (const check of tierResult.checks) {
            const checkIcon = check.passed ? '✓' : '✗';
            lines.push(`- ${checkIcon} ${check.name}: ${check.message}`);
          }
          lines.push('');
        }
      }

      lines.push('---');
      lines.push('');
    }

    return lines.join('\n');
  }
}
