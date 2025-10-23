# Shared Web Viewing Architecture

**Status**: Design Specification
**Date**: 2025-10-21
**Purpose**: Unified web viewing library shared across all three skills

---

## Executive Summary

All three skills benefit from web viewing, but with different focuses:
- **Planner**: Feature discovery from UI/navigation
- **Analyzer**: Production validation and functional verification
- **Manager**: Visual documentation and screenshot evidence

Rather than duplicate code, we create a shared library that each skill uses differently.

---

## Architecture Overview

```
shared/
└── web-viewer/
    ├── index.ts                    # Public API exports
    ├── core/
    │   ├── webFetcher.ts          # WebFetch wrapper (Tier 1)
    │   ├── playwrightDriver.ts    # Browser automation (Tier 2)
    │   ├── screenshotCapture.ts   # Screenshot utility (Tier 3)
    │   └── networkMonitor.ts      # API call tracking
    ├── extractors/
    │   ├── featureExtractor.ts    # AI-powered feature discovery
    │   ├── functionalityChecker.ts # Verify features work
    │   └── visualAnalyzer.ts      # Screenshot analysis
    ├── utils/
    │   ├── urlValidator.ts        # URL validation & sanitization
    │   ├── authHandler.ts         # Authentication flows
    │   └── rateLimiter.ts         # Respectful crawling
    └── types/
        └── index.ts               # Shared TypeScript types
```

---

## Core Components

### 1. WebFetcher (Tier 1 - Simple & Fast)

**Purpose**: Static HTML fetching and analysis

```typescript
// shared/web-viewer/core/webFetcher.ts

export interface WebFetchOptions {
  url: string;
  prompt?: string;
  timeout?: number;
}

export interface WebFetchResult {
  url: string;
  html: string;
  analysis?: string; // AI analysis if prompt provided
  statusCode: number;
  redirectedTo?: string;
  fetchedAt: Date;
}

export class WebFetcher {
  /**
   * Fetch URL and optionally analyze with AI
   */
  async fetch(options: WebFetchOptions): Promise<WebFetchResult> {
    // Use Claude Code's WebFetch tool
    // Returns HTML + optional AI analysis
  }

  /**
   * Extract links from HTML
   */
  async extractLinks(html: string, baseUrl: string): Promise<string[]> {
    // Parse HTML, find <a> tags, resolve relative URLs
  }

  /**
   * Extract navigation structure
   */
  async extractNavigation(html: string): Promise<NavigationStructure> {
    // AI prompt: "Extract main navigation menu items"
  }
}
```

**Used by**:
- Planner: Discover features from static sites
- Analyzer: Quick URL validation
- Manager: Extract metadata for issues

**Performance**: 2-5 seconds per page

---

### 2. PlaywrightDriver (Tier 2 - Advanced)

**Purpose**: Full browser automation with JavaScript execution

