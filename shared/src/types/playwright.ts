/**
 * Types for PlaywrightDriver
 */

export type BrowserType = 'chromium' | 'firefox' | 'webkit';

export interface PlaywrightOptions {
  /** Browser type to launch */
  browser?: BrowserType;
  /** Run in headless mode */
  headless?: boolean;
  /** Viewport dimensions */
  viewport?: {
    width: number;
    height: number;
  };
  /** User agent string */
  userAgent?: string;
  /** Default timeout in milliseconds */
  timeout?: number;
}

export interface NavigationOptions {
  /** URL to navigate to */
  url: string;
  /** Wait until this state */
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle';
  /** Timeout for navigation */
  timeout?: number;
}

export interface AuthenticationOptions {
  /** Username */
  username: string;
  /** Password */
  password: string;
  /** Login URL */
  loginUrl?: string;
  /** Selectors for form fields */
  selectors?: {
    username: string;
    password: string;
    submit: string;
  };
}

export interface ScreenshotOptions {
  /** Path to save screenshot */
  path?: string;
  /** Full page screenshot */
  fullPage?: boolean;
  /** Image type */
  type?: 'png' | 'jpeg';
  /** Quality (0-100) for JPEG */
  quality?: number;
}

export interface WaitForOptions {
  /** CSS selector to wait for */
  selector?: string;
  /** Wait for navigation */
  navigation?: boolean;
  /** Timeout */
  timeout?: number;
}

export interface PageContent {
  /** HTML content */
  html: string;
  /** Page title */
  title: string;
  /** Current URL */
  url: string;
  /** Cookies */
  cookies: any[];
  /** Screenshot buffer (if requested) */
  screenshot?: Buffer;
}

export interface NetworkRequest {
  /** Request URL */
  url: string;
  /** HTTP method */
  method: string;
  /** Request headers */
  headers: Record<string, string>;
  /** Request payload */
  postData?: string;
  /** Resource type */
  resourceType: string;
}

export interface NetworkResponse {
  /** Response URL */
  url: string;
  /** Status code */
  status: number;
  /** Response headers */
  headers: Record<string, string>;
  /** Response body */
  body?: string;
}
