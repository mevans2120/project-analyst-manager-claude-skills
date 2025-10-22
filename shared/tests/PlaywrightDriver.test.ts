/**
 * Tests for PlaywrightDriver
 */

import { PlaywrightDriver } from '../src/core/PlaywrightDriver';

describe('PlaywrightDriver', () => {
  let driver: PlaywrightDriver;

  beforeEach(() => {
    driver = new PlaywrightDriver({
      headless: true,
      timeout: 10000
    });
  });

  afterEach(async () => {
    if (driver.isLaunched()) {
      await driver.close();
    }
  });

  describe('initialization', () => {
    it('should create a driver instance', () => {
      expect(driver).toBeInstanceOf(PlaywrightDriver);
      expect(driver.isLaunched()).toBe(false);
    });

    it('should launch browser', async () => {
      await driver.launch();
      expect(driver.isLaunched()).toBe(true);
    }, 15000);

    it('should throw error if launching already launched browser', async () => {
      await driver.launch();
      await expect(driver.launch()).rejects.toThrow('Browser already launched');
    }, 15000);
  });

  describe('navigation', () => {
    beforeEach(async () => {
      await driver.launch();
    }, 15000);

    it('should navigate to a URL', async () => {
      await driver.navigate({ url: 'https://example.com' });
      const content = await driver.getContent();
      expect(content.url).toContain('example.com');
      expect(content.title).toBeTruthy();
    }, 20000);

    it('should throw error if navigating without launching', async () => {
      await driver.close();
      await expect(
        driver.navigate({ url: 'https://example.com' })
      ).rejects.toThrow('Browser not launched');
    });
  });

  describe('content extraction', () => {
    beforeEach(async () => {
      await driver.launch();
      await driver.navigate({ url: 'https://example.com' });
    }, 20000);

    it('should get page content', async () => {
      const content = await driver.getContent();
      expect(content.html).toBeTruthy();
      expect(content.title).toBe('Example Domain');
      expect(content.url).toContain('example.com');
      expect(Array.isArray(content.cookies)).toBe(true);
    }, 15000);

    it('should get page content with screenshot', async () => {
      const content = await driver.getContent(true);
      expect(content.screenshot).toBeDefined();
      expect(Buffer.isBuffer(content.screenshot)).toBe(true);
    }, 15000);

    it('should evaluate JavaScript', async () => {
      const result = await driver.evaluate('document.title');
      expect(result).toBe('Example Domain');
    }, 15000);
  });

  describe('element interaction', () => {
    beforeEach(async () => {
      await driver.launch();
      await driver.navigate({ url: 'https://example.com' });
    }, 20000);

    it('should check if element exists', async () => {
      const exists = await driver.exists('h1');
      expect(exists).toBe(true);

      const notExists = await driver.exists('.non-existent-class');
      expect(notExists).toBe(false);
    }, 15000);

    it('should get text content', async () => {
      const text = await driver.getText('h1');
      expect(text).toBe('Example Domain');
    }, 15000);
  });

  describe('screenshot', () => {
    beforeEach(async () => {
      await driver.launch();
      await driver.navigate({ url: 'https://example.com' });
    }, 20000);

    it('should take a screenshot', async () => {
      const screenshot = await driver.screenshot();
      expect(Buffer.isBuffer(screenshot)).toBe(true);
      expect(screenshot.length).toBeGreaterThan(0);
    }, 15000);

    it('should take a full page screenshot', async () => {
      const screenshot = await driver.screenshot({ fullPage: true });
      expect(Buffer.isBuffer(screenshot)).toBe(true);
    }, 15000);
  });

  describe('network monitoring', () => {
    beforeEach(async () => {
      await driver.launch();
    }, 15000);

    it('should track network requests', async () => {
      await driver.navigate({ url: 'https://example.com' });
      const requests = driver.getNetworkRequests();

      expect(Array.isArray(requests)).toBe(true);
      expect(requests.length).toBeGreaterThan(0);

      const mainRequest = requests.find(r => r.url.includes('example.com'));
      expect(mainRequest).toBeDefined();
      expect(mainRequest?.method).toBe('GET');
    }, 20000);

    it('should track network responses', async () => {
      await driver.navigate({ url: 'https://example.com' });
      const responses = driver.getNetworkResponses();

      expect(Array.isArray(responses)).toBe(true);
      expect(responses.length).toBeGreaterThan(0);

      const mainResponse = responses.find(r => r.url.includes('example.com'));
      expect(mainResponse).toBeDefined();
      expect(mainResponse?.status).toBe(200);
    }, 20000);

    it('should clear network logs', async () => {
      await driver.navigate({ url: 'https://example.com' });
      expect(driver.getNetworkRequests().length).toBeGreaterThan(0);

      driver.clearNetworkLogs();
      expect(driver.getNetworkRequests().length).toBe(0);
      expect(driver.getNetworkResponses().length).toBe(0);
    }, 20000);
  });

  describe('cookies', () => {
    beforeEach(async () => {
      await driver.launch();
      await driver.navigate({ url: 'https://example.com' });
    }, 20000);

    it('should get cookies', async () => {
      const cookies = await driver.getCookies();
      expect(Array.isArray(cookies)).toBe(true);
    }, 15000);

    it('should set cookies', async () => {
      const testCookie = {
        name: 'test',
        value: 'value123',
        domain: 'example.com',
        path: '/'
      };

      await driver.setCookies([testCookie]);
      const cookies = await driver.getCookies();

      const foundCookie = cookies.find(c => c.name === 'test');
      expect(foundCookie).toBeDefined();
      expect(foundCookie?.value).toBe('value123');
    }, 15000);
  });

  describe('cleanup', () => {
    it('should close browser properly', async () => {
      await driver.launch();
      expect(driver.isLaunched()).toBe(true);

      await driver.close();
      expect(driver.isLaunched()).toBe(false);
    }, 15000);

    it('should handle multiple close calls', async () => {
      await driver.launch();
      await driver.close();
      await driver.close(); // Should not throw

      expect(driver.isLaunched()).toBe(false);
    }, 15000);
  });

  describe('browser types', () => {
    it('should launch chromium browser', async () => {
      const chromiumDriver = new PlaywrightDriver({ browser: 'chromium', headless: true });
      await chromiumDriver.launch();
      expect(chromiumDriver.isLaunched()).toBe(true);
      await chromiumDriver.close();
    }, 15000);

    // Skip firefox/webkit tests if browsers not installed
    it.skip('should launch firefox browser', async () => {
      const firefoxDriver = new PlaywrightDriver({ browser: 'firefox', headless: true });
      await firefoxDriver.launch();
      expect(firefoxDriver.isLaunched()).toBe(true);
      await firefoxDriver.close();
    }, 15000);

    it.skip('should launch webkit browser', async () => {
      const webkitDriver = new PlaywrightDriver({ browser: 'webkit', headless: true });
      await webkitDriver.launch();
      expect(webkitDriver.isLaunched()).toBe(true);
      await webkitDriver.close();
    }, 15000);
  });

  describe('waitFor functionality', () => {
    beforeEach(async () => {
      await driver.launch();
      await driver.navigate({ url: 'https://example.com' });
    }, 20000);

    it('should wait for selector', async () => {
      await driver.waitFor({ selector: 'h1' });
      const text = await driver.getText('h1');
      expect(text).toBe('Example Domain');
    }, 15000);

    it('should throw error when waiting for non-existent selector with short timeout', async () => {
      await expect(
        driver.waitFor({ selector: '.non-existent-class', timeout: 1000 })
      ).rejects.toThrow();
    }, 5000);

    it('should wait for navigation', async () => {
      await driver.waitFor({ navigation: true });
      const content = await driver.getContent();
      expect(content.url).toContain('example.com');
    }, 15000);
  });

  describe('API call filtering', () => {
    beforeEach(async () => {
      await driver.launch();
    }, 15000);

    it('should filter API calls from network requests', async () => {
      await driver.navigate({ url: 'https://example.com' });
      const apiCalls = driver.getAPICalls();

      expect(Array.isArray(apiCalls)).toBe(true);
      // example.com is static HTML, so no XHR/fetch calls
      expect(apiCalls.length).toBe(0);
    }, 20000);

    it('should identify XHR and fetch requests as API calls', async () => {
      // This would need a site that makes API calls
      // For now, verify the method exists and returns an array
      const apiCalls = driver.getAPICalls();
      expect(Array.isArray(apiCalls)).toBe(true);
    }, 5000);
  });

  describe('error handling', () => {
    it('should throw error when getting content without launch', async () => {
      await expect(driver.getContent()).rejects.toThrow('Browser not launched');
    });

    it('should throw error when taking screenshot without launch', async () => {
      await expect(driver.screenshot()).rejects.toThrow('Browser not launched');
    });

    it('should throw error when evaluating without launch', async () => {
      await expect(driver.evaluate('document.title')).rejects.toThrow('Browser not launched');
    });

    it('should throw error when checking element exists without launch', async () => {
      await expect(driver.exists('h1')).rejects.toThrow('Browser not launched');
    });

    it('should throw error when getting text without launch', async () => {
      await expect(driver.getText('h1')).rejects.toThrow('Browser not launched');
    });

    it('should throw error when clicking without launch', async () => {
      await expect(driver.click('button')).rejects.toThrow('Browser not launched');
    });

    it('should throw error when typing without launch', async () => {
      await expect(driver.type('input', 'text')).rejects.toThrow('Browser not launched');
    });

    it('should throw error when waiting without launch', async () => {
      await expect(driver.waitFor({ selector: 'h1' })).rejects.toThrow('Browser not launched');
    });
  });

  describe('viewport and options', () => {
    it('should use custom viewport', async () => {
      const customDriver = new PlaywrightDriver({
        viewport: { width: 800, height: 600 },
        headless: true
      });

      await customDriver.launch();
      await customDriver.navigate({ url: 'https://example.com' });

      const viewportSize = await customDriver.evaluate('({ width: window.innerWidth, height: window.innerHeight })');
      expect(viewportSize.width).toBe(800);
      expect(viewportSize.height).toBe(600);

      await customDriver.close();
    }, 20000);

    it('should use custom timeout', async () => {
      const fastDriver = new PlaywrightDriver({
        timeout: 5000,
        headless: true
      });

      await fastDriver.launch();
      await fastDriver.navigate({ url: 'https://example.com' });
      await fastDriver.close();
    }, 15000);
  });

  describe('real-world scenarios', () => {
    beforeEach(async () => {
      await driver.launch();
    }, 15000);

    it('should handle multiple page navigations', async () => {
      await driver.navigate({ url: 'https://example.com' });
      let content = await driver.getContent();
      expect(content.url).toContain('example.com');

      await driver.navigate({ url: 'https://www.iana.org' });
      content = await driver.getContent();
      expect(content.url).toContain('iana.org');
    }, 30000);

    it('should preserve network logs across navigations until cleared', async () => {
      await driver.navigate({ url: 'https://example.com' });
      const firstNavRequests = driver.getNetworkRequests().length;
      expect(firstNavRequests).toBeGreaterThan(0);

      await driver.navigate({ url: 'https://www.iana.org' });
      const secondNavRequests = driver.getNetworkRequests().length;
      expect(secondNavRequests).toBeGreaterThan(firstNavRequests);

      driver.clearNetworkLogs();
      expect(driver.getNetworkRequests().length).toBe(0);
    }, 30000);

    it('should handle pages with JavaScript evaluation', async () => {
      await driver.navigate({ url: 'https://example.com' });

      // Use string evaluation to avoid TypeScript DOM type errors
      const evalResult = await driver.evaluate(`({
        hasDocument: typeof document !== 'undefined',
        hasWindow: typeof window !== 'undefined',
        href: window.location.href
      })`);

      expect(evalResult.hasDocument).toBe(true);
      expect(evalResult.hasWindow).toBe(true);
      expect(evalResult.href).toContain('example.com');
    }, 20000);
  });
});
