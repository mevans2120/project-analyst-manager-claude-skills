/**
 * Feature Formatter
 * Format extracted features for various output formats (CSV, Markdown, JSON)
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import {
  ExtractedFeature,
  FeatureAnalysisResult,
  FeatureCSVOptions,
  FeatureCategory,
  DetailedAnalysisResult
} from '../types/features';

/**
 * Format features as CSV
 */
export function formatFeaturesAsCSV(
  result: FeatureAnalysisResult | DetailedAnalysisResult,
  options: FeatureCSVOptions = {}
): string {
  const {
    includeHeaders = true,
    fields = ['name', 'description', 'category', 'source', 'priority', 'confidence'],
    groupByCategory = false,
    sortBy = 'category',
    includeSummary = true
  } = options;

  const lines: string[] = [];

  // Add summary section if requested
  if (includeSummary) {
    lines.push('# Feature Analysis Summary');
    lines.push(`# Total Features: ${result.summary.totalFeatures}`);
    lines.push(`# Analysis Date: ${result.metadata.analysisDate}`);
    lines.push(`# Average Confidence: ${result.summary.averageConfidence}%`);
    lines.push('');
  }

  // Sort features
  const sortedFeatures = sortFeatures(result.features, sortBy);

  if (groupByCategory) {
    // Group by category
    const grouped = groupByField(sortedFeatures, 'category');

    for (const [category, features] of Object.entries(grouped)) {
      lines.push(`# Category: ${category}`);
      lines.push('');

      if (includeHeaders) {
        lines.push(buildCSVHeader(fields));
      }

      for (const feature of features) {
        lines.push(buildCSVRow(feature, fields));
      }

      lines.push('');
    }
  } else {
    // Single table
    if (includeHeaders) {
      lines.push(buildCSVHeader(fields));
    }

    for (const feature of sortedFeatures) {
      lines.push(buildCSVRow(feature, fields));
    }
  }

  return lines.join('\n');
}

/**
 * Build CSV header row
 */
function buildCSVHeader(fields: string[]): string {
  const headers = fields.map(field => {
    switch (field) {
      case 'name': return 'Feature Name';
      case 'description': return 'Description';
      case 'category': return 'Category';
      case 'categoryEmoji': return 'Type';
      case 'source': return 'Source';
      case 'sourceName': return 'Source File';
      case 'priority': return 'Priority';
      case 'confidence': return 'Confidence';
      case 'status': return 'Status';
      case 'tags': return 'Tags';
      case 'notes': return 'Notes';
      default: return field;
    }
  });

  return headers.map(escapeCSV).join(',');
}

/**
 * Build CSV row for a feature
 */
function buildCSVRow(feature: ExtractedFeature, fields: string[]): string {
  const values = fields.map(field => {
    switch (field) {
      case 'name':
        return feature.name;

      case 'description':
        return feature.description;

      case 'category':
        return feature.category;

      case 'categoryEmoji':
        return getCategoryEmoji(feature.category);

      case 'source':
        return feature.source;

      case 'sourceName':
        return path.basename(feature.sourcePath);

      case 'priority':
        return feature.priority || '';

      case 'confidence':
        return feature.confidence.toString();

      case 'status':
        return feature.status;

      case 'tags':
        return feature.tags?.join('; ') || '';

      case 'notes':
        return feature.notes || '';

      default:
        return '';
    }
  });

  return values.map(escapeCSV).join(',');
}

/**
 * Escape CSV value
 */
function escapeCSV(value: string): string {
  // If value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Get emoji for category
 */
function getCategoryEmoji(category: FeatureCategory): string {
  const emojiMap: Record<FeatureCategory, string> = {
    'UI Component': '🧩',
    'Page': '📄',
    'Navigation': '🧭',
    'Form': '📝',
    'Data Display': '📊',
    'Action': '⚡',
    'Content': '📰',
    'Layout': '📐',
    'Other': '🔹'
  };

  return emojiMap[category] || '🔹';
}

/**
 * Sort features by specified field
 */
function sortFeatures(features: ExtractedFeature[], sortBy: string): ExtractedFeature[] {
  const sorted = [...features];

  switch (sortBy) {
    case 'priority':
      return sorted.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        const aPriority = a.priority ? priorityOrder[a.priority] : 3;
        const bPriority = b.priority ? priorityOrder[b.priority] : 3;
        return aPriority - bPriority;
      });

    case 'category':
      return sorted.sort((a, b) => a.category.localeCompare(b.category));

    case 'confidence':
      return sorted.sort((a, b) => b.confidence - a.confidence);

    case 'name':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));

    default:
      return sorted;
  }
}

