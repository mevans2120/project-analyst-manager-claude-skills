/**
 * Web Discovery - Discover features by analyzing live websites
 * PM-8: Web-Based Feature Discovery
 *
 * Uses shared web libraries to:
 * - Crawl competitor websites
 * - Extract features from UI/navigation
 * - Analyze functionality
 * - Auto-populate feature registry
 */

import { PlaywrightDriver } from '../../../shared/src/core/PlaywrightDriver';
import { FeatureExtractor } from '../../../shared/src/core/FeatureExtractor';
import { NetworkMonitor } from '../../../shared/src/core/NetworkMonitor';
import { ScreenshotCapture } from '../../../shared/src/core/ScreenshotCapture';
import type { Feature } from '../types';
import type { WebDiscoveryOptions, DiscoveredFeature } from '../types/discovery';

export interface WebDiscoveryResult {
  url: string;
  discoveredFeatures: DiscoveredFeature[];
  screenshots: string[];
  apiEndpoints: string[];
  timestamp: string;
}

export class WebDiscovery {
  private driver: PlaywrightDriver;
  private extractor: FeatureExtractor;
  private networkMonitor: NetworkMonitor;
  private screenshotCapture: ScreenshotCapture;

  constructor() {
    this.driver = new PlaywrightDriver({
      headless: true,
      browser: 'chromium'
    });
    this.extractor = new FeatureExtractor();
    this.networkMonitor = new NetworkMonitor(this.driver);
    this.screenshotCapture = new ScreenshotCapture(this.driver);
  }

  /**
   * Discover features from a website
   */
  async discover(url: string, options: WebDiscoveryOptions = {}): Promise<WebDiscoveryResult> {
    try {
      await this.driver.launch();

      // Start network monitoring
      await this.networkMonitor.startMonitoring();

      // Navigate to URL
      await this.driver.navigateTo(url);

      // Wait for page to load
      if (options.waitForSelector) {
        await this.driver.waitFor(options.waitForSelector);
      } else {
        await this.driver.page.waitForLoadState('networkidle');
      }

      // Handle authentication if needed
      if (options.auth) {
        await this.handleAuthentication(options.auth);
      }

      // Extract features from page
      const features = await this.extractFeatures(url, options);

      // Capture screenshots
      const screenshots: string[] = [];
      if (options.captureScreenshots) {
        const screenshotPath = options.screenshotDir || './screenshots';
        const mainScreenshot = await this.screenshotCapture.captureFullPage(
          `${screenshotPath}/${this.sanitizeFilename(url)}-main.png`
        );
        screenshots.push(mainScreenshot);

        // Capture different viewports if requested
        if (options.multiViewport) {
          const viewports = [
            { width: 375, height: 667, name: 'mobile' },
            { width: 768, height: 1024, name: 'tablet' },
            { width: 1920, height: 1080, name: 'desktop' }
          ];

          for (const viewport of viewports) {
            await this.driver.page.setViewportSize({ width: viewport.width, height: viewport.height });
            const path = `${screenshotPath}/${this.sanitizeFilename(url)}-${viewport.name}.png`;
            const screenshot = await this.screenshotCapture.captureFullPage(path);
            screenshots.push(screenshot);
          }
        }
      }

      // Get discovered API endpoints
      const networkData = this.networkMonitor.getRequestLog();
      const apiEndpoints = Array.from(new Set(
        networkData
          .filter(req => req.url.includes('/api/') || req.url.includes('.json'))
          .map(req => req.url)
      ));

      return {
        url,
        discoveredFeatures: features,
        screenshots,
        apiEndpoints,
        timestamp: new Date().toISOString()
      };

    } finally {
      await this.networkMonitor.stopMonitoring();
      await this.driver.close();
    }
  }

  /**
   * Discover features from multiple pages/sections
   */
  async discoverMultiple(
    urls: string[],
    options: WebDiscoveryOptions = {}
  ): Promise<WebDiscoveryResult[]> {
    const results: WebDiscoveryResult[] = [];

    for (const url of urls) {
      try {
        const result = await this.discover(url, options);
        results.push(result);
      } catch (error) {
        console.error(`Failed to discover features from ${url}:`, error);
      }
    }

    return results;
  }

