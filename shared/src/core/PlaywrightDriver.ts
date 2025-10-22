/**
 * PlaywrightDriver - Browser Automation
 * Enables SPA navigation, authentication, and dynamic content analysis
 *
 * This module provides browser automation capabilities using Playwright,
 * enabling analysis of JavaScript-heavy sites, SPAs, and authenticated content.
 */

import { chromium, firefox, webkit, Browser, Page, BrowserContext } from 'playwright';
import {
  BrowserType,
  PlaywrightOptions,
  NavigationOptions,
  AuthenticationOptions,
  ScreenshotOptions,
  WaitForOptions,
  PageContent,
  NetworkRequest,
  NetworkResponse
} from '../types/playwright';

export class PlaywrightDriver {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private options: PlaywrightOptions;
  private networkRequests: NetworkRequest[] = [];
  private networkResponses: NetworkResponse[] = [];

  constructor(options: PlaywrightOptions = {}) {
    this.options = {
      browser: 'chromium',
      headless: true,
      viewport: { width: 1920, height: 1080 },
      timeout: 30000,
      ...options
    };
  }

  /**
   * Launch browser and create a new page
   */
  async launch(): Promise<void> {
    if (this.browser) {
      throw new Error('Browser already launched. Call close() first.');
    }

    // Select browser
    const browserType = this.options.browser === 'firefox' ? firefox :
                       this.options.browser === 'webkit' ? webkit :
                       chromium;

    // Launch browser
    this.browser = await browserType.launch({
      headless: this.options.headless,
      timeout: this.options.timeout
    });

    // Create context
    this.context = await this.browser.newContext({
      viewport: this.options.viewport,
      userAgent: this.options.userAgent
    });

    // Create page
    this.page = await this.context.newPage();

    // Set default timeout
    this.page.setDefaultTimeout(this.options.timeout!);

    // Setup network monitoring
    this.setupNetworkMonitoring();
  }

  /**
   * Setup network request/response monitoring
   */
  private setupNetworkMonitoring(): void {
    if (!this.page) return;

    this.page.on('request', (request) => {
      this.networkRequests.push({
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        postData: request.postData() || undefined,
        resourceType: request.resourceType()
      });
    });

    this.page.on('response', async (response) => {
      try {
        const body = await response.text().catch(() => undefined);
        this.networkResponses.push({
          url: response.url(),
          status: response.status(),
          headers: response.headers(),
          body
        });
      } catch (error) {
        // Ignore errors reading response body
      }
    });
  }

  /**
   * Navigate to a URL
   */
  async navigate(options: NavigationOptions): Promise<void> {
    if (!this.page) {
      throw new Error('Browser not launched. Call launch() first.');
    }

    const { url, waitUntil = 'networkidle', timeout } = options;

    await this.page.goto(url, {
      waitUntil,
      timeout: timeout || this.options.timeout
    });
  }

  /**
   * Wait for an element or navigation
   */
  async waitFor(options: WaitForOptions): Promise<void> {
    if (!this.page) {
      throw new Error('Browser not launched. Call launch() first.');
    }

    const { selector, navigation, timeout } = options;

    if (selector) {
      await this.page.waitForSelector(selector, {
        timeout: timeout || this.options.timeout
      });
    }

    if (navigation) {
      await this.page.waitForLoadState('networkidle', {
        timeout: timeout || this.options.timeout
      });
    }
  }

  /**
   * Execute JavaScript in the page context
   */
  async evaluate<T = any>(script: string | Function): Promise<T> {
    if (!this.page) {
      throw new Error('Browser not launched. Call launch() first.');
    }

    return await this.page.evaluate(script as any);
  }

  /**
   * Get page content (HTML, title, URL, cookies)
   */
  async getContent(includeScreenshot = false): Promise<PageContent> {
    if (!this.page) {
      throw new Error('Browser not launched. Call launch() first.');
    }

    const html = await this.page.content();
    const title = await this.page.title();
    const url = this.page.url();
    const cookies = await this.context!.cookies();

    const content: PageContent = {
      html,
      title,
      url,
      cookies
    };

    if (includeScreenshot) {
      content.screenshot = await this.page.screenshot();
    }

    return content;
  }