/**
 * Group features by field
 */
function groupByField(features: ExtractedFeature[], field: keyof ExtractedFeature): Record<string, ExtractedFeature[]> {
  const grouped: Record<string, ExtractedFeature[]> = {};

  for (const feature of features) {
    const key = String(feature[field]);
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(feature);
  }

  return grouped;
}

/**
 * Format features as Markdown
 */
export function formatFeaturesAsMarkdown(result: FeatureAnalysisResult | DetailedAnalysisResult): string {
  const lines: string[] = [];

  // Header
  lines.push('# Feature Analysis Report');
  lines.push('');
  lines.push(`**Analysis Date:** ${new Date(result.metadata.analysisDate).toLocaleString()}`);
  lines.push(`**Total Features:** ${result.summary.totalFeatures}`);
  lines.push(`**Average Confidence:** ${result.summary.averageConfidence}%`);
  lines.push('');

  // Summary
  lines.push('## Summary');
  lines.push('');
  lines.push('### By Category');
  for (const [category, count] of Object.entries(result.summary.byCategory)) {
    const emoji = getCategoryEmoji(category as FeatureCategory);
    lines.push(`- ${emoji} ${category}: ${count}`);
  }
  lines.push('');

  lines.push('### By Priority');
  lines.push(`- 🔴 High: ${result.summary.byPriority.high}`);
  lines.push(`- 🟡 Medium: ${result.summary.byPriority.medium}`);
  lines.push(`- 🟢 Low: ${result.summary.byPriority.low}`);
  if (result.summary.byPriority.unassigned > 0) {
    lines.push(`- ⚪ Unassigned: ${result.summary.byPriority.unassigned}`);
  }
  lines.push('');

  // Features by category
  lines.push('## Features');
  lines.push('');

  const byCategory = groupByField(result.features, 'category');

  for (const [category, features] of Object.entries(byCategory)) {
    const emoji = getCategoryEmoji(category as FeatureCategory);
    lines.push(`### ${emoji} ${category}`);
    lines.push('');

    for (const feature of features) {
      const priorityEmoji = feature.priority === 'high' ? '🔴' : feature.priority === 'medium' ? '🟡' : '🟢';
      lines.push(`#### ${priorityEmoji} ${feature.name}`);
      lines.push('');
      lines.push(feature.description);
      lines.push('');
      lines.push(`- **Source:** ${path.basename(feature.sourcePath)}`);
      lines.push(`- **Confidence:** ${feature.confidence}%`);
      if (feature.tags && feature.tags.length > 0) {
        lines.push(`- **Tags:** ${feature.tags.join(', ')}`);
      }
      if (feature.notes) {
        lines.push(`- **Notes:** ${feature.notes}`);
      }
      lines.push('');
    }
  }

  // Recommendations
  if (result.recommendations && result.recommendations.length > 0) {
    lines.push('## Recommendations');
    lines.push('');
    for (const rec of result.recommendations) {
      lines.push(`- ${rec}`);
    }
    lines.push('');
  }

  // Warnings
  if (result.warnings && result.warnings.length > 0) {
    lines.push('## Warnings');
    lines.push('');
    for (const warning of result.warnings) {
      lines.push(`- ⚠️  ${warning}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Format features as JSON
 */
export function formatFeaturesAsJSON(result: FeatureAnalysisResult | DetailedAnalysisResult, pretty = true): string {
  return JSON.stringify(result, null, pretty ? 2 : 0);
}

/**
 * Write features to file
 */
export async function writeFeaturesToFile(
  result: FeatureAnalysisResult | DetailedAnalysisResult,
  outputPath: string,
  format: 'csv' | 'markdown' | 'json' = 'csv',
  csvOptions?: FeatureCSVOptions
): Promise<void> {
  let content: string;

  switch (format) {
    case 'csv':
      content = formatFeaturesAsCSV(result, csvOptions);
      break;
    case 'markdown':
      content = formatFeaturesAsMarkdown(result);
      break;
    case 'json':
      content = formatFeaturesAsJSON(result);
      break;
  }

  // Ensure directory exists
  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  // Write file
  await fs.writeFile(outputPath, content, 'utf-8');
  console.log(`✅ Features written to: ${outputPath}`);
}

/**
 * Generate report filename with timestamp
 */
export function generateFeatureReportFilename(format: 'csv' | 'markdown' | 'json', prefix = 'features'): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const extension = format === 'markdown' ? 'md' : format;
  return `${prefix}-${timestamp}.${extension}`;
}
