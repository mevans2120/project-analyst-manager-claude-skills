/**
 * Patterns and logic for detecting completed TODOs
 */

import { TodoItem } from './patterns';

export interface CompletionIndicator {
  pattern: RegExp;
  confidence: number; // 0-100
  description: string;
  contextRequired: boolean;
}

export interface CompletionAnalysis {
  todo: TodoItem;
  isLikelyCompleted: boolean;
  confidence: number;
  reasons: string[];
  suggestions: string[];
}

/**
 * Patterns that indicate a TODO is completed
 */
export const COMPLETION_INDICATORS: CompletionIndicator[] = [
  // Explicit completion markers
  {
    pattern: /\[x\]|\[X\]|✓|✅|☑/gi,
    confidence: 95,
    description: 'Task explicitly marked as completed',
    contextRequired: false
  },
  {
    pattern: /\b(completed|done|finished|implemented|resolved|fixed|merged)\b/gi,
    confidence: 80,
    description: 'Contains completion keywords',
    contextRequired: true
  },
  {
    pattern: /\b(status:\s*(done|complete|implemented|finished))\b/gi,
    confidence: 90,
    description: 'Explicit status indicator',
    contextRequired: true
  },

  // Temporal indicators
  {
    pattern: /\b(as of|completed on|done on|finished on)\s+\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/gi,
    confidence: 85,
    description: 'Date-stamped completion',
    contextRequired: true
  },
  {
    pattern: /\b(deployed|shipped|released|live|in production)\b/gi,
    confidence: 75,
    description: 'Deployment/release indicators',
    contextRequired: true
  },

  // Strikethrough and formatting
  {
    pattern: /~~.+~~|<del>.+<\/del>|<strike>.+<\/strike>/gi,
    confidence: 90,
    description: 'Strikethrough formatting',
    contextRequired: false
  },

  // Archive indicators
  {
    pattern: /\b(archived|obsolete|deprecated|no longer needed|cancelled|not needed)\b/gi,
    confidence: 85,
    description: 'Task is archived or obsolete',
    contextRequired: true
  },

  // Update indicators
  {
    pattern: /\bupdate:?\s*(done|complete|this is now (done|completed|working))/gi,
    confidence: 80,
    description: 'Update notes indicating completion',
    contextRequired: true
  }
];

/**
 * Patterns that suggest a file/section is outdated
 */
export const OUTDATED_INDICATORS = [
  /\b(old|legacy|archived|superseded|replaced by|migrated to)\b/gi,
  /\b(phase\s+[0-9])\b/gi, // Phase numbering might indicate old phases
  /\b(\d{4})\b/gi, // Years that might indicate old documents
  /\bv[0-9]+\.[0-9]+/gi, // Version numbers that might be outdated
];

/**
 * Patterns for file paths that suggest archives
 */
export const ARCHIVE_PATH_PATTERNS = [
  /_archive\//i,
  /\/archive\//i,
  /\/old\//i,
  /\/deprecated\//i,
  /\/legacy\//i,
  /\.old\./i,
  /\.backup\./i,
  /_old_/i,
  /_deprecated_/i
];

/**
 * Check if a TODO is in an archived path
 */
export function isInArchivedPath(filePath: string): boolean {
  return ARCHIVE_PATH_PATTERNS.some(pattern => pattern.test(filePath));
}

/**
 * Analyze nearby context for completion indicators
 */
export function analyzeContext(
  content: string,
  todoLine: number,
  contextLines: number = 3
): {
  hasCompletionIndicator: boolean;
  confidence: number;
  indicators: string[];
} {
  const lines = content.split('\n');
  const startLine = Math.max(0, todoLine - contextLines - 1);
  const endLine = Math.min(lines.length, todoLine + contextLines);

  const contextText = lines.slice(startLine, endLine).join('\n');

  const indicators: string[] = [];
  let totalConfidence = 0;
  let matchCount = 0;

  for (const indicator of COMPLETION_INDICATORS) {
    if (!indicator.contextRequired) continue;

    indicator.pattern.lastIndex = 0;
    const matches = contextText.match(indicator.pattern);

    if (matches) {
      indicators.push(indicator.description);
      totalConfidence += indicator.confidence;
      matchCount++;
    }
  }

  const avgConfidence = matchCount > 0 ? totalConfidence / matchCount : 0;

  return {
    hasCompletionIndicator: indicators.length > 0,
    confidence: avgConfidence,
    indicators
  };
}

