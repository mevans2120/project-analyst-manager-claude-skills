/**
 * Types for WebFetcher and shared web viewing functionality
 */

export interface FetchOptions {
  /** URL to fetch */
  url: string;
  /** Optional timeout in milliseconds */
  timeout?: number;
  /** Optional headers */
  headers?: Record<string, string>;
  /** Follow redirects (default: true) */
  followRedirects?: boolean;
}

export interface FetchResult {
  /** Raw HTML content */
  html: string;
  /** Markdown conversion of HTML */
  markdown: string;
  /** Final URL after redirects */
  finalUrl: string;
  /** HTTP status code */
  statusCode: number;
  /** Response headers */
  headers: Record<string, string>;
  /** Fetch timestamp */
  timestamp: Date;
}

export interface AnalysisOptions {
  /** Extract main content only */
  mainContentOnly?: boolean;
  /** Remove navigation elements */
  removeNav?: boolean;
  /** Maximum content length */
  maxLength?: number;
  /** Custom selectors to extract */
  selectors?: string[];
}

export interface AnalysisResult {
  /** Extracted text content */
  text: string;
  /** Structured data extracted */
  data: Record<string, any>;
  /** Page title */
  title?: string;
  /** Meta description */
  description?: string;
  /** Links found */
  links?: string[];
}
