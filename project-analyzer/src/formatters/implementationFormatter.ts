/**
 * Formatters for implementation detection reports
 */

import * as path from 'path';
import {
  ImplementationReport,
  FeatureDetection,
  ImplementationEvidence
} from '../core/featureDetection';
import { getProgressByPlan, getTopUnimplementedFeatures } from '../core/featureDetector';

/**
 * Format implementation report as markdown
 */
export function formatImplementationReportAsMarkdown(report: ImplementationReport): string {
  const lines: string[] = [];

  // Header
  lines.push('# Feature Implementation Analysis');
  lines.push('');
  lines.push(`**Generated:** ${new Date().toLocaleString()}`);
  lines.push(`**Total Features Analyzed:** ${report.summary.totalFeatures}`);
  lines.push('');

  // Overall Summary
  lines.push('## Overall Summary');
  lines.push('');
  lines.push(`- ✅ **Implemented:** ${report.summary.implemented} (${Math.round(report.summary.implemented / report.summary.totalFeatures * 100)}%)`);
  lines.push(`- ⚠️  **Partial:** ${report.summary.partial} (${Math.round(report.summary.partial / report.summary.totalFeatures * 100)}%)`);
  lines.push(`- ❌ **Missing:** ${report.summary.missing} (${Math.round(report.summary.missing / report.summary.totalFeatures * 100)}%)`);
  lines.push(`- 📊 **Average Confidence:** ${report.summary.avgConfidence}%`);
  lines.push('');

  // Progress by Plan
  lines.push('## Progress by Planning Document');
  lines.push('');

  const progressByPlan = getProgressByPlan(report);

  for (const planProgress of progressByPlan) {
    const progressBar = createProgressBar(planProgress.progress);
    lines.push(`### ${planProgress.plan}`);
    lines.push('');
    lines.push(`${progressBar} **${planProgress.progress}%** (${planProgress.implemented}/${planProgress.total} implemented)`);
    lines.push('');
    lines.push(`- ✅ Implemented: ${planProgress.implemented}`);
    lines.push(`- ⚠️  Partial: ${planProgress.partial}`);
    lines.push(`- ❌ Missing: ${planProgress.missing}`);
    lines.push('');
  }

  // Top Unimplemented Features
  lines.push('## Top Priority: Unimplemented Features');
  lines.push('');

  const topUnimplemented = getTopUnimplementedFeatures(report, 15);

  if (topUnimplemented.length === 0) {
    lines.push('🎉 All features appear to be implemented!');
    lines.push('');
  } else {
    for (const detection of topUnimplemented) {
      const statusIcon = detection.status === 'partial' ? '⚠️' : '❌';
      const planName = path.basename(detection.planDocument, '.md');

      lines.push(`### ${statusIcon} ${detection.feature.description}`);
      lines.push('');
      lines.push(`**Plan:** ${planName}`);
      lines.push(`**Status:** ${detection.status} (${detection.confidence}% confidence)`);
      lines.push(`**Recommendation:** ${detection.recommendation}`);
      lines.push('');

      if (detection.evidence.filesFound.length > 0) {
        lines.push('**Files Found:**');
        for (const file of detection.evidence.filesFound) {
          lines.push(`- ${file}`);
        }
        lines.push('');
      }

      if (detection.evidence.usageDetected.length > 0) {
        lines.push('**Usage Detected:**');
        for (const usage of detection.evidence.usageDetected.slice(0, 3)) {
          lines.push(`- ${usage.file}:${usage.line} - \`${usage.importStatement}\``);
        }
        if (detection.evidence.usageDetected.length > 3) {
          lines.push(`- ... and ${detection.evidence.usageDetected.length - 3} more`);
        }
        lines.push('');
      }

      if (detection.evidence.testsFound.length > 0) {
        lines.push('**Tests Found:**');
        for (const test of detection.evidence.testsFound) {
          lines.push(`- ${test}`);
        }
        lines.push('');
      }

      lines.push('---');
      lines.push('');
    }
  }

  // Detailed Breakdown (Implemented Features)
  lines.push('## Implemented Features (High Confidence)');
  lines.push('');

  const implemented = report.detections
    .filter(d => d.status === 'implemented' && d.confidence >= 70)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 20);

  if (implemented.length === 0) {
    lines.push('No features detected as implemented with high confidence.');
    lines.push('');
  } else {
    for (const detection of implemented) {
      const planName = path.basename(detection.planDocument, '.md');

      lines.push(`### ✅ ${detection.feature.description}`);
      lines.push('');
      lines.push(`**Plan:** ${planName}`);
      lines.push(`**Confidence:** ${detection.confidence}%`);
      lines.push('');

      // Show evidence summary
      const evidenceSummary: string[] = [];
      if (detection.evidence.filesFound.length > 0) {
        evidenceSummary.push(`${detection.evidence.filesFound.length} file(s)`);
      }
      if (detection.evidence.testsFound.length > 0) {
        evidenceSummary.push(`${detection.evidence.testsFound.length} test(s)`);
      }
      if (detection.evidence.usageDetected.length > 0) {
        evidenceSummary.push(`${detection.evidence.usageDetected.length} usage(s)`);
      }

      if (evidenceSummary.length > 0) {
        lines.push(`**Evidence:** ${evidenceSummary.join(', ')}`);
        lines.push('');
      }
    }
  }

  return lines.join('\n');
}

