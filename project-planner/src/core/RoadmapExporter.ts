/**
 * Roadmap Exporter - Generate visual roadmaps from feature registry
 * PM-9: Roadmap Export (Markdown/HTML)
 */

import type { Feature, FeatureRegistry } from '../types';
import { CSVFeatureRegistry } from './FeatureRegistry';

export type ExportFormat = 'markdown' | 'html' | 'json';

export interface ExportOptions {
  /** Include completed features */
  includeCompleted?: boolean;
  /** Include blocked features */
  includeBlocked?: boolean;
  /** Group by phase or category */
  groupBy?: 'phase' | 'category' | 'priority' | 'status';
  /** Include dependency graph */
  includeDependencies?: boolean;
  /** Include timeline */
  includeTimeline?: boolean;
}

export interface RoadmapData {
  project: {
    name: string;
    code: string;
    description?: string;
  };
  features: {
    planned: Feature[];
    inProgress: Feature[];
    completed: Feature[];
    blocked: Feature[];
  };
  stats: {
    total: number;
    planned: number;
    inProgress: number;
    completed: number;
    blocked: number;
    completionPercentage: number;
  };
  dependencyChains: Array<{
    feature: string;
    dependencies: string[];
    blocks: string[];
  }>;
}

export class RoadmapExporter {
  private registry: CSVFeatureRegistry;

  constructor(registryPath: string) {
    this.registry = new CSVFeatureRegistry({
      filePath: registryPath,
      createIfMissing: false
    });
  }

  /**
   * Export roadmap in specified format
   */
  export(format: ExportFormat, options: ExportOptions = {}): string {
    const data = this.prepareRoadmapData(options);

    switch (format) {
      case 'markdown':
        return this.exportMarkdown(data, options);
      case 'html':
        return this.exportHTML(data, options);
      case 'json':
        return JSON.stringify(data, null, 2);
      default:
        throw new Error(`Unknown export format: ${format}`);
    }
  }

  /**
   * Export roadmap to file
   */
  async exportToFile(
    format: ExportFormat,
    outputPath: string,
    options: ExportOptions = {}
  ): Promise<void> {
    const fs = require('fs').promises;
    const path = require('path');

    const content = await this.export(format, options);

    // Ensure directory exists
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    // Write file
    await fs.writeFile(outputPath, content, 'utf8');
  }

  /**
   * Prepare roadmap data from registry
   */
  private prepareRoadmapData(options: ExportOptions): RoadmapData {
    const allFeatures = this.registry.getAllFeatures();

    // Filter features based on options
    let features = allFeatures;
    if (!options.includeCompleted) {
      features = features.filter(f => f.status !== 'completed');
    }
    if (!options.includeBlocked) {
      features = features.filter(f => f.status !== 'blocked');
    }

    // Group by status
    const planned = features.filter(f => f.status === 'planned');
    const inProgress = features.filter(f => f.status === 'in-progress');
    const completed = allFeatures.filter(f => f.status === 'completed');
    const blocked = allFeatures.filter(f => f.status === 'blocked');

    // Calculate stats
    const stats = {
      total: allFeatures.length,
      planned: planned.length,
      inProgress: inProgress.length,
      completed: completed.length,
      blocked: blocked.length,
      completionPercentage: allFeatures.length > 0
        ? Math.round((completed.length / allFeatures.length) * 100)
        : 0
    };

    // Build dependency chains
    const dependencyChains = features.map(f => ({
      feature: f.id,
      dependencies: f.dependencies || [],
      blocks: f.blocks || []
    }));

    return {
      project: this.registry.getMetadata().project,
      features: { planned, inProgress, completed, blocked },
      stats,
      dependencyChains
    };
  }

