/**
 * Completion detection and analysis for TODOs
 */

import * as fs from 'fs';
import { TodoItem } from './patterns';
import {
  CompletionAnalysis as PatternCompletionAnalysis,
  checkDirectCompletion,
  analyzeContext,
  isInOldDocument,
  calculateCompletionConfidence,
  generateSuggestions,
  isInArchivedPath
} from './completionPatterns';

// Re-export for external use
export type CompletionAnalysis = PatternCompletionAnalysis;

export interface CompletionReport {
  totalTodos: number;
  likelyCompleted: number;
  probablyCompleted: number;
  possiblyCompleted: number;
  activeCount: number;
  analyses: CompletionAnalysis[];
  summary: {
    veryHighConfidence: number; // >= 90
    highConfidence: number;     // 70-89
    mediumConfidence: number;   // 50-69
    lowConfidence: number;      // 30-49
    active: number;             // < 30
  };
  recommendations: {
    safeToClose: CompletionAnalysis[];
    needsReview: CompletionAnalysis[];
    possiblyDone: CompletionAnalysis[];
  };
}

/**
 * Analyze a single TODO for completion
 */
export function analyzeTodoCompletion(
  todo: TodoItem,
  fileContent: string,
  filePath: string
): CompletionAnalysis {
  const reasons: string[] = [];
  const suggestions: string[] = [];

  // Step 1: Check the TODO text itself
  const directCheck = checkDirectCompletion(todo.rawText);
  if (directCheck.isCompleted) {
    reasons.push(directCheck.reason);
  }

  // Step 2: Analyze surrounding context
  const contextCheck = analyzeContext(fileContent, todo.line);
  if (contextCheck.hasCompletionIndicator) {
    reasons.push(...contextCheck.indicators);
  }

  // Step 3: Check if document is archived/old
  const oldDocCheck = isInOldDocument(filePath, fileContent);
  if (oldDocCheck.isOld) {
    reasons.push(...oldDocCheck.reasons);
  }

  // Step 4: Check file path for archive indicators
  if (isInArchivedPath(filePath)) {
    reasons.push('File is in archived directory');
  }

  // Step 5: Calculate overall confidence
  const confidence = calculateCompletionConfidence(
    directCheck,
    contextCheck,
    oldDocCheck
  );

  // Step 6: Generate suggestions
  const generatedSuggestions = generateSuggestions(confidence, reasons);
  suggestions.push(...generatedSuggestions);

  return {
    todo,
    isLikelyCompleted: confidence >= 70,
    confidence,
    reasons,
    suggestions
  };
}

/**
 * Analyze all TODOs for completion
 */
export function analyzeCompletions(
  todos: TodoItem[],
  rootPath: string
): CompletionReport {
  const analyses: CompletionAnalysis[] = [];

  // Group TODOs by file for efficient file reading
  const todosByFile = new Map<string, TodoItem[]>();
  for (const todo of todos) {
    const fileTodos = todosByFile.get(todo.file) || [];
    fileTodos.push(todo);
    todosByFile.set(todo.file, fileTodos);
  }

  // Analyze each file's TODOs
  for (const [relativePath, fileTodos] of todosByFile) {
    const fullPath = `${rootPath}/${relativePath}`;

    // Read file content once
    let fileContent = '';
    try {
      fileContent = fs.readFileSync(fullPath, 'utf-8');
    } catch (error) {
      console.warn(`Could not read file: ${fullPath}`);
      continue;
    }

    // Analyze each TODO in the file
    for (const todo of fileTodos) {
      const analysis = analyzeTodoCompletion(todo, fileContent, relativePath);
      analyses.push(analysis);
    }
  }

  // Calculate summary statistics
  const summary = {
    veryHighConfidence: analyses.filter(a => a.confidence >= 90).length,
    highConfidence: analyses.filter(a => a.confidence >= 70 && a.confidence < 90).length,
    mediumConfidence: analyses.filter(a => a.confidence >= 50 && a.confidence < 70).length,
    lowConfidence: analyses.filter(a => a.confidence >= 30 && a.confidence < 50).length,
    active: analyses.filter(a => a.confidence < 30).length
  };

  // Generate recommendations
  const recommendations = {
    safeToClose: analyses.filter(a => a.confidence >= 90),
    needsReview: analyses.filter(a => a.confidence >= 70 && a.confidence < 90),
    possiblyDone: analyses.filter(a => a.confidence >= 50 && a.confidence < 70)
  };

  return {
    totalTodos: todos.length,
    likelyCompleted: summary.veryHighConfidence,
    probablyCompleted: summary.highConfidence,
    possiblyCompleted: summary.mediumConfidence,
    activeCount: summary.lowConfidence + summary.active,
    analyses,
    summary,
    recommendations
  };
}

/**
 * Filter TODOs based on completion status
 */
export function filterByCompletionStatus(
  analyses: CompletionAnalysis[],
  includeCompleted: boolean = false,
  minConfidence: number = 0
): TodoItem[] {
  return analyses
    .filter(a => {
      if (!includeCompleted && a.isLikelyCompleted) {
        return false;
      }
      return a.confidence >= minConfidence;
    })
    .map(a => a.todo);
}

/**
 * Get statistics about completion analysis
 */
export function getCompletionStats(report: CompletionReport): {
  completionRate: number;
  recommendedActions: {
    close: number;
    review: number;
    verify: number;
    keep: number;
  };
  potentialCleanup: number;
} {
  const totalProcessed = report.totalTodos;
  const likelyDone = report.likelyCompleted + report.probablyCompleted;

  return {
    completionRate: totalProcessed > 0 ? (likelyDone / totalProcessed) * 100 : 0,
    recommendedActions: {
      close: report.recommendations.safeToClose.length,
      review: report.recommendations.needsReview.length,
      verify: report.recommendations.possiblyDone.length,
      keep: report.activeCount
    },
    potentialCleanup: likelyDone
  };
}

/**
 * Group completed TODOs by file for batch processing
 */
export function groupCompletedByFile(
  analyses: CompletionAnalysis[],
  minConfidence: number = 70
): Map<string, CompletionAnalysis[]> {
  const grouped = new Map<string, CompletionAnalysis[]>();

  for (const analysis of analyses) {
    if (analysis.confidence >= minConfidence) {
      const file = analysis.todo.file;
      const fileAnalyses = grouped.get(file) || [];
      fileAnalyses.push(analysis);
      grouped.set(file, fileAnalyses);
    }
  }

  return grouped;
}

/**
 * Get files with the most likely completed TODOs
 */
export function getTopCleanupCandidates(
  report: CompletionReport,
  limit: number = 10
): Array<{ file: string; count: number; avgConfidence: number }> {
  const fileStats = new Map<string, { count: number; totalConfidence: number }>();

  for (const analysis of report.analyses) {
    if (analysis.confidence >= 70) {
      const file = analysis.todo.file;
      const stats = fileStats.get(file) || { count: 0, totalConfidence: 0 };
      stats.count++;
      stats.totalConfidence += analysis.confidence;
      fileStats.set(file, stats);
    }
  }

  return Array.from(fileStats.entries())
    .map(([file, stats]) => ({
      file,
      count: stats.count,
      avgConfidence: stats.totalConfidence / stats.count
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}