  /**
   * Extract features from current page
   */
  private async extractFeatures(
    url: string,
    options: WebDiscoveryOptions
  ): Promise<DiscoveredFeature[]> {
    const features: DiscoveredFeature[] = [];

    // Extract from navigation menu
    const navFeatures = await this.extractFromNavigation();
    features.push(...navFeatures);

    // Extract from page content
    const contentFeatures = await this.extractFromContent();
    features.push(...contentFeatures);

    // Extract from interactive elements
    const interactiveFeatures = await this.extractFromInteractiveElements();
    features.push(...interactiveFeatures);

    // Use AI to analyze page if enabled
    if (options.useAI) {
      const aiFeatures = await this.extractWithAI();
      features.push(...aiFeatures);
    }

    // Deduplicate features
    return this.deduplicateFeatures(features);
  }

  /**
   * Extract features from navigation menu
   */
  private async extractFromNavigation(): Promise<DiscoveredFeature[]> {
    const features: DiscoveredFeature[] = [];

    try {
      // Find all navigation links
      const navLinks = await this.driver.page.$$eval(
        'nav a, header a, [role="navigation"] a',
        (links) => links.map(link => ({
          text: link.textContent?.trim() || '',
          href: link.getAttribute('href') || '',
          ariaLabel: link.getAttribute('aria-label') || ''
        }))
      );

      for (const link of navLinks) {
        if (link.text && link.text.length > 2 && link.text.length < 50) {
          features.push({
            name: link.text,
            description: link.ariaLabel || `Navigate to ${link.text}`,
            category: 'Navigation',
            source: 'menu',
            confidence: 0.8,
            url: link.href
          });
        }
      }
    } catch (error) {
      console.warn('Failed to extract navigation features:', error);
    }

    return features;
  }

  /**
   * Extract features from page content
   */
  private async extractFromContent(): Promise<DiscoveredFeature[]> {
    const features: DiscoveredFeature[] = [];

    try {
      // Find headings that describe features
      const headings = await this.driver.page.$$eval(
        'h1, h2, h3, h4',
        (elements) => elements.map(el => ({
          text: el.textContent?.trim() || '',
          level: el.tagName.toLowerCase()
        }))
      );

      for (const heading of headings) {
        if (heading.text && heading.text.length > 5 && heading.text.length < 100) {
          // Filter out common non-feature headings
          const skipWords = ['about', 'contact', 'welcome', 'home', 'login', 'sign up'];
          const isSkip = skipWords.some(word =>
            heading.text.toLowerCase().includes(word)
          );

          if (!isSkip) {
            features.push({
              name: heading.text,
              description: `Feature section: ${heading.text}`,
              category: 'Content',
              source: heading.level,
              confidence: 0.6
            });
          }
        }
      }

      // Find cards/sections with descriptions
      const sections = await this.driver.page.$$eval(
        '[class*="feature"], [class*="card"], [class*="section"]',
        (elements) => elements.slice(0, 20).map(el => ({
          title: el.querySelector('h1, h2, h3, h4, h5, h6')?.textContent?.trim() || '',
          description: el.querySelector('p')?.textContent?.trim() || ''
        }))
      );

      for (const section of sections) {
        if (section.title && section.description) {
          features.push({
            name: section.title,
            description: section.description,
            category: 'Feature',
            source: 'section',
            confidence: 0.75
          });
        }
      }
    } catch (error) {
      console.warn('Failed to extract content features:', error);
    }

    return features;
  }

  /**
   * Extract features from interactive elements
   */
  private async extractFromInteractiveElements(): Promise<DiscoveredFeature[]> {
    const features: DiscoveredFeature[] = [];

    try {
      // Find buttons that might represent features
      const buttons = await this.driver.page.$$eval(
        'button, [role="button"], input[type="submit"]',
        (elements) => elements.map(el => ({
          text: el.textContent?.trim() || (el as HTMLInputElement).value || '',
          ariaLabel: el.getAttribute('aria-label') || ''
        }))
      );

      for (const button of buttons) {
        const text = button.text || button.ariaLabel;
        if (text && text.length > 3 && text.length < 50) {
          // Filter out common non-feature buttons
          const skipWords = ['submit', 'cancel', 'close', 'ok', 'yes', 'no'];
          const isSkip = skipWords.some(word =>
            text.toLowerCase() === word.toLowerCase()
          );

          if (!isSkip) {
            features.push({
              name: text,
              description: `Interactive action: ${text}`,
              category: 'Action',
              source: 'button',
              confidence: 0.7
            });
          }
        }
      }

      // Find forms
      const forms = await this.driver.page.$$eval(
        'form',
        (elements) => elements.map(form => ({
          action: form.getAttribute('action') || '',
          inputs: Array.from(form.querySelectorAll('input')).map(input => ({
            name: input.name,
            type: input.type,
            placeholder: input.placeholder
          }))
        }))
      );

      for (const form of forms) {
        if (form.inputs.length > 0) {
          const inputNames = form.inputs.map(i => i.name).filter(Boolean).join(', ');
          features.push({
            name: `Form: ${form.action || 'Data Entry'}`,
            description: `Form with fields: ${inputNames}`,
            category: 'Form',
            source: 'form',
            confidence: 0.8
          });
        }
      }
    } catch (error) {
      console.warn('Failed to extract interactive features:', error);
    }

    return features;
  }

