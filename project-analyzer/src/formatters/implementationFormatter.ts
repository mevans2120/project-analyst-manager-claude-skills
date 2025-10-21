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

    // Show open items inline
    if (planProgress.missing > 0) {
      const planMissingItems = report.detections.filter(
        d => d.status === 'missing' && path.basename(d.planDocument) === planProgress.plan
      );

      if (planMissingItems.length > 0) {
        lines.push('**Open Items:**');
        for (const item of planMissingItems) {
          lines.push(`- ❌ ${item.feature.description}`);
        }
        lines.push('');
      }
    }
  }

  // Open Items (Missing Features)
  const missingFeatures = report.detections.filter(d => d.status === 'missing');

  if (missingFeatures.length > 0) {
    lines.push('## 🔴 Open Items (Not Yet Implemented)');
    lines.push('');
    lines.push(`**${missingFeatures.length} feature(s) with no implementation evidence found**`);
    lines.push('');

    for (const detection of missingFeatures) {
      const planName = path.basename(detection.planDocument, '.md');

      lines.push(`### ❌ ${detection.feature.description}`);
      lines.push('');
      lines.push(`**Plan:** ${planName}`);
      lines.push(`**Line:** ${detection.feature.line}`);
      lines.push(`**Status:** ${detection.status} (${detection.confidence}% confidence)`);
      lines.push('');
      lines.push('**Evidence Found:**');
      lines.push('- ❌ No files found');
      lines.push('- ❌ No imports detected');
      lines.push('- ❌ No tests found');
      lines.push('- ❌ No code patterns found');
      lines.push('');
      lines.push(`**Action Required:** This feature appears to be completely unimplemented.`);
      lines.push('');
      lines.push('---');
      lines.push('');
    }
  } else {
    lines.push('## 🎉 Open Items');
    lines.push('');
    lines.push('**All features have implementation evidence!** No missing features detected.');
    lines.push('');
  }

  // Low Confidence Features (Partial/Needs Review)
  const lowConfidence = report.detections
    .filter(d => d.status === 'implemented' && d.confidence < 60)
    .sort((a, b) => a.confidence - b.confidence)
    .slice(0, 15);

  if (lowConfidence.length > 0) {
    lines.push('## ⚠️ Low Confidence Features (May Need Review)');
    lines.push('');
    lines.push(`**${lowConfidence.length} feature(s) marked as implemented but with low confidence (<60%)**`);
    lines.push('');
  }

  const topUnimplemented = lowConfidence;

  if (topUnimplemented.length === 0) {
    lines.push('🎉 All features have high confidence scores!');
    lines.push('');
  } else {
    for (const detection of topUnimplemented) {
      const planName = path.basename(detection.planDocument, '.md');

      lines.push(`### ⚠️ ${detection.feature.description}`);
      lines.push('');
      lines.push(`**Plan:** ${planName}`);
      lines.push(`**Confidence:** ${detection.confidence}%`);
      lines.push('');

      // Show evidence found
      lines.push('**Evidence Found:**');
      const evidenceItems: string[] = [];
      if (detection.evidence.filesFound.length > 0) {
        evidenceItems.push(`✅ ${detection.evidence.filesFound.length} file(s) exist`);
      }
      if (detection.evidence.usageDetected.length > 0) {
        evidenceItems.push(`✅ ${detection.evidence.usageDetected.length} import(s) detected`);
      }
      if (detection.evidence.testsFound.length > 0) {
        evidenceItems.push(`✅ ${detection.evidence.testsFound.length} test(s) found`);
      }
      if (detection.evidence.codePatterns.length > 0) {
        evidenceItems.push(`🔍 ${detection.evidence.codePatterns.length} keyword match(es)`);
      }

      if (evidenceItems.length > 0) {
        for (const item of evidenceItems) {
          lines.push(`- ${item}`);
        }
      } else {
        lines.push('- ❌ No evidence found');
      }
      lines.push('');

      // Show what's missing (why low confidence) - feature-specific
      if (detection.confidence < 60) {
        lines.push('**Why Low Confidence?**');
        const missing: string[] = [];

        if (detection.evidence.filesFound.length === 0) {
          // Generate contextual explanation of what's missing
          const explanation = explainMissingImplementation(detection.feature.description);
          missing.push(`⚠️ ${explanation}`);
        }

        if (detection.evidence.usageDetected.length === 0 && detection.evidence.filesFound.length > 0) {
          missing.push('⚠️ Files exist but aren\'t imported/used anywhere in the codebase');
        }

        if (detection.evidence.testsFound.length === 0) {
          const testSuggestion = generateTestSuggestion(detection.feature.description);
          missing.push(`⚠️ No test coverage (consider adding \`${testSuggestion}\`)`);
        }

        if (detection.evidence.codePatterns.length > 0 && detection.evidence.filesFound.length === 0) {
          const keywords = detection.evidence.codePatterns
            .slice(0, 3)
            .map(p => `"${p.snippet.substring(0, 30)}${p.snippet.length > 30 ? '...' : ''}"`)
            .join(', ');
          missing.push(`⚠️ Only found keyword matches (${keywords}) - no dedicated implementation`);
        }

        for (const item of missing) {
          lines.push(`- ${item}`);
        }
        lines.push('');
      }

      // Show detailed evidence (collapsed by default in MD viewers)
      if (detection.evidence.filesFound.length > 0) {
        lines.push('<details>');
        lines.push('<summary>Files Found</summary>');
        lines.push('');
        for (const file of detection.evidence.filesFound) {
          lines.push(`- \`${file}\``);
        }
        lines.push('');
        lines.push('</details>');
        lines.push('');
      }

      if (detection.evidence.usageDetected.length > 0) {
        // Filter out dist/ build artifacts and truncate long statements
        const filteredUsage = detection.evidence.usageDetected
          .filter(u => !u.file.includes('/dist/') && !u.file.startsWith('dist/'))
          .slice(0, 5);

        if (filteredUsage.length > 0) {
          lines.push('<details>');
          lines.push('<summary>Usage Detected</summary>');
          lines.push('');
          for (const usage of filteredUsage) {
            // Truncate very long import statements (e.g., minified code)
            const truncatedStatement = usage.importStatement.length > 100
              ? usage.importStatement.substring(0, 100) + '...'
              : usage.importStatement;
            lines.push(`- \`${usage.file}:${usage.line}\` - \`${truncatedStatement}\``);
          }
          if (detection.evidence.usageDetected.length > 5) {
            lines.push(`- ... and ${detection.evidence.usageDetected.length - 5} more`);
          }
          lines.push('');
          lines.push('</details>');
          lines.push('');
        }
      }

      if (detection.evidence.testsFound.length > 0) {
        lines.push('<details>');
        lines.push('<summary>Tests Found</summary>');
        lines.push('');
        for (const test of detection.evidence.testsFound) {
          lines.push(`- \`${test}\``);
        }
        lines.push('');
        lines.push('</details>');
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

/**
 * Generate contextual explanation of what's missing based on feature type
 */
function explainMissingImplementation(description: string): string {
  const lower = description.toLowerCase();

  // Detect task type and provide contextual explanation

  // 1. Configuration/Setup tasks
  if (lower.match(/\.(env|gitignore|config|json|yaml|yml)/i) ||
      lower.match(/(configure|setup|install|add.*to|enable|disable)/i)) {
    return `This appears to be a configuration task. The implementation likely involves modifying config files (like \`package.json\`, \`.env\`, or framework configs) rather than creating new source files. Check if the configuration has been applied to existing files.`;
  }

  // 2. Maintenance/Optimization tasks
  if (lower.match(/(audit|optimize|refactor|improve|clean|remove|upgrade|update.*dependencies)/i)) {
    return `This looks like a maintenance or optimization task. Rather than creating new files, this work typically involves refactoring existing code, updating dependencies in \`package.json\`, or using CLI tools. Check commit history for changes that improved performance or reduced dependencies.`;
  }

  // 3. Testing/Verification tasks (shouldn't appear but just in case)
  if (lower.match(/(test|verify|check|ensure|validate)/i) && lower.match(/(pass|work|correct|proper)/i)) {
    return `This appears to be a verification task rather than a feature implementation. It likely involves manual testing or automated test execution rather than creating implementation files. Look for test files or CI/CD configurations that validate this behavior.`;
  }

  // 4. Documentation tasks
  if (lower.match(/(document|readme|guide|tutorial|wiki|changelog)/i)) {
    return `This is a documentation task. Look for markdown files (*.md) in \`docs/\`, \`README.md\`, or inline code comments. Documentation might exist in the codebase but wasn't detected by file name patterns.`;
  }

  // 5. Build/Deploy/Infrastructure tasks
  if (lower.match(/(deploy|build|bundle|ci|cd|pipeline|docker|vercel|netlify)/i)) {
    return `This appears to be an infrastructure or build configuration task. Check for changes to build configs (like \`vite.config.ts\`, \`webpack.config.js\`), deployment files (\`vercel.json\`, \`Dockerfile\`), or CI/CD pipelines (\`.github/workflows\`).`;
  }

  // 6. Cache/Performance behavior
  if (lower.match(/(cache|lazy.*load|performance|speed|faster)/i)) {
    return `This seems to be a performance optimization that modifies existing behavior. Rather than new files, look for caching strategies in API routes, lazy loading in components, or performance configurations. The implementation might be scattered across multiple existing files.`;
  }

  // 7. UI/Component features (default for most features)
  if (lower.match(/(button|component|page|form|modal|dialog|menu|nav|header|footer|card|list|table)/i)) {
    const componentName = extractComponentName(description);
    return `No dedicated implementation files found for this UI feature. Expected to find component files like \`${componentName}.tsx\` or \`${componentName}/index.tsx\` in the \`components/\` or \`src/\` directories. The feature might be implemented inline within a larger component.`;
  }

  // 8. API/Backend features
  if (lower.match(/(api|endpoint|route|handler|middleware|server|backend)/i)) {
    const routeName = extractRouteName(description);
    return `No API implementation files found. Expected to find route handlers in \`api/\`, \`pages/api/\`, or similar backend directories. Look for files like \`${routeName}.ts\` or middleware that handles this functionality.`;
  }

  // 9. State management/Hooks
  if (lower.match(/(state|store|context|hook|reducer|action)/i)) {
    return `No state management files found. Expected to find custom hooks (\`use*.ts\`), context providers, or store configurations. The state might be managed locally within components rather than in dedicated files.`;
  }

  // Default: Generic feature implementation
  return `No dedicated implementation files found. This feature might be implemented inline within existing components, handled by external libraries, or the implementation uses different naming conventions than expected. Check if the functionality exists but is organized differently.`;
}

/**
 * Extract a reasonable component name from description
 */
function extractComponentName(description: string): string {
  const words = description
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !['with', 'from', 'that', 'this', 'have', 'button', 'component'].includes(w.toLowerCase()))
    .slice(0, 3);

  return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
}

/**
 * Extract a reasonable route name from description
 */
function extractRouteName(description: string): string {
  const words = description
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !['with', 'from', 'that', 'this', 'have', 'api', 'endpoint'].includes(w))
    .slice(0, 2);

  return words.join('-');
}

/**
 * Generate feature-specific test file suggestion
 */
function generateTestSuggestion(description: string): string {
  const words = description
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !['with', 'from', 'that', 'this', 'have'].includes(w));

  if (words.length === 0) return 'feature.test.ts';

  // Generate kebab-case test name
  const kebabCase = words.slice(0, 3).join('-');

  return `${kebabCase}.test.ts`;
}