```typescript
// shared/web-viewer/core/playwrightDriver.ts

export interface PlaywrightOptions {
  url: string;
  headless?: boolean;
  timeout?: number;
  waitForSelector?: string;
  authenticate?: boolean;
}

export interface PlaywrightResult {
  url: string;
  html: string;
  screenshot?: Buffer;
  networkRequests: NetworkRequest[];
  routes: string[];
  statusCode: number;
  loadTime: number;
}

export class PlaywrightDriver {
  private browser?: Browser;
  private page?: Page;

  /**
   * Launch browser and navigate to URL
   */
  async navigate(options: PlaywrightOptions): Promise<PlaywrightResult> {
    this.browser = await playwright.chromium.launch({
      headless: options.headless ?? true
    });

    this.page = await this.browser.newPage();

    // Monitor network requests
    const requests: NetworkRequest[] = [];
    this.page.on('request', req => {
      requests.push({
        url: req.url(),
        method: req.method(),
        resourceType: req.resourceType()
      });
    });

    await this.page.goto(options.url, {
      timeout: options.timeout ?? 30000,
      waitUntil: 'networkidle'
    });

    // Wait for specific selector if provided
    if (options.waitForSelector) {
      await this.page.waitForSelector(options.waitForSelector);
    }

    return {
      url: this.page.url(),
      html: await this.page.content(),
      screenshot: await this.page.screenshot(),
      networkRequests: requests,
      routes: await this.extractRoutes(),
      statusCode: await this.page.evaluate(() => window.performance),
      loadTime: Date.now()
    };
  }

  /**
   * Handle authentication interactively
   */
  async authenticateInteractive(): Promise<void> {
    // Launch visible browser, wait for user to log in
    this.browser = await playwright.chromium.launch({ headless: false });
    this.page = await this.browser.newPage();

    console.log('🔐 Please log in manually. Browser will close automatically after 5 minutes of inactivity.');

    // Wait for user to complete login (detect navigation or timeout)
    await this.page.waitForNavigation({ timeout: 300000 });
  }

  /**
   * Extract SPA routes from page
   */
  async extractRoutes(): Promise<string[]> {
    // Look for React Router, Vue Router, etc.
    return await this.page.evaluate(() => {
      // Extract routes from router config
    });
  }

  /**
   * Check if element is visible and interactive
   */
  async checkElement(selector: string): Promise<ElementCheck> {
    const element = await this.page.$(selector);
    if (!element) return { exists: false };

    return {
      exists: true,
      visible: await element.isVisible(),
      enabled: await element.isEnabled(),
      text: await element.textContent()
    };
  }

  /**
   * Click element and wait for result
   */
  async clickAndWait(selector: string, waitFor?: string): Promise<void> {
    await this.page.click(selector);
    if (waitFor) {
      await this.page.waitForSelector(waitFor);
    } else {
      await this.page.waitForLoadState('networkidle');
    }
  }

  /**
   * Clean up browser resources
   */
  async close(): Promise<void> {
    await this.page?.close();
    await this.browser?.close();
  }
}
```

**Used by**:
- Planner: Navigate SPAs, discover features
- Analyzer: Verify functionality, test interactions
- Manager: Capture screenshots of bugs

**Performance**: 5-10 seconds per page

---

### 3. ScreenshotCapture (Tier 3 - Visual Analysis)

**Purpose**: Screenshot management and AI visual analysis

```typescript
// shared/web-viewer/core/screenshotCapture.ts

export interface ScreenshotOptions {
  url: string;
  fullPage?: boolean;
  selector?: string; // Capture specific element
  viewport?: { width: number; height: number };
  outputPath?: string;
}

export interface ScreenshotResult {
  buffer: Buffer;
  path?: string;
  width: number;
  height: number;
  capturedAt: Date;
  analysis?: VisualAnalysis;
}

export class ScreenshotCapture {
  private driver: PlaywrightDriver;

  constructor(driver: PlaywrightDriver) {
    this.driver = driver;
  }

  /**
   * Capture screenshot
   */
  async capture(options: ScreenshotOptions): Promise<ScreenshotResult> {
    const screenshot = await this.driver.page.screenshot({
      fullPage: options.fullPage ?? false,
      path: options.outputPath
    });

    return {
      buffer: screenshot,
      path: options.outputPath,
      width: options.viewport?.width ?? 1920,
      height: options.viewport?.height ?? 1080,
      capturedAt: new Date()
    };
  }

  /**
   * Capture multiple screenshots (e.g., different viewports)
   */
  async captureMultiple(
    url: string,
    viewports: Array<{ width: number; height: number; name: string }>
  ): Promise<ScreenshotResult[]> {
    const results: ScreenshotResult[] = [];

    for (const viewport of viewports) {
      await this.driver.page.setViewportSize(viewport);
      await this.driver.navigate({ url });

      const screenshot = await this.capture({
        url,
        viewport,
        outputPath: `.screenshots/${viewport.name}.png`
      });

      results.push(screenshot);
    }

    return results;
  }

  /**
   * Analyze screenshot with AI
   */
  async analyzeVisual(screenshot: Buffer, prompt: string): Promise<VisualAnalysis> {
    // Use Claude to analyze image
    // Prompt: "Describe the UI elements visible in this screenshot"
    return {
      description: '...', // AI response
      elements: ['button', 'form', 'navigation'],
      features: ['User login', 'Password reset'],
      confidence: 85
    };
  }
}
```

