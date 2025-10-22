/**
 * ScreenshotCapture - Multi-viewport Screenshots
 * Screenshot management and visual documentation for all skills
 *
 * This module provides multi-viewport screenshot capabilities,
 * enabling visual testing, documentation, and regression detection.
 */

import { PlaywrightDriver } from './PlaywrightDriver';
import {
  ViewportPreset,
  Viewport,
  VIEWPORT_PRESETS,
  CaptureOptions,
  Screenshot,
  CaptureResult,
  ComparisonOptions,
  ComparisonResult
} from '../types/screenshot';

export class ScreenshotCapture {
  private driver: PlaywrightDriver;

  constructor(driver?: PlaywrightDriver) {
    this.driver = driver || new PlaywrightDriver();
  }

  /**
   * Capture screenshots across multiple viewports
   */
  async capture(options: CaptureOptions): Promise<CaptureResult> {
    const {
      url,
      viewports = ['mobile', 'tablet', 'desktop'],
      fullPage = true,
      waitForSelector,
      waitTime = 0,
      quality,
      type = 'png'
    } = options;

    const screenshots: Screenshot[] = [];
    const startTime = Date.now();
    let title = '';

    // Launch browser if not already launched
    const wasLaunched = this.driver.isLaunched();
    if (!wasLaunched) {
      await this.driver.launch();
    }

    try {
      for (const viewport of viewports) {
        // Get viewport config
        const viewportConfig = typeof viewport === 'string'
          ? VIEWPORT_PRESETS[viewport]
          : viewport;

        const presetName = typeof viewport === 'string' ? viewport : undefined;

        // Navigate with this viewport
        await this.driver.navigate({ url });

        // Wait for selector if specified
        if (waitForSelector) {
          await this.driver.waitFor({ selector: waitForSelector });
        }

        // Additional wait time
        if (waitTime > 0) {
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }

        // Get page title (once)
        if (!title) {
          const content = await this.driver.getContent();
          title = content.title;
        }

        // Capture screenshot
        const buffer = await this.driver.screenshot({
          fullPage,
          type,
          quality
        });

        // Get actual dimensions from buffer (simplified - just use viewport dimensions)
        const dimensions = {
          width: viewportConfig.width,
          height: fullPage ? viewportConfig.height * 3 : viewportConfig.height
        };

        screenshots.push({
          viewport: viewportConfig,
          buffer,
          dimensions,
          timestamp: new Date(),
          presetName
        });
      }

      const captureTime = Date.now() - startTime;

      return {
        url,
        screenshots,
        title,
        metadata: {
          totalScreenshots: screenshots.length,
          captureTime,
          timestamp: new Date()
        }
      };
    } finally {
      // Close browser if we launched it
      if (!wasLaunched) {
        await this.driver.close();
      }
    }
  }

  /**
   * Capture a single screenshot
   */
  async captureSingle(
    url: string,
    viewport: ViewportPreset | Viewport = 'desktop'
  ): Promise<Screenshot> {
    const result = await this.capture({
      url,
      viewports: [viewport]
    });

    return result.screenshots[0];
  }

  /**
   * Capture screenshots at different scroll positions
   */
  async captureScrollSequence(
    url: string,
    viewport: ViewportPreset | Viewport = 'desktop',
    scrollSteps: number = 3
  ): Promise<Screenshot[]> {
    const viewportConfig = typeof viewport === 'string'
      ? VIEWPORT_PRESETS[viewport]
      : viewport;

    const screenshots: Screenshot[] = [];

    // Launch browser if not already launched
    const wasLaunched = this.driver.isLaunched();
    if (!wasLaunched) {
      await this.driver.launch();
    }

    try {
      await this.driver.navigate({ url });

      // Get page height
      const pageHeight = await this.driver.evaluate<number>(
        'document.documentElement.scrollHeight'
      );

      const scrollHeight = pageHeight / scrollSteps;

      for (let i = 0; i < scrollSteps; i++) {
        // Scroll to position
        await this.driver.evaluate(
          `window.scrollTo(0, ${i * scrollHeight})`
        );

        // Wait for scroll to complete
        await new Promise(resolve => setTimeout(resolve, 500));

        // Capture screenshot
        const buffer = await this.driver.screenshot({
          fullPage: false,
          type: 'png'
        });

        screenshots.push({
          viewport: viewportConfig,
          buffer,
          dimensions: {
            width: viewportConfig.width,
            height: viewportConfig.height
          },
          timestamp: new Date()
        });
      }

      return screenshots;
    } finally {
      if (!wasLaunched) {
        await this.driver.close();
      }
    }
  }

  /**
   * Compare two screenshots
   * Note: This is a basic implementation. For production, use pixelmatch or similar.
   */
  async compare(options: ComparisonOptions): Promise<ComparisonResult> {
    const { screenshot1, screenshot2, threshold = 0.1 } = options;

    // Basic buffer comparison
    const identical = screenshot1.equals(screenshot2);

    if (identical) {
      return {
        identical: true,
        differencePercentage: 0
      };
    }

    // Calculate simple difference
    let differentBytes = 0;
    const minLength = Math.min(screenshot1.length, screenshot2.length);

    for (let i = 0; i < minLength; i++) {
      if (screenshot1[i] !== screenshot2[i]) {
        differentBytes++;
      }
    }

    const differencePercentage = (differentBytes / minLength) * 100;
    const isIdentical = differencePercentage < (threshold * 100);

    return {
      identical: isIdentical,
      differencePercentage
    };
  }

  /**
   * Save screenshot to file
   */
  async saveToFile(screenshot: Screenshot, filepath: string): Promise<void> {
    const fs = await import('fs/promises');
    await fs.writeFile(filepath, screenshot.buffer);
  }

  /**
   * Save all screenshots from a capture result
   */
  async saveAll(
    result: CaptureResult,
    directory: string,
    prefix: string = 'screenshot'
  ): Promise<string[]> {
    const fs = await import('fs/promises');
    const path = await import('path');

    // Ensure directory exists
    await fs.mkdir(directory, { recursive: true });

    const filepaths: string[] = [];

    for (let i = 0; i < result.screenshots.length; i++) {
      const screenshot = result.screenshots[i];
      const viewportName = screenshot.presetName || `${screenshot.viewport.width}x${screenshot.viewport.height}`;
      const filename = `${prefix}-${viewportName}-${i}.png`;
      const filepath = path.join(directory, filename);

      await this.saveToFile(screenshot, filepath);
      filepaths.push(filepath);
    }

    return filepaths;
  }

  /**
   * Get the PlaywrightDriver instance
   */
  getDriver(): PlaywrightDriver {
    return this.driver;
  }

  /**
   * Close and cleanup
   */
  async close(): Promise<void> {
    if (this.driver.isLaunched()) {
      await this.driver.close();
    }
  }
}
