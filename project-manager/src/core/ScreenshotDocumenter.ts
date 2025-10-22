/**
 * Screenshot Documenter - Attach visual evidence to GitHub issues
 * PM-12: Screenshot Documentation for Issues
 *
 * Automatically captures and attaches screenshots to issues:
 * - Code snippets from source files
 * - UI elements for frontend TODOs
 * - Full page screenshots for web features
 * - Before/after comparisons
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { PlaywrightDriver } from '../../../shared/src/core/PlaywrightDriver';
import { ScreenshotCapture } from '../../../shared/src/core/ScreenshotCapture';
import { VisualAnalyzer } from '../../../shared/src/core/FeatureExtractor';
import type { ViewportPreset, Viewport } from '../../../shared/src/types/screenshot';
import type { TodoItem } from '../types';

export interface ScreenshotOptions {
  /** Enable screenshot capture */
  enabled?: boolean;
  /** Output directory for screenshots */
  outputDir?: string;
  /** Capture code snippet screenshots */
  captureCode?: boolean;
  /** Capture UI screenshots (requires URL) */
  captureUI?: boolean;
  /** Include before/after for fixes */
  captureComparison?: boolean;
  /** Upload screenshots to GitHub */
  uploadToGitHub?: boolean;
  /** Base URL for web application (for UI screenshots) */
  baseUrl?: string;
  /** GitHub repository for uploads */
  githubRepo?: {
    owner: string;
    repo: string;
    token: string;
  };
  /** PM-13: Capture multiple viewports (mobile, tablet, desktop) */
  captureMultiViewport?: boolean;
  /** PM-13: Which viewports to capture */
  viewports?: (ViewportPreset | Viewport)[];
}

export interface ScreenshotResult {
  todoHash: string;
  screenshots: Screenshot[];
  success: boolean;
  error?: string;
}

export interface Screenshot {
  type: 'code' | 'ui' | 'full-page' | 'comparison';
  path: string;
  url?: string; // GitHub URL if uploaded
  caption?: string;
  metadata?: {
    file?: string;
    line?: number;
    element?: string;
    viewport?: { width: number; height: number };
    /** PM-14: Comparison metadata */
    comparison?: {
      beforePath: string;
      afterPath: string;
      differencePercentage: number;
      identical: boolean;
    };
  };
}

export class ScreenshotDocumenter {
  private options: Required<ScreenshotOptions>;
  private driver: PlaywrightDriver | null = null;
  private screenshotCapture: ScreenshotCapture | null = null;

  constructor(options: ScreenshotOptions = {}) {
    this.options = {
      enabled: options.enabled ?? true,
      outputDir: options.outputDir || './screenshots',
      captureCode: options.captureCode ?? true,
      captureUI: options.captureUI ?? false,
      captureComparison: options.captureComparison ?? false,
      uploadToGitHub: options.uploadToGitHub ?? false,
      baseUrl: options.baseUrl || '',
      githubRepo: options.githubRepo || { owner: '', repo: '', token: '' },
      captureMultiViewport: options.captureMultiViewport ?? false,
      viewports: options.viewports || ['mobile', 'tablet', 'desktop']
    };
  }