**Used by**:
- Planner: Visual feature discovery
- Analyzer: Compare expected vs actual UI
- Manager: Attach to GitHub issues

**Performance**: 3-5 seconds per screenshot

---

### 4. NetworkMonitor

**Purpose**: Track API calls to discover backend features

```typescript
// shared/web-viewer/core/networkMonitor.ts

export interface NetworkRequest {
  url: string;
  method: string;
  resourceType: string;
  status?: number;
  responseTime?: number;
}

export interface APIEndpoint {
  path: string;
  method: string;
  callCount: number;
  avgResponseTime: number;
}

export class NetworkMonitor {
  private requests: NetworkRequest[] = [];

  /**
   * Start monitoring network requests
   */
  startMonitoring(page: Page): void {
    page.on('request', req => {
      this.requests.push({
        url: req.url(),
        method: req.method(),
        resourceType: req.resourceType()
      });
    });

    page.on('response', res => {
      const req = this.requests.find(r => r.url === res.url());
      if (req) {
        req.status = res.status();
        req.responseTime = Date.now();
      }
    });
  }

  /**
   * Extract API endpoints from network traffic
   */
  getAPIEndpoints(): APIEndpoint[] {
    const apiRequests = this.requests.filter(r =>
      r.url.includes('/api/') || r.resourceType === 'fetch'
    );

    // Group by path and method
    const endpoints = new Map<string, APIEndpoint>();

    for (const req of apiRequests) {
      const key = `${req.method} ${new URL(req.url).pathname}`;
      const existing = endpoints.get(key);

      if (existing) {
        existing.callCount++;
        existing.avgResponseTime =
          (existing.avgResponseTime + (req.responseTime ?? 0)) / 2;
      } else {
        endpoints.set(key, {
          path: new URL(req.url).pathname,
          method: req.method,
          callCount: 1,
          avgResponseTime: req.responseTime ?? 0
        });
      }
    }

    return Array.from(endpoints.values());
  }

  /**
   * Clear monitoring data
   */
  reset(): void {
    this.requests = [];
  }
}
```

**Used by**:
- Planner: Discover backend features from API calls
- Analyzer: Verify API endpoints are responding
- Manager: Document API failures in issues

---

## Extractors

### 1. FeatureExtractor (for Planner)

```typescript
// shared/web-viewer/extractors/featureExtractor.ts

export interface DiscoveredFeature {
  name: string;
  description: string;
  url: string;
  confidence: number;
  evidence: string[];
}

export class FeatureExtractor {
  /**
   * Extract features from HTML
   */
  async extractFromHTML(html: string, url: string): Promise<DiscoveredFeature[]> {
    // AI prompt: "Identify user-facing features from this HTML"
  }

  /**
   * Extract features from navigation
   */
  async extractFromNavigation(nav: NavigationStructure): Promise<DiscoveredFeature[]> {
    // Convert menu items to features
  }

  /**
   * Extract features from screenshots
   */
  async extractFromVisual(screenshot: Buffer): Promise<DiscoveredFeature[]> {
    // AI prompt: "Identify features visible in this UI screenshot"
  }

  /**
   * Extract features from network traffic
   */
  async extractFromAPI(endpoints: APIEndpoint[]): Promise<DiscoveredFeature[]> {
    // Infer features from API endpoints
    // /api/orders → Order management
    // /api/users → User management
  }
}
```

---

### 2. FunctionalityChecker (for Analyzer)

