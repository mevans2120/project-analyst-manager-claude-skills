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
      githubRepo: options.githubRepo || null
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
      await this.driver.navigateTo(`file://${path.resolve(tempHtmlPath)}`);

      // Capture screenshot
      const screenshotPath = path.join(
        this.options.outputDir,
        `code-${todo.hash}.png`
      );

      await this.screenshotCapture!.captureElement(
        '.code-container',
        screenshotPath
      );

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

      // Navigate to URL
      await this.driver.navigateTo(url);
      await this.driver.page.waitForLoadState('networkidle');

      // Capture full page screenshot
      const fullPagePath = path.join(
        this.options.outputDir,
        `ui-full-${todo.hash}.png`
      );

      await this.screenshotCapture!.captureFullPage(fullPagePath);

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

          await this.screenshotCapture!.captureElement(selector, elementPath);

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

    for (const screenshot of screenshots) {
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