  /**
   * Extract features using AI analysis
   */
  private async extractWithAI(): Promise<DiscoveredFeature[]> {
    const features: DiscoveredFeature[] = [];

    try {
      // Get page content
      const pageContent = await this.driver.page.content();

      // Use FeatureExtractor from shared library
      const extracted = await this.extractor.extractFromHTML(pageContent);

      for (const feature of extracted) {
        features.push({
          name: feature.name,
          description: feature.description,
          category: 'AI-Discovered',
          source: 'ai',
          confidence: 0.85
        });
      }
    } catch (error) {
      console.warn('Failed to extract AI features:', error);
    }

    return features;
  }

  /**
   * Handle authentication
   */
  private async handleAuthentication(auth: {
    username: string;
    password: string;
    loginUrl?: string;
  }): Promise<void> {
    if (auth.loginUrl) {
      await this.driver.navigateTo(auth.loginUrl);
    }

    // Try common login form selectors
    const selectors = {
      username: ['input[name="username"]', 'input[name="email"]', 'input[type="email"]', '#username', '#email'],
      password: ['input[name="password"]', 'input[type="password"]', '#password'],
      submit: ['button[type="submit"]', 'input[type="submit"]', 'button:has-text("login")', 'button:has-text("sign in")']
    };

    // Fill username
    for (const selector of selectors.username) {
      try {
        await this.driver.page.fill(selector, auth.username, { timeout: 1000 });
        break;
      } catch {
        continue;
      }
    }

    // Fill password
    for (const selector of selectors.password) {
      try {
        await this.driver.page.fill(selector, auth.password, { timeout: 1000 });
        break;
      } catch {
        continue;
      }
    }

    // Click submit
    for (const selector of selectors.submit) {
      try {
        await this.driver.page.click(selector, { timeout: 1000 });
        await this.driver.page.waitForLoadState('networkidle');
        break;
      } catch {
        continue;
      }
    }
  }

  /**
   * Deduplicate features
   */
  private deduplicateFeatures(features: DiscoveredFeature[]): DiscoveredFeature[] {
    const seen = new Map<string, DiscoveredFeature>();

    for (const feature of features) {
      const key = feature.name.toLowerCase().trim();

      if (!seen.has(key)) {
        seen.set(key, feature);
      } else {
        // Keep the one with higher confidence
        const existing = seen.get(key)!;
        if (feature.confidence > existing.confidence) {
          seen.set(key, feature);
        }
      }
    }

    return Array.from(seen.values());
  }

  /**
   * Sanitize filename
   */
  private sanitizeFilename(url: string): string {
    return url
      .replace(/^https?:\/\//, '')
      .replace(/[^a-z0-9]/gi, '-')
      .replace(/-+/g, '-')
      .substring(0, 100);
  }

  /**
   * Convert discovered features to Feature format for registry
   */
  convertToFeatures(
    discovered: DiscoveredFeature[],
    options: {
      projectCode: string;
      startingNumber: number;
      phase: string;
      priority: 'P0' | 'P1' | 'P2' | 'P3';
    }
  ): Feature[] {
    return discovered.map((d, index) => ({
      id: `${options.projectCode.toLowerCase()}-${d.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      number: options.startingNumber + index,
      name: d.name,
      description: d.description,
      category: d.category,
      phase: options.phase,
      priority: options.priority,
      status: 'planned',
      dependencies: [],
      blocks: [],
      value: `Discovered from ${d.source} with ${Math.round(d.confidence * 100)}% confidence`
    }));
  }
}
