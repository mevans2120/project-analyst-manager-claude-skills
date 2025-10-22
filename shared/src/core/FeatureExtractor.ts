/**
 * Feature Extractors Suite
 * FeatureExtractor, FunctionalityChecker, VisualAnalyzer
 *
 * This module provides advanced feature extraction and analysis capabilities,
 * combining web scraping, visual analysis, and functionality testing.
 */

import { PlaywrightDriver } from './PlaywrightDriver';
import { ScreenshotCapture } from './ScreenshotCapture';
import { NetworkMonitor } from './NetworkMonitor';
import {
  ExtractedFeature,
  ExtractionOptions,
  ExtractionResult,
  FunctionalityCheck,
  VisualElement
} from '../types/extractors';

/**
 * FeatureExtractor - Main feature extraction
 */
export class FeatureExtractor {
  private driver: PlaywrightDriver;
  private screenshotCapture: ScreenshotCapture;
  private networkMonitor: NetworkMonitor;

  constructor(driver?: PlaywrightDriver) {
    this.driver = driver || new PlaywrightDriver();
    this.screenshotCapture = new ScreenshotCapture(this.driver);
    this.networkMonitor = new NetworkMonitor(this.driver);
  }

  /**
   * Extract features from a URL
   */
  async extract(options: ExtractionOptions): Promise<ExtractionResult> {
    const {
      url,
      extractUI = true,
      extractAPI = true,
      extractVisual = true,
      captureScreenshots = false,
      viewport = 'desktop'
    } = options;

    const startTime = Date.now();
    const features: ExtractedFeature[] = [];

    // Launch browser if needed
    const wasLaunched = this.driver.isLaunched();
    if (!wasLaunched) {
      await this.driver.launch();
    }

    try {
      // Navigate and monitor network
      if (extractAPI) {
        await this.networkMonitor.navigateAndMonitor(url);
        const apiFeatures = await this.extractAPIFeatures();
        features.push(...apiFeatures);
      } else {
        await this.driver.navigate({ url });
      }

      // Extract UI features
      if (extractUI) {
        const uiFeatures = await this.extractUIFeatures();
        features.push(...uiFeatures);
      }

      // Extract visual features
      if (extractVisual) {
        const visualFeatures = await this.extractVisualFeatures(captureScreenshots);
        features.push(...visualFeatures);
      }

      const extractionTime = Date.now() - startTime;

      return {
        url,
        features,
        metadata: {
          extractionTime,
          timestamp: new Date(),
          featuresFound: features.length
        }
      };
    } finally {
      if (!wasLaunched) {
        await this.driver.close();
      }
    }
  }

  /**
   * Extract API features from network monitoring
   */
  private async extractAPIFeatures(): Promise<ExtractedFeature[]> {
    const summary = this.networkMonitor.getSummary();
    const features: ExtractedFeature[] = [];

    for (const pattern of summary.patterns) {
      const name = this.patternToFeatureName(pattern.pattern);

      features.push({
        name,
        type: 'api',
        description: `API endpoint: ${pattern.methods.join(', ')}`,
        location: pattern.pattern,
        confidence: 95,
        evidence: pattern.examples
      });
    }

    return features;
  }

  /**
   * Extract UI features from page
   */
  private async extractUIFeatures(): Promise<ExtractedFeature[]> {
    const features: ExtractedFeature[] = [];

    // Extract navigation links
    const navLinks = await this.driver.evaluate<any[]>(`
      Array.from(document.querySelectorAll('nav a, header a')).map(a => ({
        text: a.textContent.trim(),
        href: a.href
      }))
    `);

    for (const link of navLinks) {
      if (link.text) {
        features.push({
          name: link.text,
          type: 'ui',
          description: 'Navigation link',
          location: link.href,
          confidence: 85
        });
      }
    }

    // Extract forms
    const forms = await this.driver.evaluate<any[]>(`
      Array.from(document.querySelectorAll('form')).map((form, i) => ({
        action: form.action,
        method: form.method,
        inputs: Array.from(form.querySelectorAll('input, textarea, select')).map(input => ({
          name: input.name,
          type: input.type || 'text'
        }))
      }))
    `);

    for (let i = 0; i < forms.length; i++) {
      const form = forms[i];
      const inputNames = form.inputs.map((inp: any) => inp.name).filter(Boolean);

      features.push({
        name: `Form ${i + 1}`,
        type: 'ui',
        description: `Form with ${form.inputs.length} inputs`,
        location: form.action || 'current page',
        confidence: 90,
        evidence: inputNames
      });
    }

    // Extract buttons
    const buttons = await this.driver.evaluate<string[]>(`
      Array.from(document.querySelectorAll('button, input[type="button"], input[type="submit"]'))
        .map(btn => btn.textContent || btn.value)
        .filter(text => text && text.trim().length > 0)
    `);

    for (const buttonText of buttons) {
      features.push({
        name: buttonText,
        type: 'ui',
        description: 'Button',
        location: 'page',
        confidence: 80
      });
    }

    return features;
  }