/**
 * Format implementation report as JSON
 */
export function formatImplementationReportAsJSON(report: ImplementationReport): string {
  const jsonReport = {
    generatedAt: new Date().toISOString(),
    summary: report.summary,
    byPlan: Array.from(report.byPlan.entries()).map(([plan, stats]) => ({
      plan,
      ...stats
    })),
    detections: report.detections.map(d => ({
      feature: d.feature.description,
      plan: path.basename(d.planDocument),
      status: d.status,
      confidence: d.confidence,
      recommendation: d.recommendation,
      evidence: {
        filesFound: d.evidence.filesFound,
        testsFound: d.evidence.testsFound,
        usageCount: d.evidence.usageDetected.length,
        codeMatchCount: d.evidence.codePatterns.length
      }
    }))
  };

  return JSON.stringify(jsonReport, null, 2);
}

/**
 * Format implementation report as CSV
 */
export function formatImplementationReportAsCSV(report: ImplementationReport): string {
  const lines: string[] = [];

  // Header
  lines.push('Plan,Feature,Status,Confidence,Files Found,Tests Found,Usage Detected,Recommendation');

  // Data rows
  for (const detection of report.detections) {
    const planName = path.basename(detection.planDocument, '.md');
    const feature = escapeCSV(detection.feature.description);
    const recommendation = escapeCSV(detection.recommendation);

    lines.push([
      planName,
      feature,
      detection.status,
      detection.confidence,
      detection.evidence.filesFound.length,
      detection.evidence.testsFound.length,
      detection.evidence.usageDetected.length,
      recommendation
    ].join(','));
  }

  return lines.join('\n');
}

/**
 * Format a brief summary for console output
 */
export function formatImplementationSummary(report: ImplementationReport): string {
  const lines: string[] = [];

  lines.push('\n📊 Implementation Analysis Summary');
  lines.push('='.repeat(50));
  lines.push(`Total Features: ${report.summary.totalFeatures}`);
  lines.push(`✅ Implemented: ${report.summary.implemented} (${Math.round(report.summary.implemented / report.summary.totalFeatures * 100)}%)`);
  lines.push(`⚠️  Partial: ${report.summary.partial} (${Math.round(report.summary.partial / report.summary.totalFeatures * 100)}%)`);
  lines.push(`❌ Missing: ${report.summary.missing} (${Math.round(report.summary.missing / report.summary.totalFeatures * 100)}%)`);
  lines.push(`📈 Avg Confidence: ${report.summary.avgConfidence}%`);
  lines.push('');

  lines.push('📋 Progress by Plan:');
  const progressByPlan = getProgressByPlan(report);
  for (const planProgress of progressByPlan.slice(0, 5)) {
    const progressBar = createProgressBar(planProgress.progress, 20);
    lines.push(`  ${progressBar} ${planProgress.progress.toString().padStart(3)}% - ${planProgress.plan}`);
  }

  return lines.join('\n');
}

/**
 * Create a visual progress bar
 */
function createProgressBar(percentage: number, width: number = 30): string {
  const filled = Math.round(percentage / 100 * width);
  const empty = width - filled;

  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  return `[${bar}]`;
}

/**
 * Escape CSV values
 */
function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Format top gaps for quick review
 */
export function formatTopGaps(report: ImplementationReport, limit: number = 10): string {
  const lines: string[] = [];

  lines.push('\n🔴 Top Implementation Gaps');
  lines.push('='.repeat(50));

  const topGaps = getTopUnimplementedFeatures(report, limit);

  for (let i = 0; i < topGaps.length; i++) {
    const detection = topGaps[i];
    const planName = path.basename(detection.planDocument, '.md');

    lines.push(`\n${i + 1}. ${detection.feature.description}`);
    lines.push(`   Plan: ${planName}`);
    lines.push(`   Status: ${detection.status} (${detection.confidence}% confidence)`);

    if (detection.evidence.filesFound.length > 0) {
      lines.push(`   Files: ${detection.evidence.filesFound.join(', ')}`);
    }
  }

  return lines.join('\n');
}
