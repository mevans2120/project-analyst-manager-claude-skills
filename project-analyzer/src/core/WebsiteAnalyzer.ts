/**
 * Website Analyzer
 * Analyzes live websites to extract feature lists
 * Uses shared web viewing libraries (PlaywrightDriver, FeatureExtractor, NetworkMonitor)
 */

import * as path from 'path';
import {
  ExtractedFeature,
  FeatureAnalysisResult,
  WebsiteAnalysisOptions,
  DesignContext,
  DetailedAnalysisResult
} from '../types/features';

// Import shared libraries
import { PlaywrightDriver, FeatureExtractor, NetworkMonitor, ScreenshotCapture } from '@project-suite/shared';
import { createHash } from 'crypto';

export class WebsiteAnalyzer {
  private options: WebsiteAnalysisOptions;
  private context?: DesignContext;
  private driver?: PlaywrightDriver;

  constructor(options: WebsiteAnalysisOptions, context?: DesignContext) {
    this.options = {
      crawlDepth: 0,
      captureScreenshots: true,
      analyzeInteractions: true,
      analyzeAPIs: false,
      includeLowConfidence: false,
      ...options
    };
    this.context = context;
  }

  /**
   * Analyze all configured website URLs
   */
  async analyze(): Promise<DetailedAnalysisResult> {
    const startTime = performance.now();
    const features: ExtractedFeature[] = [];
    const analyzedSources: string[] = [];
    const warnings: string[] = [];

    // Initialize Playwright driver
    this.driver = new PlaywrightDriver({
      headless: true,
      viewport: { width: 1920, height: 1080 }
    });

    try {
      await this.driver.launch();

      // Analyze each URL
      for (const url of this.options.urls) {
        try {
          const urlFeatures = await this.analyzeURL(url);
          features.push(...urlFeatures);
          analyzedSources.push(url);
        } catch (error) {
          warnings.push(`Failed to analyze ${url}: ${error}`);
        }
      }
    } finally {
      // Always close the driver
      if (this.driver) {
        await this.driver.close();
      }
    }

    // Filter low confidence if needed
    const filteredFeatures = this.options.includeLowConfidence
      ? features
      : features.filter(f => f.confidence >= 70);

    // Deduplicate features
    const uniqueFeatures = this.deduplicateFeatures(filteredFeatures);

    // Calculate summary
    const summary = this.calculateSummary(uniqueFeatures);

    const duration = performance.now() - startTime;

    const result: DetailedAnalysisResult = {
      features: uniqueFeatures,
      summary,
      metadata: {
        analyzedSources,
        analysisDate: new Date().toISOString(),
        analysisDuration: Math.round(duration),
        tool: 'WebsiteAnalyzer',
        version: '1.0.0'
      },
      warnings: warnings.length > 0 ? warnings : undefined,
      recommendations: this.generateRecommendations(uniqueFeatures)
    };

    return result;
  }

  /**
   * Analyze a single URL
   */
  private async analyzeURL(url: string): Promise<ExtractedFeature[]> {
    if (!this.driver) {
      throw new Error('Driver not initialized');
    }

    const features: ExtractedFeature[] = [];

    // Navigate to URL
    await this.driver.navigate({ url, waitUntil: 'networkidle' });

    // Initialize feature extractor
    const extractor = new FeatureExtractor(this.driver);

    // Extract UI features
    const extractionResult = await extractor.extract({
      url,
      extractUI: true,
      extractAPI: false,
      extractVisual: false
    });
    features.push(...this.convertExtractedFeatures(extractionResult.features, url));

    // Analyze interactions if enabled
    if (this.options.analyzeInteractions) {
      const interactions = await this.analyzeInteractiveElements(url);
      features.push(...interactions);
    }

    // Analyze API calls if enabled
    if (this.options.analyzeAPIs) {
      const apiFeatures = await this.analyzeAPICalls(url);
      features.push(...apiFeatures);
    }

    // Capture screenshot if enabled
    if (this.options.captureScreenshots) {
      await this.capturePageScreenshot(url);
    }

    // Crawl linked pages if depth > 0
    if (this.options.crawlDepth && this.options.crawlDepth > 0) {
      const linkedFeatures = await this.crawlLinkedPages(url, this.options.crawlDepth);
      features.push(...linkedFeatures);
    }

    return features;
  }