/**
 * Check if the TODO itself contains completion markers
 */
export function checkDirectCompletion(todoText: string): {
  isCompleted: boolean;
  confidence: number;
  reason: string;
} {
  for (const indicator of COMPLETION_INDICATORS) {
    if (indicator.contextRequired) continue;

    indicator.pattern.lastIndex = 0;
    if (indicator.pattern.test(todoText)) {
      return {
        isCompleted: true,
        confidence: indicator.confidence,
        reason: indicator.description
      };
    }
  }

  return {
    isCompleted: false,
    confidence: 0,
    reason: ''
  };
}

/**
 * Detect if a TODO is in an old/archived document
 */
export function isInOldDocument(filePath: string, fileContent: string): {
  isOld: boolean;
  confidence: number;
  reasons: string[];
} {
  const reasons: string[] = [];
  let confidence = 0;

  // Check file path
  if (isInArchivedPath(filePath)) {
    reasons.push('File is in archived directory');
    confidence += 70;
  }

  // Check for old version indicators
  const versionMatch = fileContent.match(/version\s*:?\s*([0-9]+\.[0-9]+)/i);
  if (versionMatch) {
    const version = parseFloat(versionMatch[1]);
    if (version < 1.0) {
      reasons.push(`Old version: ${versionMatch[1]}`);
      confidence += 30;
    }
  }

  // Check for phase indicators
  const phaseMatch = filePath.match(/phase[_\s-]?([0-9]+)/i);
  if (phaseMatch) {
    const phase = parseInt(phaseMatch[1]);
    if (phase <= 2) {
      reasons.push(`Early phase document: Phase ${phase}`);
      confidence += 40;
    }
  }

  // Check for old dates in document
  const dateMatches = fileContent.match(/\b(2020|2021|2022|2023)\b/gi);
  if (dateMatches && dateMatches.length > 3) {
    reasons.push('Document contains multiple old dates');
    confidence += 20;
  }

  // Check for "old", "legacy", "archived" in first 500 chars
  const header = fileContent.substring(0, 500);
  for (const pattern of OUTDATED_INDICATORS) {
    pattern.lastIndex = 0;
    if (pattern.test(header)) {
      const match = header.match(pattern);
      if (match) {
        reasons.push(`Document header mentions: "${match[0]}"`);
        confidence += 25;
      }
    }
  }

  return {
    isOld: confidence >= 50,
    confidence: Math.min(confidence, 100),
    reasons
  };
}

/**
 * Calculate overall completion confidence
 */
export function calculateCompletionConfidence(
  directCheck: ReturnType<typeof checkDirectCompletion>,
  contextCheck: ReturnType<typeof analyzeContext>,
  oldDocCheck: ReturnType<typeof isInOldDocument>
): number {
  let confidence = 0;
  let weight = 0;

  // Direct completion markers have highest weight
  if (directCheck.isCompleted) {
    confidence += directCheck.confidence * 1.5;
    weight += 1.5;
  }

  // Context indicators
  if (contextCheck.hasCompletionIndicator) {
    confidence += contextCheck.confidence * 1.2;
    weight += 1.2;
  }

  // Old document check has lower weight but still relevant
  if (oldDocCheck.isOld) {
    confidence += oldDocCheck.confidence * 0.8;
    weight += 0.8;
  }

  return weight > 0 ? Math.min(confidence / weight, 100) : 0;
}

/**
 * Generate suggestions based on confidence level
 */
export function generateSuggestions(confidence: number, reasons: string[]): string[] {
  const suggestions: string[] = [];

  if (confidence >= 90) {
    suggestions.push('✅ Very likely completed - safe to close');
    suggestions.push('Consider marking as [x] or removing from active tasks');
  } else if (confidence >= 70) {
    suggestions.push('⚠️ Probably completed - recommend manual review');
    suggestions.push('Check git history or ask team to confirm');
  } else if (confidence >= 50) {
    suggestions.push('❓ Possibly completed - needs verification');
    suggestions.push('Review recent commits or deployment history');
  } else if (confidence >= 30) {
    suggestions.push('📋 May be completed - low confidence');
    suggestions.push('Keep in TODO list but flag for review');
  } else {
    suggestions.push('🔴 Appears active - no completion indicators');
  }

  return suggestions;
}