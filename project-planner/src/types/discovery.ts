/**
 * Types for Code-Based Feature Discovery
 */

export interface DiscoveryOptions {
  /** Root directory to scan */
  rootDir: string;
  /** Patterns to include */
  includePatterns?: string[];
  /** Patterns to exclude */
  excludePatterns?: string[];
  /** Framework type hints */
  frameworks?: ('react' | 'express' | 'nextjs' | 'vue' | 'angular')[];
}

export interface DiscoveredFeature {
  /** Feature name */
  name: string;
  /** Feature type */
  type: 'route' | 'endpoint' | 'component' | 'page' | 'service' | 'config';
  /** File path where discovered */
  filePath: string;
  /** Line number */
  lineNumber?: number;
  /** URL/path pattern */
  path?: string;
  /** HTTP method (for endpoints) */
  method?: string;
  /** Description (from comments) */
  description?: string;
  /** Related files */
  relatedFiles?: string[];
  /** Confidence score (0-100) */
  confidence: number;
}

export interface DiscoveryResult {
  /** All discovered features */
  features: DiscoveredFeature[];
  /** Files scanned */
  filesScanned: number;
  /** Discovery metadata */
  metadata: {
    rootDir: string;
    frameworks: string[];
    scanTime: number;
    timestamp: Date;
  };
}

export interface ReactRoute {
  path: string;
  component: string;
  exact?: boolean;
  filePath: string;
  lineNumber: number;
}

export interface ExpressEndpoint {
  method: string;
  path: string;
  handler: string;
  filePath: string;
  lineNumber: number;
  middleware?: string[];
}

export interface ConfigFeature {
  key: string;
  value: any;
  filePath: string;
  category?: string;
}