  /**
   * Take a screenshot
   */
  async screenshot(options: ScreenshotOptions = {}): Promise<Buffer> {
    if (!this.page) {
      throw new Error('Browser not launched. Call launch() first.');
    }

    return await this.page.screenshot({
      path: options.path,
      fullPage: options.fullPage ?? false,
      type: options.type ?? 'png',
      quality: options.quality
    });
  }

  /**
   * Authenticate with username/password
   */
  async authenticate(options: AuthenticationOptions): Promise<void> {
    if (!this.page) {
      throw new Error('Browser not launched. Call launch() first.');
    }

    const {
      username,
      password,
      loginUrl,
      selectors = {
        username: 'input[name="username"], input[type="email"], input[name="email"]',
        password: 'input[name="password"], input[type="password"]',
        submit: 'button[type="submit"], input[type="submit"]'
      }
    } = options;

    // Navigate to login page if provided
    if (loginUrl) {
      await this.page.goto(loginUrl, { waitUntil: 'networkidle' });
    }

    // Fill username
    await this.page.fill(selectors.username, username);

    // Fill password
    await this.page.fill(selectors.password, password);

    // Click submit and wait for navigation
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: 'networkidle' }),
      this.page.click(selectors.submit)
    ]);
  }

  /**
   * Click an element
   */
  async click(selector: string): Promise<void> {
    if (!this.page) {
      throw new Error('Browser not launched. Call launch() first.');
    }

    await this.page.click(selector);
  }

  /**
   * Type text into an input
   */
  async type(selector: string, text: string): Promise<void> {
    if (!this.page) {
      throw new Error('Browser not launched. Call launch() first.');
    }

    await this.page.fill(selector, text);
  }

  /**
   * Get text content of an element
   */
  async getText(selector: string): Promise<string | null> {
    if (!this.page) {
      throw new Error('Browser not launched. Call launch() first.');
    }

    return await this.page.textContent(selector);
  }

  /**
   * Check if element exists
   */
  async exists(selector: string): Promise<boolean> {
    if (!this.page) {
      throw new Error('Browser not launched. Call launch() first.');
    }

    const element = await this.page.$(selector);
    return element !== null;
  }

  /**
   * Get all network requests
   */
  getNetworkRequests(): NetworkRequest[] {
    return [...this.networkRequests];
  }

  /**
   * Get all network responses
   */
  getNetworkResponses(): NetworkResponse[] {
    return [...this.networkResponses];
  }

  /**
   * Clear network logs
   */
  clearNetworkLogs(): void {
    this.networkRequests = [];
    this.networkResponses = [];
  }

  /**
   * Get API calls (filter network requests for API endpoints)
   */
  getAPICalls(): NetworkRequest[] {
    return this.networkRequests.filter(req =>
      req.resourceType === 'xhr' || req.resourceType === 'fetch'
    );
  }

  /**
   * Set cookies
   */
  async setCookies(cookies: any[]): Promise<void> {
    if (!this.context) {
      throw new Error('Browser not launched. Call launch() first.');
    }

    await this.context.addCookies(cookies);
  }

  /**
   * Get cookies
   */
  async getCookies(): Promise<any[]> {
    if (!this.context) {
      throw new Error('Browser not launched. Call launch() first.');
    }

    return await this.context.cookies();
  }

  /**
   * Close browser
   */
  async close(): Promise<void> {
    if (this.page) {
      await this.page.close();
      this.page = null;
    }

    if (this.context) {
      await this.context.close();
      this.context = null;
    }

    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }

    this.clearNetworkLogs();
  }

  /**
   * Check if browser is currently running
   */
  isLaunched(): boolean {
    return this.browser !== null && this.page !== null;
  }
}
