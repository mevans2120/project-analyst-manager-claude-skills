/**
 * Types for Feature Extractors Suite
 */

export interface ExtractedFeature {
  /** Feature name */
  name: string;
  /** Feature type */
  type: 'ui' | 'api' | 'functionality' | 'visual';
  /** Description */
  description?: string;
  /** Location (URL, selector, etc.) */
  location: string;
  /** Confidence score (0-100) */
  confidence: number;
  /** Supporting evidence */
  evidence?: string[];
  /** Screenshot (if available) */
  screenshot?: Buffer;
  /** Related features */
  relatedFeatures?: string[];
}

export interface ExtractionOptions {
  /** URL to analyze */
  url: string;
  /** Extract UI features */
  extractUI?: boolean;
  /** Extract API features */
  extractAPI?: boolean;
  /** Extract visual features */
  extractVisual?: boolean;
  /** Take screenshots */
  captureScreenshots?: boolean;
  /** Viewport for capture */
  viewport?: 'mobile' | 'tablet' | 'desktop';
}

export interface ExtractionResult {
  /** URL analyzed */
  url: string;
  /** All extracted features */
  features: ExtractedFeature[];
  /** Extraction metadata */
  metadata: {
    extractionTime: number;
    timestamp: Date;
    featuresFound: number;
  };
}

export interface FunctionalityCheck {
  /** Feature name being checked */
  feature: string;
  /** Is the feature functional? */
  functional: boolean;
  /** Check details */
  details: string;
  /** Error message (if not functional) */
  error?: string;
  /** Evidence */
  evidence?: string[];
}

export interface VisualElement {
  /** Element type */
  type: 'button' | 'link' | 'form' | 'input' | 'image' | 'video' | 'other';
  /** Selector */
  selector: string;
  /** Text content */
  text?: string;
  /** Attributes */
  attributes: Record<string, string>;
  /** Bounding box */
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}
