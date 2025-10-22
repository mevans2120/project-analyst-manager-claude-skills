/**
 * Tests for ScreenshotCapture
 */

import { ScreenshotCapture } from '../src/core/ScreenshotCapture';
import { PlaywrightDriver } from '../src/core/PlaywrightDriver';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('ScreenshotCapture', () => {
  let capture: ScreenshotCapture;
  let driver: PlaywrightDriver;
  const testOutputDir = './test-screenshots';

  beforeEach(() => {
    driver = new PlaywrightDriver({ headless: true });
    capture = new ScreenshotCapture(driver);
  });

  afterEach(async () => {
    if (driver.isLaunched()) {
      await driver.close();
    }

    // Clean up test screenshots
    try {
      await fs.rm(testOutputDir, { recursive: true, force: true });
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  describe('initialization', () => {
    it('should create instance with provided driver', () => {
      expect(capture).toBeInstanceOf(ScreenshotCapture);
      expect(capture.getDriver()).toBe(driver);
    });

    it('should create instance with default driver if none provided', () => {
      const defaultCapture = new ScreenshotCapture();
      expect(defaultCapture).toBeInstanceOf(ScreenshotCapture);
      expect(defaultCapture.getDriver()).toBeInstanceOf(PlaywrightDriver);
    });
  });

  describe('capture - multi-viewport screenshots', () => {
    it('should capture screenshots for multiple viewports', async () => {
      const result = await capture.capture({
        url: 'https://example.com',
        viewports: ['mobile', 'tablet', 'desktop']
      });

      expect(result.url).toBe('https://example.com');
      expect(result.screenshots).toHaveLength(3);
      expect(result.title).toBe('Example Domain');
      expect(result.metadata.totalScreenshots).toBe(3);
      expect(result.metadata.captureTime).toBeGreaterThan(0);

      // Check viewport presets
      expect(result.screenshots[0].presetName).toBe('mobile');
      expect(result.screenshots[1].presetName).toBe('tablet');
      expect(result.screenshots[2].presetName).toBe('desktop');
    }, 30000);

    it('should capture full page screenshots by default', async () => {
      const result = await capture.capture({
        url: 'https://example.com'
      });

      const screenshot = result.screenshots[0];
      expect(screenshot.buffer).toBeInstanceOf(Buffer);
      expect(screenshot.buffer.length).toBeGreaterThan(0);

      // Full page should be taller than viewport
      expect(screenshot.dimensions.height).toBeGreaterThan(screenshot.viewport.height);
    }, 20000);

    it('should capture viewport-only screenshots when fullPage is false', async () => {
      const result = await capture.capture({
        url: 'https://example.com',
        viewports: ['desktop'],
        fullPage: false
      });

      const screenshot = result.screenshots[0];
      expect(screenshot.dimensions.height).toBe(screenshot.viewport.height);
    }, 20000);

    it('should wait for selector if specified', async () => {
      const result = await capture.capture({
        url: 'https://example.com',
        viewports: ['desktop'],
        waitForSelector: 'h1'
      });

      expect(result.screenshots).toHaveLength(1);
      expect(result.screenshots[0].buffer.length).toBeGreaterThan(0);
    }, 20000);

    it('should support custom viewport dimensions', async () => {
      const customViewport = { width: 800, height: 600 };

      const result = await capture.capture({
        url: 'https://example.com',
        viewports: [customViewport]
      });

      expect(result.screenshots[0].viewport).toEqual(customViewport);
      expect(result.screenshots[0].dimensions.width).toBe(800);
    }, 20000);
  });

  describe('captureSingle', () => {
    it('should capture a single screenshot with default viewport', async () => {
      const screenshot = await capture.captureSingle('https://example.com');

      expect(screenshot).toBeDefined();
      expect(screenshot.buffer).toBeInstanceOf(Buffer);
      expect(screenshot.viewport.width).toBe(1920); // desktop preset
      expect(screenshot.viewport.height).toBe(1080);
    }, 20000);

    it('should capture a single screenshot with custom viewport', async () => {
      const screenshot = await capture.captureSingle('https://example.com', 'mobile');

      expect(screenshot.presetName).toBe('mobile');
      expect(screenshot.viewport.width).toBe(375);
    }, 20000);
  });

  describe('captureScrollSequence', () => {
    it('should capture multiple screenshots at different scroll positions', async () => {
      const screenshots = await capture.captureScrollSequence(
        'https://example.com',
        'desktop',
        3
      );

      expect(screenshots).toHaveLength(3);

      for (const screenshot of screenshots) {
        expect(screenshot.buffer).toBeInstanceOf(Buffer);
        expect(screenshot.buffer.length).toBeGreaterThan(0);
      }
    }, 25000);

    it('should use default viewport if not specified', async () => {
      const screenshots = await capture.captureScrollSequence('https://example.com');

      expect(screenshots.length).toBeGreaterThan(0);
      expect(screenshots[0].viewport.width).toBe(1920); // desktop
    }, 25000);
  });

  describe('compare', () => {
    it('should detect identical screenshots', async () => {
      const screenshot1 = await capture.captureSingle('https://example.com');
      const screenshot2 = screenshot1; // Same screenshot

      const result = await capture.compare({
        screenshot1: screenshot1.buffer,
        screenshot2: screenshot2.buffer
      });

      expect(result.identical).toBe(true);
      expect(result.differencePercentage).toBe(0);
    }, 20000);

    it('should detect different screenshots', async () => {
      await driver.launch();

      await driver.navigate({ url: 'https://example.com' });
      const screenshot1 = await driver.screenshot();

      await driver.navigate({ url: 'https://www.iana.org' });
      const screenshot2 = await driver.screenshot();

      const result = await capture.compare({
        screenshot1,
        screenshot2
      });

      expect(result.identical).toBe(false);
      expect(result.differencePercentage).toBeGreaterThan(0);
    }, 25000);

    it('should respect threshold parameter', async () => {
      await driver.launch();

      await driver.navigate({ url: 'https://example.com' });
      const screenshot1 = await driver.screenshot();
      const screenshot2 = await driver.screenshot(); // Essentially identical

      const strictResult = await capture.compare({
        screenshot1,
        screenshot2,
        threshold: 0.001 // Very strict
      });

      const lenientResult = await capture.compare({
        screenshot1,
        screenshot2,
        threshold: 1.0 // Very lenient
      });

      expect(lenientResult.identical).toBe(true);
    }, 25000);
  });

  describe('file operations', () => {
    it('should save screenshot to file', async () => {
      const screenshot = await capture.captureSingle('https://example.com');
      const filepath = path.join(testOutputDir, 'test-screenshot.png');

      // Ensure directory exists
      await fs.mkdir(testOutputDir, { recursive: true });

      await capture.saveToFile(screenshot, filepath);

      const stats = await fs.stat(filepath);
      expect(stats.size).toBeGreaterThan(0);

      const buffer = await fs.readFile(filepath);
      expect(buffer).toEqual(screenshot.buffer);
    }, 20000);

    it('should save all screenshots from capture result', async () => {
      const result = await capture.capture({
        url: 'https://example.com',
        viewports: ['mobile', 'tablet', 'desktop']
      });

      const filepaths = await capture.saveAll(result, testOutputDir, 'example');

      expect(filepaths).toHaveLength(3);

      for (const filepath of filepaths) {
        const stats = await fs.stat(filepath);
        expect(stats.size).toBeGreaterThan(0);
      }

      // Check filenames contain viewport names
      expect(filepaths[0]).toContain('mobile');
      expect(filepaths[1]).toContain('tablet');
      expect(filepaths[2]).toContain('desktop');
    }, 30000);

    it('should create output directory if it does not exist', async () => {
      const result = await capture.capture({
        url: 'https://example.com',
        viewports: ['desktop']
      });

      const nonExistentDir = path.join(testOutputDir, 'nested', 'deep');
      const filepaths = await capture.saveAll(result, nonExistentDir);

      expect(filepaths).toHaveLength(1);

      const stats = await fs.stat(nonExistentDir);
      expect(stats.isDirectory()).toBe(true);
    }, 20000);
  });

  describe('browser lifecycle', () => {
    it('should launch browser if not already launched', async () => {
      expect(driver.isLaunched()).toBe(false);

      await capture.captureSingle('https://example.com');

      // Driver should be closed after capture
      expect(driver.isLaunched()).toBe(false);
    }, 20000);

    it('should not close browser if it was already launched', async () => {
      await driver.launch();
      expect(driver.isLaunched()).toBe(true);

      await capture.captureSingle('https://example.com');

      // Driver should still be launched
      expect(driver.isLaunched()).toBe(true);
    }, 20000);

    it('should close browser when close() is called', async () => {
      await driver.launch();
      expect(driver.isLaunched()).toBe(true);

      await capture.close();
      expect(driver.isLaunched()).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle invalid URL gracefully', async () => {
      await expect(
        capture.capture({ url: 'not-a-valid-url' })
      ).rejects.toThrow();
    }, 15000);

    it('should handle network errors', async () => {
      await expect(
        capture.capture({ url: 'https://this-domain-definitely-does-not-exist-12345.com' })
      ).rejects.toThrow();
    }, 15000);
  });
});
