/**
 * Formatters for completion analysis reports
 */

import { CompletionReport, CompletionAnalysis } from '../core/completionDetector';
import { getCompletionStats } from '../core/completionDetector';

/**
 * Format completion report as markdown
 */
export function formatCompletionReportAsMarkdown(report: CompletionReport): string {
  const lines: string[] = [];
  const stats = getCompletionStats(report);

  // Header
  lines.push('# TODO Completion Analysis Report');
  lines.push('');
  lines.push(`**Total TODOs Analyzed:** ${report.totalTodos}`);
  lines.push(`**Completion Rate:** ${stats.completionRate.toFixed(1)}%`);
  lines.push('');

  // Summary Statistics
  lines.push('## 📊 Summary');
  lines.push('');
  lines.push('### Confidence Distribution');
  lines.push('');
  lines.push(`- ✅ **Very High (90-100%)**: ${report.summary.veryHighConfidence} TODOs`);
  lines.push(`- ⚠️ **High (70-89%)**: ${report.summary.highConfidence} TODOs`);
  lines.push(`- ❓ **Medium (50-69%)**: ${report.summary.mediumConfidence} TODOs`);
  lines.push(`- 📋 **Low (30-49%)**: ${report.summary.lowConfidence} TODOs`);
  lines.push(`- 🔴 **Active (<30%)**: ${report.summary.active} TODOs`);
  lines.push('');

  // Recommended Actions
  lines.push('### 🎯 Recommended Actions');
  lines.push('');
  lines.push(`- **Safe to Close**: ${stats.recommendedActions.close} TODOs`);
  lines.push(`- **Needs Review**: ${stats.recommendedActions.review} TODOs`);
  lines.push(`- **Verify Status**: ${stats.recommendedActions.verify} TODOs`);
  lines.push(`- **Keep Active**: ${stats.recommendedActions.keep} TODOs`);
  lines.push('');

  // Potential Cleanup
  lines.push('### 🧹 Cleanup Potential');
  lines.push('');
  lines.push(`If all high-confidence items are completed, you could reduce your TODO list by **${stats.potentialCleanup} items** (${((stats.potentialCleanup / report.totalTodos) * 100).toFixed(1)}%)`);
  lines.push('');

  // Safe to Close Section
  if (report.recommendations.safeToClose.length > 0) {
    lines.push('## ✅ Safe to Close (90%+ Confidence)');
    lines.push('');
    lines.push(`${report.recommendations.safeToClose.length} TODOs can be safely marked as complete:`);
    lines.push('');

    for (const analysis of report.recommendations.safeToClose.slice(0, 20)) {
      lines.push(`### ${analysis.todo.file}:${analysis.todo.line}`);
      lines.push(`**Confidence:** ${analysis.confidence.toFixed(1)}%`);
      lines.push(`**TODO:** ${analysis.todo.content}`);
      lines.push('');
      lines.push('**Reasons:**');
      for (const reason of analysis.reasons) {
        lines.push(`- ${reason}`);
      }
      lines.push('');
    }

    if (report.recommendations.safeToClose.length > 20) {
      lines.push(`*... and ${report.recommendations.safeToClose.length - 20} more*`);
      lines.push('');
    }
  }

  // Needs Review Section
  if (report.recommendations.needsReview.length > 0) {
    lines.push('## ⚠️ Needs Review (70-89% Confidence)');
    lines.push('');
    lines.push(`${report.recommendations.needsReview.length} TODOs probably completed but should be verified:`);
    lines.push('');

    for (const analysis of report.recommendations.needsReview.slice(0, 15)) {
      lines.push(`- **${analysis.todo.file}:${analysis.todo.line}** - ${analysis.todo.content} (${analysis.confidence.toFixed(1)}%)`);
    }

    if (report.recommendations.needsReview.length > 15) {
      lines.push(`- *... and ${report.recommendations.needsReview.length - 15} more*`);
    }
    lines.push('');
  }

  // Possibly Done Section
  if (report.recommendations.possiblyDone.length > 0) {
    lines.push('## ❓ Possibly Completed (50-69% Confidence)');
    lines.push('');
    lines.push(`${report.recommendations.possiblyDone.length} TODOs may be completed - flag for review:`);
    lines.push('');

    for (const analysis of report.recommendations.possiblyDone.slice(0, 10)) {
      lines.push(`- **${analysis.todo.file}:${analysis.todo.line}** - ${analysis.todo.content} (${analysis.confidence.toFixed(1)}%)`);
    }

    if (report.recommendations.possiblyDone.length > 10) {
      lines.push(`- *... and ${report.recommendations.possiblyDone.length - 10} more*`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Format completion report as summary
 */
export function formatCompletionSummary(report: CompletionReport): string {
  const lines: string[] = [];
  const stats = getCompletionStats(report);

  lines.push('TODO Completion Analysis Summary');
  lines.push('=================================');
  lines.push(`Total TODOs: ${report.totalTodos}`);
  lines.push(`Completion Rate: ${stats.completionRate.toFixed(1)}%`);
  lines.push('');
  lines.push('Confidence Distribution:');
  lines.push(`  Very High (90-100%): ${report.summary.veryHighConfidence}`);
  lines.push(`  High (70-89%):       ${report.summary.highConfidence}`);
  lines.push(`  Medium (50-69%):     ${report.summary.mediumConfidence}`);
  lines.push(`  Low (30-49%):        ${report.summary.lowConfidence}`);
  lines.push(`  Active (<30%):       ${report.summary.active}`);
  lines.push('');
  lines.push('Recommended Actions:');
  lines.push(`  Safe to Close:  ${stats.recommendedActions.close}`);
  lines.push(`  Needs Review:   ${stats.recommendedActions.review}`);
  lines.push(`  Verify Status:  ${stats.recommendedActions.verify}`);
  lines.push(`  Keep Active:    ${stats.recommendedActions.keep}`);
  lines.push('');
  lines.push(`Potential Cleanup: ${stats.potentialCleanup} TODOs (${((stats.potentialCleanup / report.totalTodos) * 100).toFixed(1)}%)`);

  return lines.join('\n');
}

/**
 * Format completion report as JSON
 */
export function formatCompletionReportAsJSON(report: CompletionReport): string {
  return JSON.stringify(report, null, 2);
}

/**
 * Format top cleanup candidates
 */
export function formatCleanupCandidates(
  candidates: Array<{ file: string; count: number; avgConfidence: number }>
): string {
  const lines: string[] = [];

  lines.push('## 📁 Top Files for Cleanup');
  lines.push('');
  lines.push('Files with the most likely-completed TODOs:');
  lines.push('');

  for (const candidate of candidates) {
    lines.push(`- **${candidate.file}** - ${candidate.count} TODOs (avg confidence: ${candidate.avgConfidence.toFixed(1)}%)`);
  }
  lines.push('');

  return lines.join('\n');
}

/**
 * Generate actionable cleanup list (for automation)
 */
export function generateCleanupActionList(
  analyses: CompletionAnalysis[],
  minConfidence: number = 90
): Array<{
  file: string;
  line: number;
  action: 'mark-complete' | 'review' | 'verify';
  confidence: number;
  todo: string;
}> {
  return analyses
    .filter(a => a.confidence >= minConfidence)
    .map(a => ({
      file: a.todo.file,
      line: a.todo.line,
      action: a.confidence >= 90 ? 'mark-complete' as const :
              a.confidence >= 70 ? 'review' as const :
              'verify' as const,
      confidence: a.confidence,
      todo: a.todo.content
    }))
    .sort((a, b) => b.confidence - a.confidence);
}