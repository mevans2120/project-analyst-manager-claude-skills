/**
 * WebFetcher - Static HTML Analysis
 * Foundation for all web viewing capabilities
 *
 * This module fetches HTML content from URLs, converts it to markdown,
 * and provides a clean interface for analysis.
 */

import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import TurndownService from 'turndown';
import { FetchOptions, FetchResult, AnalysisOptions, AnalysisResult } from '../types';

export class WebFetcher {
  private turndown: TurndownService;

  constructor() {
    // Initialize markdown converter with sensible defaults
    this.turndown = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      bulletListMarker: '-'
    });
  }

  /**
   * Fetch HTML from a URL and convert to markdown
   */
  async fetch(options: FetchOptions): Promise<FetchResult> {
    const {
      url,
      timeout = 30000,
      headers = {},
      followRedirects = true
    } = options;

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ProjectSuite/1.0)',
          ...headers
        },
        timeout,
        redirect: followRedirects ? 'follow' : 'manual'
      });

      const html = await response.text();
      const markdown = this.turndown.turndown(html);

      return {
        html,
        markdown,
        finalUrl: response.url,
        statusCode: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        timestamp: new Date()
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to fetch ${url}: ${message}`);
    }
  }

  /**
   * Analyze HTML content and extract structured data
   */
  analyze(html: string, options: AnalysisOptions = {}): AnalysisResult {
    const $ = cheerio.load(html);
    const {
      mainContentOnly = true,
      removeNav = true,
      maxLength,
      selectors = []
    } = options;

    // Remove unwanted elements
    if (removeNav) {
      $('nav, header, footer, aside, .sidebar, .navigation').remove();
    }

    // Extract title
    const title = $('title').text().trim() || $('h1').first().text().trim();

    // Extract description
    const description = $('meta[name="description"]').attr('content') ||
                       $('meta[property="og:description"]').attr('content');

    // Extract links
    const links: string[] = [];
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (href) links.push(href);
    });

    // Extract main content
    let text = '';
    if (mainContentOnly) {
      // Try common content selectors
      const contentSelectors = [
        'main',
        'article',
        '[role="main"]',
        '.content',
        '#content',
        ...selectors
      ];

      for (const selector of contentSelectors) {
        const content = $(selector).first();
        if (content.length > 0) {
          text = content.text();
          break;
        }
      }

      // Fallback to body if no content found
      if (!text) {
        text = $('body').text();
      }
    } else {
      text = $('body').text();
    }

    // Clean up text
    text = text
      .replace(/\s+/g, ' ')
      .trim();

    // Truncate if needed
    if (maxLength && text.length > maxLength) {
      text = text.substring(0, maxLength) + '...';
    }

    // Extract structured data
    const data: Record<string, any> = {};

    // Try to extract JSON-LD
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const jsonData = JSON.parse($(el).html() || '{}');
        Object.assign(data, jsonData);
      } catch (e) {
        // Ignore invalid JSON
      }
    });

    return {
      text,
      data,
      title,
      description,
      links: [...new Set(links)] // Deduplicate
    };
  }

  /**
   * Fetch and analyze in one step
   */
  async fetchAndAnalyze(
    fetchOptions: FetchOptions,
    analysisOptions?: AnalysisOptions
  ): Promise<FetchResult & { analysis: AnalysisResult }> {
    const fetchResult = await this.fetch(fetchOptions);
    const analysis = this.analyze(fetchResult.html, analysisOptions);

    return {
      ...fetchResult,
      analysis
    };
  }
}

// Export a singleton instance for convenience
export const webFetcher = new WebFetcher();