  /**
   * Convert features from FeatureExtractor to ExtractedFeature format
   */
  private convertExtractedFeatures(extractedFeatures: any[], url: string): ExtractedFeature[] {
    return extractedFeatures.map((feature: any) => {
      const id = this.generateFeatureId(feature.name, url);

      return {
        id,
        name: feature.name,
        description: feature.description || `Feature: ${feature.name}`,
        category: this.mapUICategory(feature.type),
        source: 'website',
        sourcePath: url,
        priority: 'medium',
        status: 'identified',
        confidence: feature.confidence || 80,
        location: {
          url,
          selector: feature.location
        },
        tags: [],
        extractedAt: new Date().toISOString()
      };
    });
  }

  /**
   * Analyze interactive elements
   */
  private async analyzeInteractiveElements(url: string): Promise<ExtractedFeature[]> {
    if (!this.driver) return [];

    const features: ExtractedFeature[] = [];

    // Find all interactive elements
    const interactiveSelectors = [
      'button',
      'a[href]',
      'input',
      'select',
      'textarea',
      '[onclick]',
      '[role="button"]',
      '[role="link"]'
    ];

    for (const selector of interactiveSelectors) {
      const page = this.driver.getPage();
      if (!page) continue;

      const elements = await page.$$(selector);

      for (const element of elements) {
        const text = await element.textContent();
        const tagName = await element.evaluate(el => el.tagName.toLowerCase());
        const ariaLabel = await element.getAttribute('aria-label');

        const name = ariaLabel || text?.trim() || `${tagName} element`;

        if (name && name.length > 0 && name !== tagName) {
          const id = this.generateFeatureId(name, url);

          features.push({
            id,
            name,
            description: `Interactive ${tagName}: ${name}`,
            category: this.mapInteractiveCategory(tagName),
            source: 'website',
            sourcePath: url,
            priority: 'medium',
            status: 'identified',
            confidence: 75,
            location: { url, selector },
            tags: ['interactive', tagName],
            extractedAt: new Date().toISOString()
          });
        }
      }
    }

    return features;
  }

  /**
   * Analyze API calls using NetworkMonitor
   */
  private async analyzeAPICalls(url: string): Promise<ExtractedFeature[]> {
    if (!this.driver) return [];

    const page = this.driver.getPage();
    if (!page) return [];

    const monitor = new NetworkMonitor(this.driver);
    await monitor.startMonitoring();

    // Trigger some interactions to capture API calls
    await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');

    await page.waitForTimeout(2000);
    const endpoints = monitor.getAllEndpoints();

    const features: ExtractedFeature[] = [];

    for (const endpoint of endpoints) {
      const method = endpoint.method || 'GET';
      const urlPath = new URL(endpoint.url).pathname;
      const name = `API: ${method} ${urlPath}`;

      const id = this.generateFeatureId(name, url);

      features.push({
        id,
        name,
        description: `API endpoint: ${method} ${endpoint.url}`,
        category: 'Action',
        source: 'website',
        sourcePath: url,
        priority: 'medium',
        status: 'identified',
        confidence: 90,
        location: { url },
        tags: ['api', method.toLowerCase()],
        notes: `Response: ${endpoint.statusCode}`,
        extractedAt: new Date().toISOString()
      });
    }

    return features;
  }

  /**
   * Capture page screenshot
   */
  private async capturePageScreenshot(url: string): Promise<void> {
    if (!this.driver) return;

    const filename = this.sanitizeFilename(url);
    await this.driver.screenshot({
      path: `screenshots/${filename}.png`,
      fullPage: true
    });
  }