  /**
   * Capture screenshots for a TODO
   */
  async captureForTodo(todo: TodoItem): Promise<ScreenshotResult> {
    if (!this.options.enabled) {
      return {
        todoHash: todo.hash || '',
        screenshots: [],
        success: true
      };
    }

    const screenshots: Screenshot[] = [];

    try {
      // Ensure output directory exists
      await fs.mkdir(this.options.outputDir, { recursive: true });

      // Capture code snippet screenshot
      if (this.options.captureCode && todo.file) {
        const codeScreenshot = await this.captureCodeSnippet(todo);
        if (codeScreenshot) {
          screenshots.push(codeScreenshot);
        }
      }

      // Capture UI screenshot if applicable
      if (this.options.captureUI && this.isUIRelated(todo)) {
        const uiScreenshots = await this.captureUIElement(todo);
        screenshots.push(...uiScreenshots);
      }

      // Upload screenshots to GitHub if enabled
      if (this.options.uploadToGitHub && this.options.githubRepo) {
        for (const screenshot of screenshots) {
          const url = await this.uploadToGitHub(screenshot);
          if (url) {
            screenshot.url = url;
          }
        }
      }

      return {
        todoHash: todo.hash || '',
        screenshots,
        success: true
      };

    } catch (error) {
      return {
        todoHash: todo.hash || '',
        screenshots,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Capture screenshots for multiple TODOs
   */
  async captureForTodos(todos: TodoItem[]): Promise<ScreenshotResult[]> {
    const results: ScreenshotResult[] = [];

    for (const todo of todos) {
      const result = await this.captureForTodo(todo);
      results.push(result);
    }

    return results;
  }

  /**
   * PM-13: Capture multi-viewport screenshots for a URL
   * Useful for responsive testing and visual verification
   */
  async captureMultiViewport(
    url: string,
    options: {
      viewports?: (ViewportPreset | Viewport)[];
      outputPrefix?: string;
      fullPage?: boolean;
    } = {}
  ): Promise<Screenshot[]> {
    const screenshots: Screenshot[] = [];

    try {
      // Initialize Playwright if needed
      if (!this.driver) {
        this.driver = new PlaywrightDriver({ headless: true, browser: 'chromium' });
        await this.driver.launch();
        this.screenshotCapture = new ScreenshotCapture(this.driver);
      }

      const viewports = options.viewports || this.options.viewports;
      const outputPrefix = options.outputPrefix || 'multi-viewport';
      const fullPage = options.fullPage ?? true;

      // Use shared library's multi-viewport capture
      const result = await this.screenshotCapture!.capture({
        url,
        viewports,
        fullPage,
        waitTime: 1000
      });

      // Save all screenshots
      const savedPaths = await this.screenshotCapture!.saveAll(
        result,
        this.options.outputDir,
        outputPrefix
      );

      // Build screenshot results
      for (let i = 0; i < result.screenshots.length; i++) {
        const shot = result.screenshots[i];
        const viewportName = shot.presetName || `${shot.viewport.width}x${shot.viewport.height}`;

        screenshots.push({
          type: 'full-page',
          path: savedPaths[i],
          caption: `${viewportName} view of ${result.title || url}`,
          metadata: {
            viewport: {
              width: shot.viewport.width,
              height: shot.viewport.height
            }
          }
        });
      }

      return screenshots;
    } catch (error) {
      console.error('Failed to capture multi-viewport screenshots:', error);
      return screenshots;
    }
  }

  /**
   * PM-14: Capture before/after screenshots and compare
   * Useful for detecting visual regressions
   */
  async captureBeforeAfter(
    beforeUrl: string,
    afterUrl: string,
    options: {
      viewport?: ViewportPreset | Viewport;
      outputPrefix?: string;
      threshold?: number; // Difference threshold (0-1)
    } = {}
  ): Promise<Screenshot[]> {
    const screenshots: Screenshot[] = [];

    try {
      // Initialize Playwright if needed
      if (!this.driver) {
        this.driver = new PlaywrightDriver({ headless: true, browser: 'chromium' });
        await this.driver.launch();
        this.screenshotCapture = new ScreenshotCapture(this.driver);
      }

      const viewport = options.viewport || 'desktop';
      const outputPrefix = options.outputPrefix || 'comparison';
      const threshold = options.threshold || 0.1;

      // Capture before screenshot
      const beforeResult = await this.screenshotCapture!.capture({
        url: beforeUrl,
        viewports: [viewport],
        fullPage: true,
        waitTime: 1000
      });

      const beforeShot = beforeResult.screenshots[0];
      const beforePath = path.join(this.options.outputDir, `${outputPrefix}-before.png`);
      await this.screenshotCapture!.saveToFile(beforeShot, beforePath);

      // Capture after screenshot
      const afterResult = await this.screenshotCapture!.capture({
        url: afterUrl,
        viewports: [viewport],
        fullPage: true,
        waitTime: 1000
      });

      const afterShot = afterResult.screenshots[0];
      const afterPath = path.join(this.options.outputDir, `${outputPrefix}-after.png`);
      await this.screenshotCapture!.saveToFile(afterShot, afterPath);

      // Compare screenshots
      const comparison = await this.screenshotCapture!.compare({
        screenshot1: beforeShot.buffer,
        screenshot2: afterShot.buffer,
        threshold
      });

      // Create comparison screenshot entry
      const comparisonPath = path.join(this.options.outputDir, `${outputPrefix}-comparison.png`);

      // For now, we'll just save the after screenshot as the comparison
      // In a production system, you'd generate a diff image highlighting differences
      await fs.copyFile(afterPath, comparisonPath);

      screenshots.push({
        type: 'comparison',
        path: comparisonPath,
        caption: comparison.identical
          ? 'No visual differences detected'
          : `Visual changes detected (${comparison.differencePercentage.toFixed(2)}% different)`,
        metadata: {
          comparison: {
            beforePath,
            afterPath,
            differencePercentage: comparison.differencePercentage,
            identical: comparison.identical
          }
        }
      });

      return screenshots;
    } catch (error) {
      console.error('Failed to capture before/after comparison:', error);
      return screenshots;
    }
  }

  /**
   * PM-14: Compare two existing screenshot files
   */
  async compareScreenshots(
    beforePath: string,
    afterPath: string,
    options: {
      outputPrefix?: string;
      threshold?: number;
    } = {}
  ): Promise<Screenshot | null> {
    try {
      // Initialize screenshot capture if needed
      if (!this.screenshotCapture) {
        if (!this.driver) {
          this.driver = new PlaywrightDriver({ headless: true, browser: 'chromium' });
          await this.driver.launch();
        }
        this.screenshotCapture = new ScreenshotCapture(this.driver);
      }

      const outputPrefix = options.outputPrefix || 'comparison';
      const threshold = options.threshold || 0.1;

      // Read screenshot files
      const beforeBuffer = await fs.readFile(beforePath);
      const afterBuffer = await fs.readFile(afterPath);

      // Compare
      const comparison = await this.screenshotCapture!.compare({
        screenshot1: beforeBuffer,
        screenshot2: afterBuffer,
        threshold
      });

      // Create comparison result
      const comparisonPath = path.join(this.options.outputDir, `${outputPrefix}-result.png`);
      await fs.copyFile(afterPath, comparisonPath);

      return {
        type: 'comparison',
        path: comparisonPath,
        caption: comparison.identical
          ? 'Screenshots are identical'
          : `Difference: ${comparison.differencePercentage.toFixed(2)}%`,
        metadata: {
          comparison: {
            beforePath,
            afterPath,
            differencePercentage: comparison.differencePercentage,
            identical: comparison.identical
          }
        }
      };
    } catch (error) {
      console.error('Failed to compare screenshots:', error);
      return null;
    }
  }

  /**
   * PM-15: Scan UI for visual bugs and potential issues
   * Returns a list of detected bugs as TodoItems that can be auto-converted to issues
   */
  async scanUIForBugs(
    url: string,
    options: {
      viewport?: ViewportPreset | Viewport;
      checkAccessibility?: boolean;
      checkLayout?: boolean;
      checkPerformance?: boolean;
    } = {}
  ): Promise<TodoItem[]> {
    const bugs: TodoItem[] = [];

    try {
      // Initialize Playwright if needed
      if (!this.driver) {
        this.driver = new PlaywrightDriver({ headless: true, browser: 'chromium' });
        await this.driver.launch();
        this.screenshotCapture = new ScreenshotCapture(this.driver);
      }

      // Navigate to URL
      await this.driver.navigate({ url, waitUntil: 'networkidle' });

      // Create visual analyzer
      const visualAnalyzer = new VisualAnalyzer(this.driver);
      const elements = await visualAnalyzer.analyze();

      // Check for accessibility issues
      if (options.checkAccessibility !== false) {
        const a11yBugs = await this.checkAccessibilityIssues(elements);
        bugs.push(...a11yBugs);
      }

      // Check for layout issues
      if (options.checkLayout !== false) {
        const layoutBugs = await this.checkLayoutIssues();
        bugs.push(...layoutBugs);
      }

      // Check for broken images
      const imageBugs = await this.checkBrokenImages();
      bugs.push(...imageBugs);

      // Check for missing alt text
      const altTextBugs = await this.checkMissingAltText(elements);
      bugs.push(...altTextBugs);

      return bugs;
    } catch (error) {
      console.error('Failed to scan UI for bugs:', error);
      return bugs;
    }
  }

  /**
   * PM-15: Check for accessibility issues
   */
  private async checkAccessibilityIssues(elements: any[]): Promise<TodoItem[]> {
    const bugs: TodoItem[] = [];

    // Check for buttons without text
    const buttons = elements.filter(el => el.type === 'button');
    for (const button of buttons) {
      if (!button.text || button.text.trim().length === 0) {
        bugs.push({
          file: 'ui-scan',
          line: 0,
          type: 'BUG',
          priority: 'high',
          category: 'ui-scan',
          content: `Button without text or aria-label found: ${button.selector}`,
          hash: this.generateHash(`button-no-text-${button.selector}`),
          rawText: `BUG: Accessibility - Button without text at ${button.selector}`
        });
      }
    }

    // Check for links without text
    const links = elements.filter(el => el.type === 'link');
    for (const link of links) {
      if (!link.text || link.text.trim().length === 0) {
        bugs.push({
          file: 'ui-scan',
          line: 0,
          type: 'BUG',
          priority: 'high',
          category: 'ui-scan',
          content: `Link without text found: ${link.selector}`,
          hash: this.generateHash(`link-no-text-${link.selector}`),
          rawText: `BUG: Accessibility - Link without text at ${link.selector}`
        });
      }
    }

    // Check for inputs without labels
    const inputs = elements.filter(el => el.type === 'input');
    for (const input of inputs) {
      if (!input.attributes['aria-label'] && !input.attributes['id']) {
        bugs.push({
          file: 'ui-scan',
          line: 0,
          type: 'BUG',
          priority: 'medium',
          category: 'ui-scan',
          content: `Input field without label or aria-label: ${input.selector}`,
          hash: this.generateHash(`input-no-label-${input.selector}`),
          rawText: `BUG: Accessibility - Input without label at ${input.selector}`
        });
      }
    }

    return bugs;
  }

  /**
   * PM-15: Check for layout issues
   */
  private async checkLayoutIssues(): Promise<TodoItem[]> {
    const bugs: TodoItem[] = [];

    try {
      // Check for overlapping elements
      const overlapping = await this.driver!.evaluate<any[]>(`
        (() => {
          const elements = Array.from(document.querySelectorAll('div, button, a, input'));
          const overlaps = [];

          for (let i = 0; i < elements.length; i++) {
            const rect1 = elements[i].getBoundingClientRect();
            if (rect1.width === 0 || rect1.height === 0) continue;

            for (let j = i + 1; j < elements.length; j++) {
              const rect2 = elements[j].getBoundingClientRect();
              if (rect2.width === 0 || rect2.height === 0) continue;

              // Check if rectangles overlap
              if (!(rect1.right < rect2.left ||
                    rect1.left > rect2.right ||
                    rect1.bottom < rect2.top ||
                    rect1.top > rect2.bottom)) {
                overlaps.push({
                  el1: elements[i].tagName + (elements[i].className ? '.' + elements[i].className.split(' ')[0] : ''),
                  el2: elements[j].tagName + (elements[j].className ? '.' + elements[j].className.split(' ')[0] : '')
                });
                break;
              }
            }

            if (overlaps.length >= 5) break; // Limit to first 5
          }

          return overlaps;
        })()
      `);

      for (const overlap of overlapping) {
        bugs.push({
          file: 'ui-scan',
          line: 0,
          type: 'BUG',
          priority: 'medium',
          category: 'ui-scan',
          content: `Possible overlapping elements: ${overlap.el1} and ${overlap.el2}`,
          hash: this.generateHash(`overlap-${overlap.el1}-${overlap.el2}`),
          rawText: `BUG: Layout - Overlapping elements detected`
        });
      }

      // Check for elements outside viewport
      const outsideViewport = await this.driver!.evaluate<any[]>(`
        Array.from(document.querySelectorAll('*')).filter(el => {
          const rect = el.getBoundingClientRect();
          return rect.right < 0 || rect.bottom < 0 ||
                 rect.left > window.innerWidth || rect.top > window.innerHeight;
        }).slice(0, 5).map(el => el.tagName + (el.className ? '.' + el.className.split(' ')[0] : ''))
      `);

      for (const element of outsideViewport) {
        bugs.push({
          file: 'ui-scan',
          line: 0,
          type: 'BUG',
          priority: 'low',
          category: 'ui-scan',
          content: `Element outside viewport: ${element}`,
          hash: this.generateHash(`outside-viewport-${element}`),
          rawText: `BUG: Layout - Element outside viewport`
        });
      }
    } catch (error) {
      console.warn('Failed to check layout issues:', error);
    }

    return bugs;
  }

  /**
   * PM-15: Check for broken images
   */
  private async checkBrokenImages(): Promise<TodoItem[]> {
    const bugs: TodoItem[] = [];

    try {
      const brokenImages = await this.driver!.evaluate<any[]>(`
        Array.from(document.querySelectorAll('img')).filter(img => {
          return !img.complete || img.naturalHeight === 0;
        }).map(img => ({
          src: img.src,
          alt: img.alt
        }))
      `);

      for (const img of brokenImages) {
        bugs.push({
          file: 'ui-scan',
          line: 0,
          type: 'BUG',
          priority: 'high',
          category: 'ui-scan',
          content: `Broken image: ${img.src}`,
          hash: this.generateHash(`broken-image-${img.src}`),
          rawText: `BUG: Broken image at ${img.src}`
        });
      }
    } catch (error) {
      console.warn('Failed to check broken images:', error);
    }

    return bugs;
  }

  /**
   * PM-15: Check for missing alt text on images
   */
  private async checkMissingAltText(elements: any[]): Promise<TodoItem[]> {
    const bugs: TodoItem[] = [];

    const images = elements.filter(el => el.type === 'image');
    for (const img of images) {
      if (!img.attributes.alt || img.attributes.alt.trim().length === 0) {
        bugs.push({
          file: 'ui-scan',
          line: 0,
          type: 'BUG',
          priority: 'medium',
          category: 'ui-scan',
          content: `Image missing alt text: ${img.attributes.src || img.selector}`,
          hash: this.generateHash(`missing-alt-${img.selector}`),
          rawText: `BUG: Accessibility - Image missing alt text`
        });
      }
    }

    return bugs;
  }

  /**
   * Generate simple hash for bug deduplication
   */
  private generateHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Capture code snippet screenshot
   */
  private async captureCodeSnippet(todo: TodoItem): Promise<Screenshot | null> {
    try {
      // Read the source file
      const content = await fs.readFile(todo.file, 'utf-8');
      const lines = content.split('\n');

      // Extract context around the TODO line
      const contextRadius = 5;
      const startLine = Math.max(0, (todo.line || 1) - 1 - contextRadius);
      const endLine = Math.min(lines.length, (todo.line || 1) + contextRadius);
      const snippet = lines.slice(startLine, endLine);

      // Generate HTML for the code snippet
      const html = this.generateCodeSnippetHTML(
        snippet,
        todo.file,
        startLine + 1,
        (todo.line || 1) - startLine,
        path.extname(todo.file).substring(1)
      );

      // Create a temporary HTML file
      const tempHtmlPath = path.join(this.options.outputDir, `temp-${todo.hash}.html`);
      await fs.writeFile(tempHtmlPath, html, 'utf-8');

      // Initialize Playwright if needed
      if (!this.driver) {
        this.driver = new PlaywrightDriver({ headless: true, browser: 'chromium' });
        await this.driver.launch();
        this.screenshotCapture = new ScreenshotCapture(this.driver);
      }

      // Navigate to the HTML file
      await this.driver.navigate({ url: `file://${path.resolve(tempHtmlPath)}`, waitUntil: 'networkidle' });

      // Capture screenshot
      const screenshotPath = path.join(
        this.options.outputDir,
        `code-${todo.hash}.png`
      );

      // Capture screenshot using driver's screenshot method
      const screenshot = await this.driver.screenshot({
        fullPage: false,
        path: screenshotPath
      });

      // Clean up temp file
      await fs.unlink(tempHtmlPath);

      return {
        type: 'code',
        path: screenshotPath,
        caption: `Code context for ${path.basename(todo.file)}:${todo.line}`,
        metadata: {
          file: todo.file,
          line: todo.line
        }
      };

    } catch (error) {
      console.warn(`Failed to capture code screenshot for ${todo.file}:`, error);
      return null;
    }
  }

  /**
   * Generate HTML for code snippet
   */
  private generateCodeSnippetHTML(
    lines: string[],
    filename: string,
    startLine: number,
    highlightLine: number,
    language: string
  ): string {
    const escapedLines = lines.map(line => this.escapeHtml(line));

    const linesHTML = escapedLines.map((line, index) => {
      const lineNumber = startLine + index;
      const isHighlight = index === highlightLine - 1;

      return `
        <div class="line ${isHighlight ? 'highlight' : ''}">
          <span class="line-number">${lineNumber}</span>
          <span class="line-content">${line || ' '}</span>
        </div>
      `;
    }).join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      background: #0d1117;
      color: #c9d1d9;
      padding: 20px;
    }
    .code-container {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 6px;
      padding: 16px;
      display: inline-block;
      min-width: 600px;
    }
    .header {
      color: #8b949e;
      font-size: 14px;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #30363d;
    }
    .line {
      display: flex;
      line-height: 1.5;
      font-size: 13px;
    }
    .line.highlight {
      background: rgba(88, 166, 255, 0.15);
      border-left: 3px solid #58a6ff;
      padding-left: 8px;
    }
    .line-number {
      color: #6e7681;
      min-width: 40px;
      text-align: right;
      margin-right: 16px;
      user-select: none;
    }
    .line-content {
      color: #c9d1d9;
      white-space: pre;
    }
  </style>
</head>
<body>
  <div class="code-container">
    <div class="header">${filename} (${language})</div>
    ${linesHTML}
  </div>
</body>
</html>
    `;
  }

  /**
   * Escape HTML entities
   */
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Capture UI element screenshot
   */
  private async captureUIElement(todo: TodoItem): Promise<Screenshot[]> {
    const screenshots: Screenshot[] = [];

    try {
      // Initialize Playwright if needed
      if (!this.driver) {
        this.driver = new PlaywrightDriver({ headless: true, browser: 'chromium' });
        await this.driver.launch();
        this.screenshotCapture = new ScreenshotCapture(this.driver);
      }

      // Determine URL from TODO context
      const url = this.extractURLFromTodo(todo);
      if (!url) {
        console.warn('No URL found for UI screenshot');
        return screenshots;
      }

      // PM-13: Multi-viewport capture if enabled
      if (this.options.captureMultiViewport) {
        const result = await this.screenshotCapture!.capture({
          url,
          viewports: this.options.viewports,
          fullPage: true,
          waitTime: 1000
        });

        // Save all viewport screenshots
        const savedPaths = await this.screenshotCapture!.saveAll(
          result,
          this.options.outputDir,
          `ui-${todo.hash}`
        );

        // Add screenshots to result
        for (let i = 0; i < result.screenshots.length; i++) {
          const shot = result.screenshots[i];
          const viewportName = shot.presetName || `${shot.viewport.width}x${shot.viewport.height}`;

          screenshots.push({
            type: 'full-page',
            path: savedPaths[i],
            caption: `${viewportName} view of ${url}`,
            metadata: {
              viewport: {
                width: shot.viewport.width,
                height: shot.viewport.height
              }
            }
          });
        }
      } else {
        // Single viewport capture (legacy behavior)
        await this.driver.navigate({ url, waitUntil: 'networkidle' });

        // Capture full page screenshot
        const fullPagePath = path.join(
          this.options.outputDir,
          `ui-full-${todo.hash}.png`
        );

        // Capture full page using ScreenshotCapture.captureSingle and save
        const screenshotResult = await this.screenshotCapture!.captureSingle(url, 'desktop');
        await this.screenshotCapture!.saveToFile(screenshotResult, fullPagePath);

        screenshots.push({
          type: 'full-page',
          path: fullPagePath,
          caption: `Full page screenshot of ${url}`,
          metadata: {
            viewport: { width: 1920, height: 1080 }
          }
        });

        // Try to capture specific element if selector is in TODO
        const selector = this.extractSelectorFromTodo(todo);
        if (selector) {
          try {
            const elementPath = path.join(
              this.options.outputDir,
              `ui-element-${todo.hash}.png`
            );

            // Capture element screenshot using driver
            await this.driver.waitFor({ selector });
            const elementScreenshot = await this.driver.screenshot({
              fullPage: false,
              path: elementPath
            });

            screenshots.push({
              type: 'ui',
              path: elementPath,
              caption: `UI element: ${selector}`,
              metadata: {
                element: selector
              }
            });
          } catch (error) {
            console.warn(`Failed to capture element ${selector}:`, error);
          }
        }
      }

    } catch (error) {
      console.warn('Failed to capture UI screenshots:', error);
    }

    return screenshots;
  }

  /**
   * Check if TODO is UI-related
   */
  private isUIRelated(todo: TodoItem): boolean {
    const uiKeywords = ['ui', 'button', 'form', 'component', 'layout', 'style', 'css', 'frontend', 'view', 'page', 'modal', 'dialog'];

    const text = `${todo.content} ${todo.file}`.toLowerCase();

    return uiKeywords.some(keyword => text.includes(keyword));
  }

  /**
   * Extract URL from TODO content
   */
  private extractURLFromTodo(todo: TodoItem): string | null {
    // Try to extract URL from TODO content
    const urlMatch = todo.content.match(/https?:\/\/[^\s]+/);
    if (urlMatch) {
      return urlMatch[0];
    }

    // Try to construct URL from file path
    if (this.options.baseUrl && todo.file) {
      // Convert file path to route (simple heuristic)
      // e.g., src/pages/dashboard.tsx -> /dashboard
      const routeMatch = todo.file.match(/pages\/([^/]+)\.(tsx?|jsx?)$/);
      if (routeMatch) {
        return `${this.options.baseUrl}/${routeMatch[1]}`;
      }
    }

    return null;
  }

  /**
   * Extract CSS selector from TODO content
   */
  private extractSelectorFromTodo(todo: TodoItem): string | null {
    // Look for common selector patterns in TODO content
    const patterns = [
      /['"]([.#][a-zA-Z0-9_-]+)['"]/,  // .class or #id
      /\[data-testid=['"]([^'"]+)['"]\]/,  // data-testid
      /className=['"]([^'"]+)['"]/  // className
    ];

    for (const pattern of patterns) {
      const match = todo.content.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Upload screenshot to GitHub
   */
  private async uploadToGitHub(screenshot: Screenshot): Promise<string | null> {
    if (!this.options.githubRepo) {
      return null;
    }

    try {
      // Read screenshot file as base64
      const imageBuffer = await fs.readFile(screenshot.path);
      const base64Image = imageBuffer.toString('base64');

      // GitHub doesn't support direct image uploads to issues
      // Options:
      // 1. Create a gist with the image
      // 2. Embed as base64 in markdown (not recommended for large images)
      // 3. Upload to GitHub repository as an asset
      // 4. Use external image hosting

      // For now, we'll return a data URL that can be embedded in markdown
      const ext = path.extname(screenshot.path).substring(1);
      const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';

      return `data:${mimeType};base64,${base64Image}`;

    } catch (error) {
      console.error('Failed to upload screenshot to GitHub:', error);
      return null;
    }
  }

  /**
   * Format screenshots for GitHub issue body
   */
  formatScreenshotsForIssue(screenshots: Screenshot[]): string {
    if (screenshots.length === 0) {
      return '';
    }

    const lines: string[] = [];
    lines.push('');
    lines.push('## Screenshots');
    lines.push('');

    // PM-14: Handle comparison screenshots specially
    const comparisonScreenshots = screenshots.filter(s => s.type === 'comparison');
    const otherScreenshots = screenshots.filter(s => s.type !== 'comparison');

    // Display comparison screenshots first
    if (comparisonScreenshots.length > 0) {
      lines.push('### Visual Comparison');
      lines.push('');

      for (const screenshot of comparisonScreenshots) {
        const comp = screenshot.metadata?.comparison;
        if (comp) {
          lines.push(`**Result**: ${screenshot.caption}`);
          lines.push('');

          // Before and After side-by-side
          lines.push('| Before | After |');
          lines.push('| --- | --- |');

          const beforeImg = `![Before](${comp.beforePath})`;
          const afterImg = `![After](${comp.afterPath})`;
          lines.push(`| ${beforeImg} | ${afterImg} |`);
          lines.push('');

          lines.push(`**Difference**: ${comp.differencePercentage.toFixed(2)}%`);
          lines.push('');
        }
      }
    }

    // PM-13: Group screenshots by viewport if multiple viewports present
    const hasMultipleViewports = otherScreenshots.some(s =>
      s.metadata?.viewport &&
      otherScreenshots.filter(ss => ss.metadata?.viewport).length > 1
    );

    if (hasMultipleViewports) {
      lines.push('### Responsive Views');
      lines.push('');

      // Create a comparison table for multi-viewport screenshots
      const viewportScreenshots = otherScreenshots.filter(s => s.metadata?.viewport);
      if (viewportScreenshots.length > 0) {
        // Table header
        const viewportNames = viewportScreenshots
          .map(s => {
            const vp = s.metadata!.viewport!;
            return `${vp.width}x${vp.height}`;
          })
          .join(' | ');

        lines.push(`| ${viewportNames} |`);
        lines.push(`| ${viewportScreenshots.map(() => '---').join(' | ')} |`);

        // Table row with images
        const imageRow = viewportScreenshots
          .map(s => {
            const imgSrc = s.url || s.path;
            const caption = s.caption || s.type;
            return `![${caption}](${imgSrc})`;
          })
          .join(' | ');

        lines.push(`| ${imageRow} |`);
        lines.push('');
      }
    } else if (otherScreenshots.length > 0) {
      // Standard formatting for non-multi-viewport screenshots
      for (const screenshot of otherScreenshots) {
        if (screenshot.caption) {
          lines.push(`### ${screenshot.caption}`);
          lines.push('');
        }

        if (screenshot.url) {
          // Use URL if available
          lines.push(`![${screenshot.caption || screenshot.type}](${screenshot.url})`);
        } else {
          // Include file path for local reference
          lines.push(`![${screenshot.caption || screenshot.type}](${screenshot.path})`);
        }

        lines.push('');

        // Add metadata if available
        if (screenshot.metadata) {
          if (screenshot.metadata.file && screenshot.metadata.line) {
            lines.push(`**Location**: \`${screenshot.metadata.file}:${screenshot.metadata.line}\``);
            lines.push('');
          }
          if (screenshot.metadata.element) {
            lines.push(`**Element**: \`${screenshot.metadata.element}\``);
            lines.push('');
          }
        }
      }
    }

    return lines.join('\n');
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    if (this.driver) {
      await this.driver.close();
      this.driver = null;
      this.screenshotCapture = null;
    }
  }

  /**
   * Get screenshot statistics
   */
  getStatistics(results: ScreenshotResult[]): {
    total: number;
    successful: number;
    failed: number;
    totalScreenshots: number;
    byType: Record<string, number>;
  } {
    const stats = {
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      totalScreenshots: 0,
      byType: {} as Record<string, number>
    };

    for (const result of results) {
      stats.totalScreenshots += result.screenshots.length;

      for (const screenshot of result.screenshots) {
        stats.byType[screenshot.type] = (stats.byType[screenshot.type] || 0) + 1;
      }
    }

    return stats;
  }
}