```typescript
// shared/web-viewer/extractors/functionalityChecker.ts

export interface FunctionalityCheck {
  feature: string;
  url: string;
  working: boolean;
  confidence: number;
  evidence: string;
  error?: string;
}

export class FunctionalityChecker {
  private driver: PlaywrightDriver;

  /**
   * Check if URL is accessible
   */
  async checkURL(url: string): Promise<FunctionalityCheck> {
    try {
      const result = await this.driver.navigate({ url });
      return {
        feature: 'Page accessibility',
        url,
        working: result.statusCode < 400,
        confidence: 100,
        evidence: `Status: ${result.statusCode}`
      };
    } catch (error) {
      return {
        feature: 'Page accessibility',
        url,
        working: false,
        confidence: 100,
        evidence: 'Failed to load',
        error: error.message
      };
    }
  }

  /**
   * Check if form is functional
   */
  async checkForm(url: string, formSelector: string): Promise<FunctionalityCheck> {
    await this.driver.navigate({ url });

    const formCheck = await this.driver.checkElement(formSelector);
    const submitBtn = await this.driver.checkElement(`${formSelector} button[type="submit"]`);

    return {
      feature: 'Form submission',
      url,
      working: formCheck.exists && formCheck.visible && submitBtn.exists,
      confidence: 90,
      evidence: formCheck.exists ? 'Form present and visible' : 'Form not found'
    };
  }

  /**
   * Check if API endpoint responds
   */
  async checkAPI(endpoint: string): Promise<FunctionalityCheck> {
    // Make API request, check response
  }

  /**
   * Check if authentication works
   */
  async checkAuth(loginUrl: string): Promise<FunctionalityCheck> {
    // Navigate to login, check if form exists
  }
}
```

---

### 3. VisualAnalyzer (for Manager)

```typescript
// shared/web-viewer/extractors/visualAnalyzer.ts

export interface VisualAnalysis {
  description: string;
  elements: string[];
  features: string[];
  issues?: string[];
  confidence: number;
}

export interface VisualComparison {
  before: Buffer;
  after: Buffer;
  differences: string[];
  confidence: number;
}

export class VisualAnalyzer {
  /**
   * Analyze UI from screenshot
   */
  async analyze(screenshot: Buffer, prompt: string): Promise<VisualAnalysis> {
    // Use Claude to analyze image
  }

  /**
   * Compare two screenshots (before/after)
   */
  async compare(before: Buffer, after: Buffer): Promise<VisualComparison> {
    // AI prompt: "Compare these two screenshots and identify differences"
  }

  /**
   * Identify UI bugs visually
   */
  async identifyBugs(screenshot: Buffer): Promise<string[]> {
    // AI prompt: "Identify visual bugs or issues in this UI"
    // Returns: ["Button text is cut off", "Misaligned form fields"]
  }
}
```

---

## Shared TypeScript Types

```typescript
// shared/web-viewer/types/index.ts

export interface NavigationStructure {
  mainNav: NavigationItem[];
  footer: NavigationItem[];
  sidebar?: NavigationItem[];
}

export interface NavigationItem {
  text: string;
  url: string;
  children?: NavigationItem[];
}

export interface ElementCheck {
  exists: boolean;
  visible?: boolean;
  enabled?: boolean;
  text?: string;
}

export type ViewportSize = 'mobile' | 'tablet' | 'desktop';

export const VIEWPORTS: Record<ViewportSize, { width: number; height: number }> = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1920, height: 1080 }
};
```

---

## Usage by Each Skill

### Planner: Feature Discovery

```typescript
import { WebFetcher, PlaywrightDriver, FeatureExtractor } from '@shared/web-viewer';

export class WebDiscoveryCommand {
  async execute(url: string): Promise<DiscoveredFeature[]> {
    const features: DiscoveredFeature[] = [];

    // Tier 1: WebFetch
    const fetcher = new WebFetcher();
    const result = await fetcher.fetch({ url });
    const nav = await fetcher.extractNavigation(result.html);

    // Tier 2: Playwright (for SPAs)
    const driver = new PlaywrightDriver();
    await driver.navigate({ url });
    const routes = await driver.extractRoutes();

    // Extract features
    const extractor = new FeatureExtractor();
    features.push(...await extractor.extractFromNavigation(nav));
    features.push(...await extractor.extractFromAPI(driver.networkRequests));

    await driver.close();
    return features;
  }
}
```

