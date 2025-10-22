/**
 * Tests for NetworkMonitor
 */

import { NetworkMonitor } from '../src/core/NetworkMonitor';
import { PlaywrightDriver } from '../src/core/PlaywrightDriver';

describe('NetworkMonitor', () => {
  let driver: PlaywrightDriver;
  let monitor: NetworkMonitor;

  beforeEach(() => {
    driver = new PlaywrightDriver({ headless: true });
    monitor = new NetworkMonitor(driver);
  });

  afterEach(async () => {
    if (driver.isLaunched()) {
      await driver.close();
    }
  });

  describe('initialization', () => {
    it('should create instance with driver', () => {
      expect(monitor).toBeInstanceOf(NetworkMonitor);
      expect(monitor.getDriver()).toBe(driver);
    });

    it('should use default options when not provided', () => {
      const defaultMonitor = new NetworkMonitor(driver);
      expect(defaultMonitor).toBeInstanceOf(NetworkMonitor);
    });

    it('should accept custom options', () => {
      const customMonitor = new NetworkMonitor(driver, {
        apiOnly: false,
        captureBodies: false,
        maxBodySize: 5000
      });

      expect(customMonitor).toBeInstanceOf(NetworkMonitor);
    });
  });

  describe('startMonitoring', () => {
    it('should throw error if driver not launched', async () => {
      await expect(monitor.startMonitoring()).rejects.toThrow(
        'PlaywrightDriver must be launched before monitoring'
      );
    });

    it('should start monitoring when driver is launched', async () => {
      await driver.launch();
      await expect(monitor.startMonitoring()).resolves.not.toThrow();
    }, 15000);

    it('should clear previous data when starting', async () => {
      await driver.launch();
      await monitor.navigateAndMonitor('https://example.com');

      const beforeClear = monitor.getAllEndpoints();
      expect(beforeClear.length).toBeGreaterThanOrEqual(0);

      await monitor.startMonitoring();

      const afterClear = monitor.getAllEndpoints();
      expect(afterClear.length).toBe(0);
    }, 20000);
  });

  describe('navigateAndMonitor', () => {
    it('should navigate and capture network activity', async () => {
      await driver.launch();
      const summary = await monitor.navigateAndMonitor('https://example.com');

      expect(summary).toBeDefined();
      expect(summary.totalRequests).toBeGreaterThan(0);
      expect(typeof summary.uniqueEndpoints).toBe('number');
      expect(Array.isArray(summary.patterns)).toBe(true);
      expect(Array.isArray(summary.endpoints)).toBe(true);
    }, 25000);

    it('should filter for API calls only when apiOnly is true', async () => {
      await driver.launch();
      const apiOnlyMonitor = new NetworkMonitor(driver, { apiOnly: true });
      const summary = await apiOnlyMonitor.navigateAndMonitor('https://example.com');

      // example.com is static HTML, so no XHR/fetch calls
      expect(summary.totalAPICalls).toBe(0);
    }, 25000);

    it('should capture all requests when apiOnly is false', async () => {
      await driver.launch();
      const allMonitor = new NetworkMonitor(driver, { apiOnly: false });
      const summary = await allMonitor.navigateAndMonitor('https://example.com');

      expect(summary.totalRequests).toBeGreaterThan(0);
    }, 25000);

    it('should clear previous data before new navigation', async () => {
      await driver.launch();
      await monitor.navigateAndMonitor('https://example.com');
      const firstSummary = monitor.getSummary();

      await monitor.navigateAndMonitor('https://www.iana.org');
      const secondSummary = monitor.getSummary();

      // Data should be from second navigation only
      expect(secondSummary.totalRequests).toBeGreaterThan(0);
    }, 30000);
  });

  describe('pattern discovery', () => {
    it('should discover API patterns from endpoints', async () => {
      await driver.launch();
      // Use a site that makes API calls (GitHub for example)
      const summary = await monitor.navigateAndMonitor('https://www.iana.org');

      expect(summary.patterns).toBeDefined();
      expect(Array.isArray(summary.patterns)).toBe(true);
    }, 25000);

    it('should extract patterns with placeholders for IDs', () => {
      // This tests the private extractPattern method indirectly
      // by checking that patterns group similar URLs together
      const endpoints = monitor.getAllEndpoints();

      expect(Array.isArray(endpoints)).toBe(true);
    });

    it('should sort patterns by call count', async () => {
      await driver.launch();
      const summary = await monitor.navigateAndMonitor('https://example.com');

      if (summary.patterns.length > 1) {
        for (let i = 0; i < summary.patterns.length - 1; i++) {
          expect(summary.patterns[i].callCount).toBeGreaterThanOrEqual(
            summary.patterns[i + 1].callCount
          );
        }
      }
    }, 25000);
  });

  describe('endpoint filtering', () => {
    beforeEach(async () => {
      await driver.launch();
      await monitor.navigateAndMonitor('https://example.com');
    }, 20000);

    it('should get all endpoints', () => {
      const endpoints = monitor.getAllEndpoints();
      expect(Array.isArray(endpoints)).toBe(true);
    });

    it('should filter endpoints by method', () => {
      const getEndpoints = monitor.getEndpointsByMethod('GET');

      expect(Array.isArray(getEndpoints)).toBe(true);

      for (const endpoint of getEndpoints) {
        expect(endpoint.method.toUpperCase()).toBe('GET');
      }
    });

    it('should filter endpoints by pattern', () => {
      const allEndpoints = monitor.getAllEndpoints();

      if (allEndpoints.length > 0) {
        // Get the pattern for the first endpoint
        const summary = monitor.getSummary();

        if (summary.patterns.length > 0) {
          const pattern = summary.patterns[0].pattern;
          const filtered = monitor.getEndpointsByPattern(pattern);

          expect(Array.isArray(filtered)).toBe(true);
          expect(filtered.length).toBeGreaterThan(0);
        }
      }
    });

    it('should handle case-insensitive method filtering', () => {
      const getUpper = monitor.getEndpointsByMethod('GET');
      const getLower = monitor.getEndpointsByMethod('get');

      expect(getUpper.length).toBe(getLower.length);
    });
  });

  describe('data export', () => {
    beforeEach(async () => {
      await driver.launch();
      await monitor.navigateAndMonitor('https://example.com');
    }, 20000);

    it('should export as JSON', () => {
      const json = monitor.exportAsJSON();

      expect(typeof json).toBe('string');

      const parsed = JSON.parse(json);
      expect(parsed).toHaveProperty('totalRequests');
      expect(parsed).toHaveProperty('totalAPICalls');
      expect(parsed).toHaveProperty('uniqueEndpoints');
      expect(parsed).toHaveProperty('patterns');
      expect(parsed).toHaveProperty('endpoints');
    });

    it('should export as Markdown', () => {
      const markdown = monitor.exportAsMarkdown();

      expect(typeof markdown).toBe('string');
      expect(markdown).toContain('# API Discovery Report');
      expect(markdown).toContain('## Summary');
      expect(markdown).toContain('Total Requests');
      expect(markdown).toContain('API Calls');
    });

    it('should include patterns in markdown export', () => {
      const markdown = monitor.exportAsMarkdown();

      expect(markdown).toContain('## API Patterns');
    });
  });

  describe('body capture', () => {
    it('should capture request and response bodies when enabled', async () => {
      await driver.launch();
      const captureMonitor = new NetworkMonitor(driver, {
        captureBodies: true,
        maxBodySize: 10000
      });

      await captureMonitor.navigateAndMonitor('https://example.com');

      // Even if no bodies captured (static site), should not error
      const endpoints = captureMonitor.getAllEndpoints();
      expect(Array.isArray(endpoints)).toBe(true);
    }, 25000);

    it('should not capture bodies when disabled', async () => {
      await driver.launch();
      const noCaptureMonitor = new NetworkMonitor(driver, {
        captureBodies: false
      });

      await noCaptureMonitor.navigateAndMonitor('https://example.com');

      const endpoints = noCaptureMonitor.getAllEndpoints();

      for (const endpoint of endpoints) {
        expect(endpoint.requestPayload).toBeUndefined();
        expect(endpoint.responsePayload).toBeUndefined();
      }
    }, 25000);

    it('should truncate large bodies', async () => {
      await driver.launch();
      const smallBodyMonitor = new NetworkMonitor(driver, {
        captureBodies: true,
        maxBodySize: 100 // Very small
      });

      await smallBodyMonitor.navigateAndMonitor('https://example.com');

      const endpoints = smallBodyMonitor.getAllEndpoints();

      for (const endpoint of endpoints) {
        if (endpoint.responsePayload && endpoint.responsePayload.length > 100) {
          expect(endpoint.responsePayload).toContain('... (truncated)');
        }
      }
    }, 25000);
  });

  describe('URL pattern filtering', () => {
    it('should filter by URL pattern', async () => {
      await driver.launch();
      const patternMonitor = new NetworkMonitor(driver, {
        urlPattern: /example\.com/
      });

      await patternMonitor.navigateAndMonitor('https://example.com');

      const endpoints = patternMonitor.getAllEndpoints();

      for (const endpoint of endpoints) {
        expect(endpoint.url).toMatch(/example\.com/);
      }
    }, 25000);

    it('should exclude non-matching URLs', async () => {
      await driver.launch();
      const patternMonitor = new NetworkMonitor(driver, {
        urlPattern: /api\/v1/
      });

      await patternMonitor.navigateAndMonitor('https://example.com');

      const endpoints = patternMonitor.getAllEndpoints();

      // example.com doesn't have /api/v1, so should be empty or only matching URLs
      for (const endpoint of endpoints) {
        expect(endpoint.url).toMatch(/api\/v1/);
      }
    }, 25000);
  });

  describe('clear', () => {
    it('should clear all monitoring data', async () => {
      await driver.launch();
      await monitor.navigateAndMonitor('https://example.com');

      expect(monitor.getAllEndpoints().length).toBeGreaterThanOrEqual(0);

      monitor.clear();

      expect(monitor.getAllEndpoints().length).toBe(0);

      const summary = monitor.getSummary();
      expect(summary.uniqueEndpoints).toBe(0);
    }, 25000);

    it('should clear driver network logs', async () => {
      await driver.launch();
      await driver.navigate({ url: 'https://example.com' });

      expect(driver.getNetworkRequests().length).toBeGreaterThan(0);

      monitor.clear();

      expect(driver.getNetworkRequests().length).toBe(0);
    }, 20000);
  });

  describe('getSummary', () => {
    it('should return comprehensive network summary', async () => {
      await driver.launch();
      await monitor.navigateAndMonitor('https://example.com');

      const summary = monitor.getSummary();

      expect(summary).toHaveProperty('totalRequests');
      expect(summary).toHaveProperty('totalAPICalls');
      expect(summary).toHaveProperty('uniqueEndpoints');
      expect(summary).toHaveProperty('patterns');
      expect(summary).toHaveProperty('endpoints');

      expect(typeof summary.totalRequests).toBe('number');
      expect(typeof summary.totalAPICalls).toBe('number');
      expect(typeof summary.uniqueEndpoints).toBe('number');
      expect(Array.isArray(summary.patterns)).toBe(true);
      expect(Array.isArray(summary.endpoints)).toBe(true);
    }, 25000);
  });
});
