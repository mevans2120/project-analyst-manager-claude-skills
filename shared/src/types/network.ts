/**
 * Types for NetworkMonitor
 */

export interface APIEndpoint {
  /** Full URL */
  url: string;
  /** HTTP method */
  method: string;
  /** Request headers */
  requestHeaders: Record<string, string>;
  /** Response headers */
  responseHeaders: Record<string, string>;
  /** Status code */
  statusCode: number;
  /** Request payload */
  requestPayload?: string;
  /** Response payload */
  responsePayload?: string;
  /** Response time in ms */
  responseTime?: number;
  /** Timestamp */
  timestamp: Date;
}

export interface APIPattern {
  /** Base path pattern */
  pattern: string;
  /** HTTP methods used */
  methods: string[];
  /** Number of calls */
  callCount: number;
  /** Example URLs */
  examples: string[];
}

export interface NetworkSummary {
  /** Total requests */
  totalRequests: number;
  /** Total API calls (XHR/Fetch) */
  totalAPICalls: number;
  /** Unique API endpoints */
  uniqueEndpoints: number;
  /** API patterns discovered */
  patterns: APIPattern[];
  /** All endpoints */
  endpoints: APIEndpoint[];
}

export interface MonitorOptions {
  /** Track all requests or just API calls */
  apiOnly?: boolean;
  /** Capture request/response bodies */
  captureBodies?: boolean;
  /** Maximum body size to capture (bytes) */
  maxBodySize?: number;
  /** Filter URLs by pattern */
  urlPattern?: RegExp;
}
