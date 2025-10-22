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
});