  /**
   * Export to Markdown format
   */
  private exportMarkdown(data: RoadmapData, options: ExportOptions): string {
    const lines: string[] = [];

    // Header
    lines.push(`# ${data.project.name} - Product Roadmap`);
    lines.push('');
    if (data.project.description) {
      lines.push(data.project.description);
      lines.push('');
    }

    // Stats
    lines.push('## Progress Overview');
    lines.push('');
    lines.push(`- **Total Features**: ${data.stats.total}`);
    lines.push(`- **Completed**: ${data.stats.completed} (${data.stats.completionPercentage}%)`);
    lines.push(`- **In Progress**: ${data.stats.inProgress}`);
    lines.push(`- **Planned**: ${data.stats.planned}`);
    if (data.stats.blocked > 0) {
      lines.push(`- **Blocked**: ${data.stats.blocked}`);
    }
    lines.push('');

    // Progress bar
    const totalBars = 20;
    const completedBars = Math.round((data.stats.completionPercentage / 100) * totalBars);
    const progressBar = '█'.repeat(completedBars) + '░'.repeat(totalBars - completedBars);
    lines.push(`**Progress**: ${progressBar} ${data.stats.completionPercentage}%`);
    lines.push('');

    // Features by status
    if (data.features.inProgress.length > 0) {
      lines.push('## 🚧 In Progress');
      lines.push('');
      this.addFeaturesMarkdown(lines, data.features.inProgress, options);
    }

    if (data.features.planned.length > 0) {
      lines.push('## 📋 Planned');
      lines.push('');
      this.addFeaturesMarkdown(lines, data.features.planned, options);
    }

    if (options.includeCompleted && data.features.completed.length > 0) {
      lines.push('## ✅ Completed');
      lines.push('');
      this.addFeaturesMarkdown(lines, data.features.completed, options);
    }

    if (options.includeBlocked && data.features.blocked.length > 0) {
      lines.push('## 🚫 Blocked');
      lines.push('');
      this.addFeaturesMarkdown(lines, data.features.blocked, options);
    }

    // Dependencies
    if (options.includeDependencies) {
      lines.push('## Dependencies');
      lines.push('');
      const featuresWithDeps = data.dependencyChains.filter(
        c => c.dependencies.length > 0 || c.blocks.length > 0
      );

      if (featuresWithDeps.length > 0) {
        for (const chain of featuresWithDeps) {
          lines.push(`### ${chain.feature}`);
          if (chain.dependencies.length > 0) {
            lines.push(`**Depends on**: ${chain.dependencies.join(', ')}`);
          }
          if (chain.blocks.length > 0) {
            lines.push(`**Blocks**: ${chain.blocks.join(', ')}`);
          }
          lines.push('');
        }
      } else {
        lines.push('_No dependencies_');
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  /**
   * Add features to Markdown output
   */
  private addFeaturesMarkdown(
    lines: string[],
    features: Feature[],
    options: ExportOptions
  ): void {
    // Group features if requested
    if (options.groupBy) {
      const groups = this.groupFeatures(features, options.groupBy);

      for (const [groupName, groupFeatures] of Object.entries(groups)) {
        lines.push(`### ${groupName}`);
        lines.push('');
        this.renderFeatureList(lines, groupFeatures);
      }
    } else {
      this.renderFeatureList(lines, features);
    }
  }

  /**
   * Render feature list in Markdown
   */
  private renderFeatureList(lines: string[], features: Feature[]): void {
    const projectCode = this.registry.getMetadata().project.code;

    for (const feature of features) {
      lines.push(`#### ${feature.name} (${projectCode}-${feature.number})`);
      lines.push('');
      lines.push(`**Category**: ${feature.category} | **Phase**: ${feature.phase} | **Priority**: ${feature.priority}`);
      lines.push('');
      lines.push(feature.description);
      lines.push('');
      if (feature.value) {
        lines.push(`**Value**: ${feature.value}`);
        lines.push('');
      }
      if (feature.dependencies && feature.dependencies.length > 0) {
        lines.push(`**Dependencies**: ${feature.dependencies.join(', ')}`);
        lines.push('');
      }
      lines.push('---');
      lines.push('');
    }
  }

  /**
   * Export to HTML format
   */
  private exportHTML(data: RoadmapData, options: ExportOptions): string {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.project.name} - Product Roadmap</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0d1117;
      color: #c9d1d9;
      line-height: 1.6;
      padding: 2rem;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 { color: #58a6ff; margin-bottom: 0.5rem; font-size: 2.5rem; }
    h2 { color: #8b949e; margin-top: 2rem; margin-bottom: 1rem; font-size: 1.8rem; }
    h3 { color: #c9d1d9; margin-top: 1.5rem; margin-bottom: 0.75rem; }
    .stats {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 6px;
      padding: 1.5rem;
      margin: 1.5rem 0;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
    }
    .stat-item { text-align: center; }
    .stat-value { font-size: 2rem; font-weight: bold; color: #58a6ff; }
    .stat-label { font-size: 0.875rem; color: #8b949e; margin-top: 0.25rem; }
    .progress-bar {
      width: 100%;
      height: 24px;
      background: #21262d;
      border-radius: 12px;
      overflow: hidden;
      margin: 1rem 0;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #58a6ff, #3fb950);
      transition: width 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-weight: bold;
      font-size: 0.75rem;
    }
    .feature-card {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 6px;
      padding: 1.5rem;
      margin-bottom: 1rem;
    }
    .feature-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 1rem;
    }
    .feature-title { color: #58a6ff; font-size: 1.25rem; font-weight: 600; }
    .feature-meta {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-bottom: 1rem;
    }
    .badge {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .badge-category { background: #1f6feb; color: #fff; }
    .badge-phase { background: #21262d; color: #8b949e; border: 1px solid #30363d; }
    .badge-priority { background: #d29922; color: #000; }
    .feature-description { color: #8b949e; margin-bottom: 1rem; }
    .feature-value { color: #3fb950; font-style: italic; }
    .dependencies {
      margin-top: 1rem;
      padding: 0.75rem;
      background: #21262d;
      border-radius: 4px;
      font-size: 0.875rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>${data.project.name}</h1>
    ${data.project.description ? `<p>${data.project.description}</p>` : ''}

    <div class="stats">
      <div class="stat-item">
        <div class="stat-value">${data.stats.total}</div>
        <div class="stat-label">Total Features</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${data.stats.completed}</div>
        <div class="stat-label">Completed</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${data.stats.inProgress}</div>
        <div class="stat-label">In Progress</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${data.stats.planned}</div>
        <div class="stat-label">Planned</div>
      </div>
    </div>

    <div class="progress-bar">
      <div class="progress-fill" style="width: ${data.stats.completionPercentage}%">
        ${data.stats.completionPercentage}%
      </div>
    </div>

    ${this.renderHTMLFeatures(data, options)}
  </div>
</body>
</html>`;

    return html;
  }

  /**
   * Render features in HTML
   */
  private renderHTMLFeatures(data: RoadmapData, options: ExportOptions): string {
    const sections: string[] = [];

    if (data.features.inProgress.length > 0) {
      sections.push(`<h2>🚧 In Progress</h2>`);
      sections.push(this.renderHTMLFeatureCards(data.features.inProgress, data.project.code));
    }

    if (data.features.planned.length > 0) {
      sections.push(`<h2>📋 Planned</h2>`);
      sections.push(this.renderHTMLFeatureCards(data.features.planned, data.project.code));
    }

    if (options.includeCompleted && data.features.completed.length > 0) {
      sections.push(`<h2>✅ Completed</h2>`);
      sections.push(this.renderHTMLFeatureCards(data.features.completed, data.project.code));
    }

    return sections.join('\n');
  }

  /**
   * Render feature cards in HTML
   */
  private renderHTMLFeatureCards(features: Feature[], projectCode: string): string {
    return features.map(f => `
      <div class="feature-card">
        <div class="feature-header">
          <div class="feature-title">${f.name} (${projectCode}-${f.number})</div>
        </div>
        <div class="feature-meta">
          <span class="badge badge-category">${f.category}</span>
          <span class="badge badge-phase">${f.phase}</span>
          <span class="badge badge-priority">${f.priority}</span>
        </div>
        <div class="feature-description">${f.description}</div>
        ${f.value ? `<div class="feature-value">💎 ${f.value}</div>` : ''}
        ${f.dependencies && f.dependencies.length > 0 ? `
          <div class="dependencies">
            <strong>Dependencies:</strong> ${f.dependencies.join(', ')}
          </div>
        ` : ''}
      </div>
    `).join('\n');
  }

  /**
   * Group features by specified field
   */
  private groupFeatures(
    features: Feature[],
    groupBy: 'phase' | 'category' | 'priority' | 'status'
  ): Record<string, Feature[]> {
    const groups: Record<string, Feature[]> = {};

    for (const feature of features) {
      const key = feature[groupBy] as string;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(feature);
    }

    return groups;
  }
}