  /**
   * Crawl linked pages
   */
  private async crawlLinkedPages(baseUrl: string, depth: number): Promise<ExtractedFeature[]> {
    // Simplified crawling - just identify linked pages as features
    if (!this.driver || depth <= 0) return [];

    const page = this.driver.getPage();
    if (!page) return [];

    const links = await page.$$eval('a[href]', (anchors) =>
      anchors.map(a => ({
        href: (a as any).href,
        text: a.textContent?.trim() || ''
      }))
    );

    const features: ExtractedFeature[] = [];

    for (const link of links) {
      if (link.href.startsWith(baseUrl) && link.text) {
        const id = this.generateFeatureId(link.text, link.href);

        features.push({
          id,
          name: link.text,
          description: `Page: ${link.text}`,
          category: 'Page',
          source: 'website',
          sourcePath: baseUrl,
          priority: 'low',
          status: 'identified',
          confidence: 70,
          location: { url: link.href },
          tags: ['page', 'linked'],
          extractedAt: new Date().toISOString()
        });
      }
    }

    return features;
  }

  /**
   * Map UI type to category
   */
  private mapUICategory(type: string): any {
    const categoryMap: Record<string, any> = {
      navigation: 'Navigation',
      form: 'Form',
      button: 'Action',
      table: 'Data Display',
      card: 'UI Component',
      modal: 'UI Component',
      header: 'Layout',
      footer: 'Layout',
      sidebar: 'Layout'
    };

    return categoryMap[type.toLowerCase()] || 'UI Component';
  }

  /**
   * Map interactive element type to category
   */
  private mapInteractiveCategory(tagName: string): any {
    const categoryMap: Record<string, any> = {
      button: 'Action',
      a: 'Navigation',
      input: 'Form',
      select: 'Form',
      textarea: 'Form'
    };

    return categoryMap[tagName] || 'UI Component';
  }

  /**
   * Estimate feature priority
   */
  private estimatePriority(feature: any): 'high' | 'medium' | 'low' {
    // Primary navigation and forms are high priority
    if (feature.type === 'navigation' || feature.type === 'form') {
      return 'high';
    }

    // Interactive elements are medium priority
    if (feature.type === 'button' || feature.type === 'modal') {
      return 'medium';
    }

    // Everything else is low priority
    return 'low';
  }

  /**
   * Generate unique feature ID
   */
  private generateFeatureId(name: string, url: string): string {
    const hash = createHash('md5')
      .update(name + url)
      .digest('hex')
      .substring(0, 8);
    return `feat-${hash}`;
  }

  /**
   * Sanitize filename for screenshot
   */
  private sanitizeFilename(url: string): string {
    return url
      .replace(/https?:\/\//, '')
      .replace(/[^a-z0-9]/gi, '-')
      .replace(/-+/g, '-')
      .substring(0, 50);
  }

  /**
   * Deduplicate features
   */
  private deduplicateFeatures(features: ExtractedFeature[]): ExtractedFeature[] {
    const unique: ExtractedFeature[] = [];
    const seen = new Set<string>();

    for (const feature of features) {
      const signature = `${feature.name.toLowerCase()}-${feature.category}`;

      if (!seen.has(signature)) {
        seen.add(signature);
        unique.push(feature);
      }
    }

    return unique;
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(features: ExtractedFeature[]): FeatureAnalysisResult['summary'] {
    const byCategory = {} as Record<any, number>;
    const bySource = {} as Record<any, number>;
    const byPriority = { high: 0, medium: 0, low: 0, unassigned: 0 };
    let totalConfidence = 0;

    for (const feature of features) {
      byCategory[feature.category] = (byCategory[feature.category] || 0) + 1;
      bySource[feature.source] = (bySource[feature.source] || 0) + 1;

      if (feature.priority) {
        byPriority[feature.priority]++;
      } else {
        byPriority.unassigned++;
      }

      totalConfidence += feature.confidence;
    }

    return {
      totalFeatures: features.length,
      byCategory,
      bySource,
      byPriority,
      averageConfidence: features.length > 0 ? Math.round(totalConfidence / features.length) : 0
    };
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(features: ExtractedFeature[]): string[] {
    const recommendations: string[] = [];

    const formFeatures = features.filter(f => f.category === 'Form');
    if (formFeatures.length > 3) {
      recommendations.push(
        `Detected ${formFeatures.length} forms. Consider implementing form validation and error handling consistently.`
      );
    }

    const apiFeatures = features.filter(f => f.tags?.includes('api'));
    if (apiFeatures.length > 0) {
      recommendations.push(
        `Found ${apiFeatures.length} API endpoints. Consider documenting the API schema and implementing error handling.`
      );
    }

    return recommendations;
  }
}
