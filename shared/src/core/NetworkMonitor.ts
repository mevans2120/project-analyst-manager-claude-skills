/**
 * NetworkMonitor - Enhanced API Discovery
 * Track and analyze API calls to discover backend features
 *
 * This module provides advanced network monitoring capabilities,
 * analyzing API patterns and discovering backend endpoints.
 */

import { PlaywrightDriver } from './PlaywrightDriver';
import {
  APIEndpoint,
  APIPattern,
  NetworkSummary,
  MonitorOptions
} from '../types/network';

export class NetworkMonitor {
  private driver: PlaywrightDriver;
  private options: MonitorOptions;
  private endpoints: Map<string, APIEndpoint> = new Map();
  private requestTimings: Map<string, number> = new Map();

  constructor(driver: PlaywrightDriver, options: MonitorOptions = {}) {
    this.driver = driver;
    this.options = {
      apiOnly: true,
      captureBodies: true,
      maxBodySize: 10000,
      ...options
    };
  }

  /**
   * Start monitoring network activity
   */
  async startMonitoring(): Promise<void> {
    if (!this.driver.isLaunched()) {
      throw new Error('PlaywrightDriver must be launched before monitoring');
    }

    this.clear();
  }

  /**
   * Navigate and monitor
   */
  async navigateAndMonitor(url: string): Promise<NetworkSummary> {
    // Clear previous data
    this.clear();

    // Navigate
    await this.driver.navigate({ url, waitUntil: 'networkidle' });

    // Wait a bit for any additional requests
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Get network data from driver
    const requests = this.driver.getNetworkRequests();
    const responses = this.driver.getNetworkResponses();

    // Process requests and responses
    for (const request of requests) {
      // Skip if filtering for API only
      if (this.options.apiOnly && request.resourceType !== 'xhr' && request.resourceType !== 'fetch') {
        continue;
      }

      // Skip if URL doesn't match pattern
      if (this.options.urlPattern && !this.options.urlPattern.test(request.url)) {
        continue;
      }

      // Find corresponding response
      const response = responses.find(r => r.url === request.url);

      if (response) {
        const endpoint: APIEndpoint = {
          url: request.url,
          method: request.method,
          requestHeaders: request.headers,
          responseHeaders: response.headers,
          statusCode: response.status,
          requestPayload: this.captureBody(request.postData),
          responsePayload: this.captureBody(response.body),
          timestamp: new Date()
        };

        // Generate unique key
        const key = `${request.method}:${request.url}`;
        this.endpoints.set(key, endpoint);
      }
    }

    return this.getSummary();
  }

  /**
   * Capture body with size limit
   */
  private captureBody(body?: string): string | undefined {
    if (!this.options.captureBodies || !body) {
      return undefined;
    }

    if (body.length > (this.options.maxBodySize || 10000)) {
      return body.substring(0, this.options.maxBodySize) + '... (truncated)';
    }

    return body;
  }

  /**
   * Get monitoring summary
   */
  getSummary(): NetworkSummary {
    const endpoints = Array.from(this.endpoints.values());
    const patterns = this.discoverPatterns(endpoints);

    // Get total from driver
    const allRequests = this.driver.getNetworkRequests();
    const apiCalls = this.driver.getAPICalls();

    return {
      totalRequests: allRequests.length,
      totalAPICalls: apiCalls.length,
      uniqueEndpoints: this.endpoints.size,
      patterns,
      endpoints
    };
  }

  /**
   * Discover API patterns
   */
  private discoverPatterns(endpoints: APIEndpoint[]): APIPattern[] {
    const patternMap = new Map<string, {
      methods: Set<string>;
      urls: Set<string>;
      count: number;
    }>();

    for (const endpoint of endpoints) {
      const pattern = this.extractPattern(endpoint.url);

      if (!patternMap.has(pattern)) {
        patternMap.set(pattern, {
          methods: new Set(),
          urls: new Set(),
          count: 0
        });
      }

      const data = patternMap.get(pattern)!;
      data.methods.add(endpoint.method);
      data.urls.add(endpoint.url);
      data.count++;
    }

    // Convert to patterns
    const patterns: APIPattern[] = [];

    for (const [pattern, data] of patternMap.entries()) {
      patterns.push({
        pattern,
        methods: Array.from(data.methods),
        callCount: data.count,
        examples: Array.from(data.urls).slice(0, 3)
      });
    }

    // Sort by call count
    patterns.sort((a, b) => b.callCount - a.callCount);

    return patterns;
  }

  /**
   * Extract URL pattern (replace IDs with placeholders)
   */
  private extractPattern(url: string): string {
    try {
      const urlObj = new URL(url);
      let pathname = urlObj.pathname;

      // Replace UUIDs
      pathname = pathname.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '{uuid}');

      // Replace numeric IDs
      pathname = pathname.replace(/\/\d+\//g, '/{id}/');
      pathname = pathname.replace(/\/\d+$/g, '/{id}');

      // Replace hash-like strings
      pathname = pathname.replace(/\/[a-f0-9]{16,}\//gi, '/{hash}/');
      pathname = pathname.replace(/\/[a-f0-9]{16,}$/gi, '/{hash}');

      return `${urlObj.origin}${pathname}`;
    } catch (e) {
      return url;
    }
  }

  /**
   * Get endpoints by pattern
   */
  getEndpointsByPattern(pattern: string): APIEndpoint[] {
    return Array.from(this.endpoints.values()).filter(endpoint =>
      this.extractPattern(endpoint.url) === pattern
    );
  }

  /**
   * Get endpoints by method
   */
  getEndpointsByMethod(method: string): APIEndpoint[] {
    return Array.from(this.endpoints.values()).filter(endpoint =>
      endpoint.method.toUpperCase() === method.toUpperCase()
    );
  }

  /**
   * Get all API endpoints
   */
  getAllEndpoints(): APIEndpoint[] {
    return Array.from(this.endpoints.values());
  }

  /**
   * Export endpoints as JSON
   */
  exportAsJSON(): string {
    const summary = this.getSummary();
    return JSON.stringify(summary, null, 2);
  }

  /**
   * Export patterns as markdown
   */
  exportAsMarkdown(): string {
    const summary = this.getSummary();
    let md = '# API Discovery Report\n\n';

    md += `## Summary\n\n`;
    md += `- **Total Requests**: ${summary.totalRequests}\n`;
    md += `- **API Calls**: ${summary.totalAPICalls}\n`;
    md += `- **Unique Endpoints**: ${summary.uniqueEndpoints}\n`;
    md += `- **Patterns Discovered**: ${summary.patterns.length}\n\n`;

    md += `## API Patterns\n\n`;

    for (const pattern of summary.patterns) {
      md += `### ${pattern.pattern}\n\n`;
      md += `- **Methods**: ${pattern.methods.join(', ')}\n`;
      md += `- **Calls**: ${pattern.callCount}\n`;
      md += `- **Examples**:\n`;

      for (const example of pattern.examples) {
        md += `  - ${example}\n`;
      }

      md += `\n`;
    }

    return md;
  }

  /**
   * Clear monitoring data
   */
  clear(): void {
    this.endpoints.clear();
    this.requestTimings.clear();
    this.driver.clearNetworkLogs();
  }

  /**
   * Get the driver instance
   */
  getDriver(): PlaywrightDriver {
    return this.driver;
  }
}