**Output**: features.csv

---

### Analyzer: Production Validation

```typescript
import { PlaywrightDriver, FunctionalityChecker } from '@shared/web-viewer';

export class ProductionVerifier {
  async verify(features: Feature[], productionUrl: string): Promise<VerificationReport> {
    const checker = new FunctionalityChecker();
    const results: FunctionalityCheck[] = [];

    for (const feature of features) {
      // Build URL from feature metadata
      const url = `${productionUrl}${feature.route}`;

      // Check if accessible
      const check = await checker.checkURL(url);
      results.push(check);

      // Update feature confidence
      if (check.working) {
        feature.implementation_confidence = Math.min(100, feature.implementation_confidence + 20);
      } else {
        feature.implementation_confidence = Math.max(0, feature.implementation_confidence - 30);
      }
    }

    return {
      totalChecked: features.length,
      working: results.filter(r => r.working).length,
      broken: results.filter(r => !r.working).length,
      details: results
    };
  }
}
```

**Output**: Updated implementation_confidence in analysis report

---

### Manager: Visual Documentation

```typescript
import { PlaywrightDriver, ScreenshotCapture, VisualAnalyzer } from '@shared/web-viewer';

export class IssueCreatorWithScreenshots {
  async createIssue(todo: Todo, productionUrl: string): Promise<GitHubIssue> {
    const driver = new PlaywrightDriver();
    const capturer = new ScreenshotCapture(driver);
    const analyzer = new VisualAnalyzer();

    // Navigate to relevant page
    const pageUrl = this.inferPageUrl(todo, productionUrl);
    await driver.navigate({ url: pageUrl });

    // Capture screenshot
    const screenshot = await capturer.capture({
      url: pageUrl,
      outputPath: `.screenshots/${todo.id}.png`
    });

    // Analyze visually
    const analysis = await analyzer.analyze(
      screenshot.buffer,
      `Analyze this UI for the issue: ${todo.content}`
    );

    // Create GitHub issue with screenshot
    const issue = await this.githubClient.createIssue({
      title: todo.content,
      body: `
## Description
${todo.content}

## Visual Evidence
![Screenshot](${screenshot.path})

## AI Analysis
${analysis.description}

**URL**: ${pageUrl}
**File**: ${todo.file}:${todo.line}
      `,
      labels: ['bug', 'needs-visual-review']
    });

    // Upload screenshot as attachment
    await this.githubClient.uploadAsset(issue.number, screenshot.path);

    await driver.close();
    return issue;
  }
}
```

**Output**: GitHub issues with screenshot attachments

---

## Configuration

### Shared Config: .web-viewer.config.json

```json
{
  "playwright": {
    "headless": true,
    "timeout": 30000,
    "defaultViewport": { "width": 1920, "height": 1080 },
    "userAgent": "ProjectManagementSuite/1.0 (WebViewer)"
  },
  "webfetch": {
    "timeout": 10000,
    "maxRedirects": 5
  },
  "screenshots": {
    "directory": ".screenshots",
    "format": "png",
    "quality": 90,
    "fullPage": false
  },
  "rateLimiting": {
    "requestsPerSecond": 2,
    "delayBetweenPages": 1000
  },
  "authentication": {
    "interactiveTimeout": 300000
  }
}
```

---

## Implementation Roadmap

### Phase 1: Core Library (Week 1-2)
**Deliverables**:
- WebFetcher implementation
- PlaywrightDriver implementation
- ScreenshotCapture implementation
- NetworkMonitor implementation
- Shared types

**Tests**: 30+ unit tests

