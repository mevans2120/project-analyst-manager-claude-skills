/**
 * Types for ScreenshotCapture
 */

export type ViewportPreset = 'mobile' | 'tablet' | 'desktop' | 'wide';

export interface Viewport {
  width: number;
  height: number;
  deviceScaleFactor?: number;
  isMobile?: boolean;
  hasTouch?: boolean;
}

export const VIEWPORT_PRESETS: Record<ViewportPreset, Viewport> = {
  mobile: {
    width: 375,
    height: 667,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  },
  tablet: {
    width: 768,
    height: 1024,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  },
  desktop: {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    isMobile: false
  },
  wide: {
    width: 2560,
    height: 1440,
    deviceScaleFactor: 1,
    isMobile: false
  }
};

export interface CaptureOptions {
  /** URL to capture */
  url: string;
  /** Viewports to capture (presets or custom) */
  viewports?: (ViewportPreset | Viewport)[];
  /** Full page screenshot */
  fullPage?: boolean;
  /** Wait for selector before capturing */
  waitForSelector?: string;
  /** Additional wait time in ms */
  waitTime?: number;
  /** Image quality (0-100) for JPEG */
  quality?: number;
  /** Image type */
  type?: 'png' | 'jpeg';
}

export interface Screenshot {
  /** Viewport used */
  viewport: Viewport;
  /** Screenshot buffer */
  buffer: Buffer;
  /** Dimensions */
  dimensions: {
    width: number;
    height: number;
  };
  /** Timestamp */
  timestamp: Date;
  /** Viewport preset name (if used) */
  presetName?: ViewportPreset;
}

export interface CaptureResult {
  /** URL captured */
  url: string;
  /** All screenshots */
  screenshots: Screenshot[];
  /** Page title */
  title: string;
  /** Capture metadata */
  metadata: {
    totalScreenshots: number;
    captureTime: number; // milliseconds
    timestamp: Date;
  };
}

export interface ComparisonOptions {
  /** First screenshot */
  screenshot1: Buffer;
  /** Second screenshot */
  screenshot2: Buffer;
  /** Diff threshold (0-1) */
  threshold?: number;
}

export interface ComparisonResult {
  /** Are screenshots identical */
  identical: boolean;
  /** Difference percentage (0-100) */
  differencePercentage: number;
  /** Diff image buffer (if available) */
  diffBuffer?: Buffer;
}