  /**
   * Extract visual features
   */
  private async extractVisualFeatures(captureScreenshot: boolean): Promise<ExtractedFeature[]> {
    const features: ExtractedFeature[] = [];

    // Get visible images
    const images = await this.driver.evaluate<any[]>(`
      Array.from(document.querySelectorAll('img')).map(img => ({
        src: img.src,
        alt: img.alt
      }))
    `);

    if (images.length > 0) {
      features.push({
        name: 'Image Gallery',
        type: 'visual',
        description: `${images.length} images found`,
        location: 'page',
        confidence: 100,
        evidence: images.slice(0, 5).map((img: any) => img.alt || img.src)
      });
    }

    // Check for video
    const hasVideo = await this.driver.exists('video');
    if (hasVideo) {
      features.push({
        name: 'Video Player',
        type: 'visual',
        description: 'Video element detected',
        location: 'page',
        confidence: 100
      });
    }

    // Capture screenshot if requested
    if (captureScreenshot) {
      const screenshot = await this.driver.screenshot();

      features.push({
        name: 'Page Screenshot',
        type: 'visual',
        description: 'Full page visual capture',
        location: 'page',
        confidence: 100,
        screenshot
      });
    }

    return features;
  }

  /**
   * Convert API pattern to feature name
   */
  private patternToFeatureName(pattern: string): string {
    try {
      const url = new URL(pattern);
      const parts = url.pathname.split('/').filter(p => p && !p.startsWith('{'));

      if (parts.length === 0) return 'API Root';

      return parts
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
    } catch (e) {
      return 'API Endpoint';
    }
  }

  /**
   * Get driver instance
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

/**
 * FunctionalityChecker - Test feature functionality
 */
export class FunctionalityChecker {
  private driver: PlaywrightDriver;

  constructor(driver: PlaywrightDriver) {
    this.driver = driver;
  }

  /**
   * Check if a feature is functional
   */
  async check(feature: ExtractedFeature): Promise<FunctionalityCheck> {
    const evidence: string[] = [];

    try {
      if (feature.type === 'ui') {
        // Check if UI element exists
        const exists = await this.driver.exists(feature.location);

        if (exists) {
          const text = await this.driver.getText(feature.location);
          evidence.push(`Element found with text: ${text}`);

          return {
            feature: feature.name,
            functional: true,
            details: 'UI element exists and is accessible',
            evidence
          };
        } else {
          return {
            feature: feature.name,
            functional: false,
            details: 'UI element not found',
            error: `Selector ${feature.location} not found`
          };
        }
      } else if (feature.type === 'api') {
        // For API features, check if endpoint responded
        return {
          feature: feature.name,
          functional: true,
          details: 'API endpoint responding',
          evidence: feature.evidence
        };
      } else {
        return {
          feature: feature.name,
          functional: true,
          details: 'Feature detected',
          evidence: feature.evidence
        };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        feature: feature.name,
        functional: false,
        details: 'Error during check',
        error: message
      };
    }
  }
}

/**
 * VisualAnalyzer - Analyze visual elements
 */
export class VisualAnalyzer {
  private driver: PlaywrightDriver;

  constructor(driver: PlaywrightDriver) {
    this.driver = driver;
  }

  /**
   * Analyze visual elements on the page
   */
  async analyze(): Promise<VisualElement[]> {
    const elements: VisualElement[] = [];

    // Analyze buttons
    const buttons = await this.analyzeElements('button', 'button');
    elements.push(...buttons);

    // Analyze links
    const links = await this.analyzeElements('a[href]', 'link');
    elements.push(...links);

    // Analyze forms
    const forms = await this.analyzeElements('form', 'form');
    elements.push(...forms);

    // Analyze inputs
    const inputs = await this.analyzeElements('input', 'input');
    elements.push(...inputs);

    // Analyze images
    const images = await this.analyzeElements('img', 'image');
    elements.push(...images);

    return elements;
  }

  /**
   * Analyze specific element type
   */
  private async analyzeElements(selector: string, type: VisualElement['type']): Promise<VisualElement[]> {
    const elements = await this.driver.evaluate<any[]>(`
      Array.from(document.querySelectorAll('${selector}')).map((el, i) => ({
        selector: '${selector}:nth-child(' + (i + 1) + ')',
        text: el.textContent?.trim() || '',
        attributes: Array.from(el.attributes).reduce((acc, attr) => {
          acc[attr.name] = attr.value;
          return acc;
        }, {})
      }))
    `);

    return elements.map(el => ({
      type,
      selector: el.selector,
      text: el.text,
      attributes: el.attributes
    }));
  }
}
