/**
 * Roadmap Export Service
 * Formats roadmap data for export in various formats (Markdown, HTML)
 */

import type { RoadmapData, Feature } from '../types/roadmap';

export type ExportFormat = 'markdown' | 'html' | 'json';

export class RoadmapExport {
  /**
   * Export roadmap as Markdown format
   */
  static toMarkdown(data: RoadmapData): string {
    const { project, features, stats } = data;
    const timestamp = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    let md = `# ${project.name} - Product Roadmap\n\n`;
    md += `**Generated:** ${timestamp}  \n`;
    md += `**Status:** ${stats.shipped} shipped, ${stats.inProgress} in progress, ${stats.nextUp} next up, ${stats.backlog} in backlog\n\n`;
    md += `---\n\n`;

    // In Progress section
    if (features.inProgress && features.inProgress.length > 0) {
      md += `## 🚧 In Progress\n\n`;
      md += this.formatFeaturesAsMarkdown(features.inProgress);
      md += `\n`;
    }

    // Next Up section
    if (features.nextUp && features.nextUp.length > 0) {
      md += `## 📋 Next Up\n\n`;
      md += this.formatFeaturesAsMarkdown(features.nextUp);
      md += `\n`;
    }

    // Backlog section
    if (features.backlog && features.backlog.length > 0) {
      md += `## 📦 Backlog\n\n`;
      md += this.formatFeaturesAsMarkdown(features.backlog);
      md += `\n`;
    }

    // Shipped section
    if (features.shipped && features.shipped.length > 0) {
      md += `## ✅ Shipped\n\n`;
      md += this.formatFeaturesAsMarkdown(features.shipped);
      md += `\n`;
    }

    return md;
  }

  /**
   * Export roadmap as HTML format
   */
  static toHTML(data: RoadmapData): string {
    const { project, features, stats } = data;
    const timestamp = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${project.name} - Product Roadmap</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
      padding: 2rem;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    h1 {
      color: #1a1a1a;
      margin-bottom: 1rem;
      font-size: 2rem;
    }

    .meta {
      color: #666;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid #e0e0e0;
    }

    .meta strong {
      color: #333;
    }

    h2 {
      color: #1a1a1a;
      margin-top: 2rem;
      margin-bottom: 1rem;
      font-size: 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .feature {
      background: #fafafa;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      padding: 1rem;
      margin-bottom: 1rem;
    }

    .feature-header {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      margin-bottom: 0.5rem;
    }

    .feature-id {
      background: #0066cc;
      color: white;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      flex-shrink: 0;
    }

    .feature-name {
      font-weight: 600;
      color: #1a1a1a;
      flex: 1;
    }

    .feature-value {
      color: #666;
      margin-bottom: 0.5rem;
    }

    .feature-meta {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      font-size: 0.875rem;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .priority-p0 {
      background: #fee;
      color: #c00;
    }

    .priority-p1 {
      background: #ffe;
      color: #c60;
    }

    .priority-p2 {
      background: #eff;
      color: #06c;
    }

    .category {
      background: #f0f0f0;
      color: #333;
    }

    .dependencies {
      color: #666;
    }

    .dependencies strong {
      color: #333;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>${project.name} - Product Roadmap</h1>
    <div class="meta">
      <p><strong>Generated:</strong> ${timestamp}</p>
      <p><strong>Status:</strong> ${stats.shipped} shipped, ${stats.inProgress} in progress, ${stats.nextUp} next up, ${stats.backlog} in backlog</p>
    </div>
`;

    // In Progress section
    if (features.inProgress && features.inProgress.length > 0) {
      html += `    <h2>🚧 In Progress</h2>\n`;
      html += this.formatFeaturesAsHTML(features.inProgress);
    }

    // Next Up section
    if (features.nextUp && features.nextUp.length > 0) {
      html += `    <h2>📋 Next Up</h2>\n`;
      html += this.formatFeaturesAsHTML(features.nextUp);
    }

    // Backlog section
    if (features.backlog && features.backlog.length > 0) {
      html += `    <h2>📦 Backlog</h2>\n`;
      html += this.formatFeaturesAsHTML(features.backlog);
    }

    // Shipped section
    if (features.shipped && features.shipped.length > 0) {
      html += `    <h2>✅ Shipped</h2>\n`;
      html += this.formatFeaturesAsHTML(features.shipped);
    }

    html += `  </div>
</body>
</html>`;

    return html;
  }

  /**
   * Export roadmap as JSON (delegates to RoadmapPersistence)
   */
  static exportAsFile(data: RoadmapData, format: ExportFormat): void {
    const timestamp = new Date().toISOString().split('T')[0];
    let content: string;
    let filename: string;
    let mimeType: string;

    switch (format) {
      case 'markdown':
        content = this.toMarkdown(data);
        filename = `roadmap-${timestamp}.md`;
        mimeType = 'text/markdown';
        break;

      case 'html':
        content = this.toHTML(data);
        filename = `roadmap-${timestamp}.html`;
        mimeType = 'text/html';
        break;

      case 'json':
        content = JSON.stringify(data, null, 2);
        filename = `roadmap-${timestamp}.json`;
        mimeType = 'application/json';
        break;

      default:
        console.error('[RoadmapExport] Unknown format:', format);
        return;
    }

    try {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();

      URL.revokeObjectURL(url);

      console.log(`[RoadmapExport] Exported roadmap as ${format}:`, filename);
    } catch (error) {
      console.error('[RoadmapExport] Failed to export:', error);
    }
  }

  /**
   * Format features as Markdown list items
   */
  private static formatFeaturesAsMarkdown(features: Feature[]): string {
    return features
      .map((feature) => {
        let md = `### ${feature.id.toUpperCase()} - ${feature.name}\n\n`;
        md += `${feature.value}\n\n`;

        const meta: string[] = [];

        if (feature.category) {
          meta.push(`**Category:** ${feature.category}`);
        }

        if (feature.priority) {
          meta.push(`**Priority:** ${feature.priority}`);
        }

        if (feature.dependencies && feature.dependencies.length > 0) {
          meta.push(`**Dependencies:** ${feature.dependencies.join(', ')}`);
        }

        if (meta.length > 0) {
          md += meta.join(' • ') + '\n\n';
        }

        return md;
      })
      .join('');
  }

  /**
   * Format features as HTML cards
   */
  private static formatFeaturesAsHTML(features: Feature[]): string {
    return features
      .map((feature) => {
        const priorityClass = feature.priority
          ? `priority-${feature.priority.toLowerCase()}`
          : '';

        let html = `    <div class="feature">\n`;
        html += `      <div class="feature-header">\n`;
        html += `        <span class="feature-id">${feature.id.toUpperCase()}</span>\n`;
        html += `        <span class="feature-name">${feature.name}</span>\n`;
        html += `      </div>\n`;
        html += `      <div class="feature-value">${feature.value}</div>\n`;
        html += `      <div class="feature-meta">\n`;

        if (feature.category) {
          html += `        <span class="badge category">${feature.category}</span>\n`;
        }

        if (feature.priority) {
          html += `        <span class="badge ${priorityClass}">${feature.priority}</span>\n`;
        }

        if (feature.dependencies && feature.dependencies.length > 0) {
          html += `        <span class="dependencies"><strong>Depends on:</strong> ${feature.dependencies.join(', ')}</span>\n`;
        }

        html += `      </div>\n`;
        html += `    </div>\n`;

        return html;
      })
      .join('');
  }
}
