/**
 * Type definitions for feature extraction from designs and websites
 * Supports extracting feature lists from:
 * - Design files (Figma exports, Sketch, moodboards, wireframes)
 * - Live websites
 * - Screenshots
 */

export type FeatureSource = 'design-file' | 'moodboard' | 'website' | 'screenshot' | 'wireframe';
export type FeatureCategory = 'UI Component' | 'Page' | 'Navigation' | 'Form' | 'Data Display' | 'Action' | 'Content' | 'Layout' | 'Other';
export type FeaturePriority = 'high' | 'medium' | 'low';
export type FeatureStatus = 'identified' | 'needs-clarification' | 'duplicate';

/**
 * A single feature extracted from design/website analysis
 */
export interface ExtractedFeature {
  /** Unique identifier */
  id: string;

  /** Feature name/title */
  name: string;

  /** Detailed description */
  description: string;

  /** Category of the feature */
  category: FeatureCategory;

  /** Where this feature was found */
  source: FeatureSource;

  /** Source file path or URL */
  sourcePath: string;

  /** Estimated priority */
  priority?: FeaturePriority;

  /** Current status */
  status: FeatureStatus;

  /** Location within source (page number, coordinates, etc.) */
  location?: {
    page?: number;
    coordinates?: { x: number; y: number; width: number; height: number };
    url?: string;
    selector?: string;
  };

  /** Related features (for grouping) */
  relatedTo?: string[];

  /** Tags for categorization */
  tags?: string[];

  /** Confidence score (0-100) */
  confidence: number;

  /** Notes/observations */
  notes?: string;

  /** Timestamp when extracted */
  extractedAt: string;
}

/**
 * Analysis result from design/website scan
 */
export interface FeatureAnalysisResult {
  /** All extracted features */
  features: ExtractedFeature[];

  /** Summary statistics */
  summary: {
    totalFeatures: number;
    byCategory: Record<FeatureCategory, number>;
    bySource: Record<FeatureSource, number>;
    byPriority: {
      high: number;
      medium: number;
      low: number;
      unassigned: number;
    };
    averageConfidence: number;
  };

  /** Analysis metadata */
  metadata: {
    analyzedSources: string[];
    analysisDate: string;
    analysisDuration: number;
    tool: string;
    version: string;
  };

  /** Warnings or issues */
  warnings?: string[];

  /** Recommendations */
  recommendations?: string[];
}

/**
 * Options for design file analysis
 */
export interface DesignAnalysisOptions {
  /** Paths to design files (images) */
  designFiles?: string[];

  /** Paths to moodboard images */
  moodboards?: string[];

  /** Paths to wireframes */
  wireframes?: string[];

  /** Paths to screenshots */
  screenshots?: string[];

  /** Include low-confidence features (< 70%) */
  includeLowConfidence?: boolean;

  /** Auto-categorize features */
  autoCategorize?: boolean;

  /** Extract color schemes */
  extractColors?: boolean;

  /** Extract typography */
  extractTypography?: boolean;

  /** Context/project description for better analysis */
  projectContext?: string;
}

/**
 * Options for website analysis
 */
export interface WebsiteAnalysisOptions {
  /** URLs to analyze */
  urls: string[];

  /** Crawl depth (0 = single page, 1 = linked pages, etc.) */
  crawlDepth?: number;

  /** Capture screenshots */
  captureScreenshots?: boolean;

  /** Analyze interactive elements */
  analyzeInteractions?: boolean;

  /** Analyze API calls */
  analyzeAPIs?: boolean;

  /** Include low-confidence features */
  includeLowConfidence?: boolean;

  /** Authentication if needed */
  auth?: {
    type: 'cookies' | 'basic' | 'bearer';
    credentials?: Record<string, string>;
    cookiePath?: string;
  };

  /** Context/project description */
  projectContext?: string;
}

/**
 * CSV export options for features
 */
export interface FeatureCSVOptions {
  /** Include header row */
  includeHeaders?: boolean;

  /** Fields to include */
  fields?: Array<keyof ExtractedFeature | 'sourceName' | 'categoryEmoji'>;

  /** Group by category */
  groupByCategory?: boolean;

  /** Sort order */
  sortBy?: 'priority' | 'category' | 'confidence' | 'name';

  /** Include summary section */
  includeSummary?: boolean;
}

/**
 * Design analysis context for better feature extraction
 */
export interface DesignContext {
  /** Project name */
  projectName?: string;

  /** Target platform (web, mobile, desktop) */
  platform?: 'web' | 'mobile' | 'desktop' | 'multi-platform';

  /** Industry/domain */
  domain?: string;

  /** Target audience */
  audience?: string;

  /** Known feature requirements */
  knownFeatures?: string[];

  /** Design system/framework */
  designSystem?: string;
}

/**
 * Color scheme extracted from designs
 */
export interface ColorScheme {
  primary: string[];
  secondary: string[];
  accent: string[];
  neutral: string[];
  semantic?: {
    success?: string;
    warning?: string;
    error?: string;
    info?: string;
  };
}

/**
 * Typography information extracted from designs
 */
export interface Typography {
  fontFamilies: string[];
  headingSizes: number[];
  bodySizes: number[];
  lineHeights: number[];
  fontWeights: string[];
}

/**
 * Enhanced analysis result with design details
 */
export interface DetailedAnalysisResult extends FeatureAnalysisResult {
  /** Extracted color schemes */
  colorScheme?: ColorScheme;

  /** Typography analysis */
  typography?: Typography;

  /** Layout patterns identified */
  layoutPatterns?: string[];

  /** Component library suggestions */
  suggestedComponents?: string[];
}
