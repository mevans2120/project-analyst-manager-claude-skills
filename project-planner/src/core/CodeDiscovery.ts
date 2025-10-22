/**
 * Code-Based Feature Discovery
 * Analyze React routes, Express endpoints, and config files to discover features
 *
 * This module scans codebases to automatically discover implemented features
 * by analyzing routing, API endpoints, and configuration files.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import {
  DiscoveryOptions,
  DiscoveredFeature,
  DiscoveryResult,
  ReactRoute,
  ExpressEndpoint,
  ConfigFeature
} from '../types/discovery';

export class CodeDiscovery {
  private options: DiscoveryOptions;

  constructor(options: DiscoveryOptions) {
    this.options = {
      includePatterns: ['**/*.{js,jsx,ts,tsx,json}'],
      excludePatterns: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.next/**'],
      frameworks: [],
      ...options
    };
  }

  /**
   * Discover features from codebase
   */
  async discover(): Promise<DiscoveryResult> {
    const startTime = performance.now();
    const features: DiscoveredFeature[] = [];
    let filesScanned = 0;

    // Scan directory
    const files = await this.scanDirectory(this.options.rootDir);
    filesScanned = files.length;

    // Analyze each file
    for (const file of files) {
      const fileFeatures = await this.analyzeFile(file);
      features.push(...fileFeatures);
    }

    const scanTime = performance.now() - startTime;

    return {
      features,
      filesScanned,
      metadata: {
        rootDir: this.options.rootDir,
        frameworks: this.options.frameworks || [],
        scanTime,
        timestamp: new Date()
      }
    };
  }

  /**
   * Scan directory for relevant files
   */
  private async scanDirectory(dir: string): Promise<string[]> {
    const files: string[] = [];

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        // Skip excluded patterns
        if (this.shouldExclude(fullPath)) {
          continue;
        }

        if (entry.isDirectory()) {
          const subFiles = await this.scanDirectory(fullPath);
          files.push(...subFiles);
        } else if (entry.isFile() && this.shouldInclude(fullPath)) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }

    return files;
  }

  /**
   * Check if file should be excluded
   */
  private shouldExclude(filepath: string): boolean {
    const excludePatterns = this.options.excludePatterns || [];
    return excludePatterns.some(pattern => {
      // Simple matching for common exclude patterns like **/node_modules/**
      const simpleExcludePattern = /^\*\*\/([^/]+)\/\*\*$/;
      const match = pattern.match(simpleExcludePattern);
      if (match) {
        const dirName = match[1];
        return filepath.includes(`/${dirName}/`) || filepath.includes(`\\${dirName}\\`);
      }

      // Fall back to regex matching
      const regex = this.globToRegex(pattern);
      return regex.test(filepath);
    });
  }

  /**
   * Check if file should be included
   */
  private shouldInclude(filepath: string): boolean {
    const includePatterns = this.options.includePatterns || [];
    const ext = path.extname(filepath);

    return includePatterns.some(pattern => {
      // Simple extension-based matching for common patterns
      if (pattern.includes('{js,jsx,ts,tsx')) {
        const validExts = ['.js', '.jsx', '.ts', '.tsx', '.json'];
        return validExts.includes(ext);
      }

      // For simple **/*.ext patterns, just check the extension
      const simpleExtPattern = /^\*\*\/\*\.(\w+)$/;
      const match = pattern.match(simpleExtPattern);
      if (match) {
        return ext === `.${match[1]}`;
      }

      // For other patterns, use regex matching
      const regex = this.globToRegex(pattern);
      return regex.test(filepath);
    });
  }

  /**
   * Convert glob pattern to regex
   */
  private globToRegex(pattern: string): RegExp {
    const braceGroups: string[] = [];

    // Handle brace expansion {js,jsx,ts,tsx} -> save as placeholder
    let escaped = pattern.replace(/\{([^}]+)\}/g, (_, group) => {
      const index = braceGroups.length;
      braceGroups.push(`(${group.split(',').join('|')})`);
      return `__BRACE_${index}__`;
    });

    // Escape special regex characters
    escaped = escaped.replace(/\./g, '\\.');

    // Temporarily replace ** patterns to avoid confusion with single *
    escaped = escaped.replace(/\*\*\//g, '<GLOBSTAR_SLASH>'); // **/ prefix
    escaped = escaped.replace(/\/\*\*/g, '<SLASH_GLOBSTAR>'); // /** suffix
    escaped = escaped.replace(/\*\*/g, '<GLOBSTAR>'); // ** standalone

    // Replace single * with regex that matches anything except /
    escaped = escaped.replace(/\*/g, '[^/]*');

    // Replace **/ with optional path prefix
    escaped = escaped.replace(/<GLOBSTAR_SLASH>/g, '(?:.*/)?');
    // Replace /** with /followed by anything
    escaped = escaped.replace(/<SLASH_GLOBSTAR>/g, '/.*');
    // Replace standalone ** with .*
    escaped = escaped.replace(/<GLOBSTAR>/g, '.*');

    // Replace ? with .
    escaped = escaped.replace(/\?/g, '.');

    // Restore brace expansion groups
    escaped = escaped.replace(/__BRACE_(\d+)__/g, (_, index) => {
      return braceGroups[parseInt(index, 10)];
    });

    return new RegExp(escaped);
  }

  /**
   * Analyze a single file for features
   */
  private async analyzeFile(filepath: string): Promise<DiscoveredFeature[]> {
    const content = await fs.readFile(filepath, 'utf-8');
    const features: DiscoveredFeature[] = [];

    // Determine file type
    const ext = path.extname(filepath);

    if (['.js', '.jsx', '.ts', '.tsx'].includes(ext)) {
      // Analyze JavaScript/TypeScript files
      features.push(...this.analyzeReactRoutes(content, filepath));
      features.push(...this.analyzeExpressEndpoints(content, filepath));
      features.push(...this.analyzeComponents(content, filepath));
    } else if (ext === '.json') {
      // Analyze config files
      features.push(...this.analyzeConfigFile(content, filepath));
    }

    return features;
  }

  /**
   * Analyze React Router routes
   */
  private analyzeReactRoutes(content: string, filepath: string): DiscoveredFeature[] {
    const features: DiscoveredFeature[] = [];
    const lines = content.split('\n');

    // Pattern: <Route path="/..." component={...} /> or <Route path="/..." />
    // Allow optional whitespace between Route and path
    const routeRegex = /<Route\s*path=["']([^"']+)["']/g;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let match;

      // Reset regex state for each line
      routeRegex.lastIndex = 0;

      while ((match = routeRegex.exec(line)) !== null) {
        const [, routePath] = match;

        features.push({
          name: this.pathToFeatureName(routePath),
          type: 'route',
          filePath: filepath,
          lineNumber: i + 1,
          path: routePath,
          description: this.extractCommentAbove(lines, i),
          confidence: 90
        });
      }
    }

    // Pattern: path: "/..." (Next.js style, React Router config)
    const pathRegex = /path:\s*["']([^"']+)["']/g;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let match;

      // Reset regex state for each line
      pathRegex.lastIndex = 0;

      while ((match = pathRegex.exec(line)) !== null) {
        const [, routePath] = match;

        features.push({
          name: this.pathToFeatureName(routePath),
          type: 'route',
          filePath: filepath,
          lineNumber: i + 1,
          path: routePath,
          description: this.extractCommentAbove(lines, i),
          confidence: 80
        });
      }
    }

    return features;
  }

  /**
   * Analyze Express endpoints
   */
  private analyzeExpressEndpoints(content: string, filepath: string): DiscoveredFeature[] {
    const features: DiscoveredFeature[] = [];
    const lines = content.split('\n');

    // Pattern: app.get('/...', ...)  or  router.post('/...', ...)
    const endpointRegex = /(app|router)\.(get|post|put|patch|delete)\(["']([^"']+)["']/g;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let match;

      while ((match = endpointRegex.exec(line)) !== null) {
        const [, , method, endpointPath] = match;

        features.push({
          name: this.pathToFeatureName(endpointPath),
          type: 'endpoint',
          filePath: filepath,
          lineNumber: i + 1,
          path: endpointPath,
          method: method.toUpperCase(),
          description: this.extractCommentAbove(lines, i),
          confidence: 95
        });
      }
    }

    return features;
  }

  /**
   * Analyze React components
   */
  private analyzeComponents(content: string, filepath: string): DiscoveredFeature[] {
    const features: DiscoveredFeature[] = [];
    const lines = content.split('\n');

    // Pattern: export default function ComponentName
    // Pattern: export const ComponentName = () =>
    const componentRegex = /export\s+(default\s+)?(function|const)\s+([A-Z][a-zA-Z0-9]*)/g;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let match;

      while ((match = componentRegex.exec(line)) !== null) {
        const [, , , componentName] = match;

        // Skip if it's a generic name
        if (['App', 'Index', 'Main'].includes(componentName)) {
          continue;
        }

        features.push({
          name: componentName,
          type: 'component',
          filePath: filepath,
          lineNumber: i + 1,
          description: this.extractCommentAbove(lines, i),
          confidence: 75
        });
      }
    }

    return features;
  }

  /**
   * Analyze config files (package.json, etc.)
   */
  private analyzeConfigFile(content: string, filepath: string): DiscoveredFeature[] {
    const features: DiscoveredFeature[] = [];

    try {
      const config = JSON.parse(content);

      // Check for package.json scripts
      if (config.scripts) {
        Object.keys(config.scripts).forEach(scriptName => {
          features.push({
            name: `Script: ${scriptName}`,
            type: 'config',
            filePath: filepath,
            description: `NPM script: ${config.scripts[scriptName]}`,
            confidence: 100
          });
        });
      }

      // Check for dependencies that indicate features
      if (config.dependencies || config.devDependencies) {
        const allDeps = { ...config.dependencies, ...config.devDependencies };

        // Notable dependencies that indicate features
        const featureDeps = {
          'express': 'REST API',
          'next': 'Next.js App',
          'react-router': 'Client-side Routing',
          'graphql': 'GraphQL API',
          'socket.io': 'WebSocket Support',
          'passport': 'Authentication',
          'stripe': 'Payment Processing',
          'nodemailer': 'Email Sending',
          'mongoose': 'MongoDB Database',
          'sequelize': 'SQL Database',
          'redis': 'Redis Caching',
          'jest': 'Testing',
          'typescript': 'TypeScript'
        };

        Object.entries(featureDeps).forEach(([dep, feature]) => {
          if (allDeps[dep]) {
            features.push({
              name: feature,
              type: 'config',
              filePath: filepath,
              description: `Detected from dependency: ${dep}`,
              confidence: 85
            });
          }
        });
      }
    } catch (error) {
      // Invalid JSON, skip
    }

    return features;
  }

  /**
   * Convert URL path to feature name
   */
  private pathToFeatureName(routePath: string): string {
    // Remove leading slash and parameters
    let name = routePath.replace(/^\//, '').replace(/:[^/]+/g, 'item');

    // Convert to title case
    name = name
      .split(/[-_/]/)
      .filter(part => part.length > 0)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');

    return name || 'Home';
  }

  /**
   * Extract comment above a line
   */
  private extractCommentAbove(lines: string[], lineIndex: number): string | undefined {
    if (lineIndex === 0) return undefined;

    const prevLine = lines[lineIndex - 1].trim();

    // Single-line comment
    if (prevLine.startsWith('//')) {
      return prevLine.replace(/^\/\/\s*/, '');
    }

    // Multi-line comment end
    if (prevLine.includes('*/')) {
      let comment = '';
      for (let i = lineIndex - 1; i >= 0; i--) {
        const line = lines[i].trim();
        comment = line + ' ' + comment;

        if (line.includes('/*')) {
          break;
        }
      }

      return comment
        .replace(/\/\*+\s*/, '')
        .replace(/\s*\*+\//, '')
        .replace(/\s*\*\s*/g, ' ')
        .trim();
    }

    return undefined;
  }

  /**
   * Get summary statistics
   */
  getSummary(result: DiscoveryResult): Record<string, number> {
    const summary: Record<string, number> = {
      total: result.features.length,
      routes: 0,
      endpoints: 0,
      components: 0,
      config: 0
    };

    // Map singular types to plural keys
    const typeMap: Record<string, string> = {
      route: 'routes',
      endpoint: 'endpoints',
      component: 'components',
      config: 'config'
    };

    result.features.forEach(feature => {
      const key = typeMap[feature.type] || feature.type;
      summary[key] = (summary[key] || 0) + 1;
    });

    return summary;
  }
}