### Phase 2: Extractors (Week 2-3)
**Deliverables**:
- FeatureExtractor (for Planner)
- FunctionalityChecker (for Analyzer)
- VisualAnalyzer (for Manager)

**Tests**: 20+ integration tests

### Phase 3: Skill Integration (Week 3-4)
**Deliverables**:
- Planner imports and uses library
- Analyzer imports and uses library
- Manager imports and uses library
- End-to-end workflow tests

**Tests**: 15+ E2E tests

---

## Dependencies

### package.json (shared)

```json
{
  "name": "@project-management-suite/web-viewer",
  "version": "1.0.0",
  "dependencies": {
    "playwright": "^1.40.0",
    "cheerio": "^1.0.0-rc.12",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "jest": "^29.0.0"
  }
}
```

---

## Testing Strategy

### Unit Tests
- Each component tested in isolation
- Mock browser interactions
- Test error handling

### Integration Tests
- Test full workflows (fetch → analyze → extract)
- Use test websites (example.com, httpbin.org)
- Test authentication flows

### E2E Tests
- Test complete skill workflows
- Planner: discover-web → features.csv
- Analyzer: verify-production → updated confidence
- Manager: create-issues --with-screenshots → GitHub

---

## Security & Best Practices

### Rate Limiting
```typescript
class RateLimiter {
  private lastRequest: number = 0;
  private minDelay: number = 1000; // 1 second between requests

  async throttle(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequest;

    if (elapsed < this.minDelay) {
      await new Promise(resolve =>
        setTimeout(resolve, this.minDelay - elapsed)
      );
    }

    this.lastRequest = Date.now();
  }
}
```

### Respect robots.txt
```typescript
class RobotsChecker {
  async canCrawl(url: string): Promise<boolean> {
    const robotsUrl = new URL('/robots.txt', url).toString();
    const robots = await fetch(robotsUrl);
    // Parse and check if path is allowed
  }
}
```

### Error Handling
- Graceful failures (continue on error)
- Detailed logging
- Retry logic with exponential backoff

---

## Performance Considerations

### Caching
- Cache static HTML for 1 hour
- Cache screenshots for 24 hours
- Cache API endpoint lists

### Parallel Processing
```typescript
async function discoverMultiplePages(urls: string[]): Promise<Feature[]> {
  // Process 5 pages in parallel
  const chunks = chunkArray(urls, 5);
  const features: Feature[] = [];

  for (const chunk of chunks) {
    const results = await Promise.all(
      chunk.map(url => discoverFeatures(url))
    );
    features.push(...results.flat());
  }

  return features;
}
```

### Resource Cleanup
- Always close browser instances
- Clear screenshot cache periodically
- Limit concurrent Playwright instances (max 3)

---

## Success Metrics

### Phase 1 (Core Library)
- ✅ WebFetch: 100% success rate on static sites
- ✅ Playwright: 95% success rate on SPAs
- ✅ Screenshots: 100% capture success

### Phase 2 (Extractors)
- ✅ Feature extraction: 70%+ accuracy
- ✅ Functionality checks: 85%+ accuracy
- ✅ Visual analysis: 80%+ accuracy

### Phase 3 (Integration)
- ✅ Planner: Discovers 15+ features from typical app
- ✅ Analyzer: Verifies 20+ features in <2 minutes
- ✅ Manager: Creates issues with screenshots in <30 seconds

---

## Conclusion

The shared web viewing architecture:
- ✅ **Eliminates code duplication** across skills
- ✅ **Provides consistent API** for all web interactions
- ✅ **Enables powerful workflows** (discovery → validation → documentation)
- ✅ **Maintains skill separation** (each uses library differently)
- ✅ **Scales efficiently** (shared caching, rate limiting)

Each skill imports and uses the library according to its needs:
- **Planner**: Heavy feature extraction
- **Analyzer**: Lightweight validation
- **Manager**: Screenshot documentation

This creates a cohesive, production-ready suite with complementary capabilities.
