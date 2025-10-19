/**
 * Core TODO scanner implementation
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { TodoItem, TodoPattern, getPatternsForFile } from './patterns';
import { traverseFiles, readFileSafely, TraversalOptions } from '../utils/fileTraversal';
import { isInArchivedPath } from './completionPatterns';

export interface ScanOptions extends Partial<TraversalOptions> {
  rootPath: string;
  patterns?: TodoPattern[];
  includeCompleted?: boolean;
  groupByFile?: boolean;
  generateHash?: boolean;
  excludeArchives?: boolean;
}

export interface ScanResult {
  todos: TodoItem[];
  summary: ScanSummary;
  scanDate: string;
  rootPath: string;
}

export interface ScanSummary {
  totalTodos: number;
  byPriority: Record<string, number>;
  byType: Record<string, number>;
  byFile: Record<string, number>;
  filesScanned: number;
  scanDuration: number;
}

export interface ProcessedTodo extends TodoItem {
  id: string;
  hash: string;
}

/**
 * Generate a unique hash for a TODO item
 */
export function generateTodoHash(todo: TodoItem): string {
  const content = `${todo.file}:${todo.line}:${todo.type}:${todo.content}`;
  return crypto.createHash('md5').update(content).digest('hex');
}

/**
 * Generate a unique ID for a TODO item
 */
function generateTodoId(todo: TodoItem, index: number): string {
  const timestamp = Date.now();
  return `todo-${timestamp}-${index}`;
}

/**
 * Extract TODO items from file content
 */
function extractTodosFromContent(
  content: string,
  filePath: string,
  patterns: TodoPattern[]
): TodoItem[] {
  const todos: TodoItem[] = [];
  const lines = content.split('\n');

  for (const pattern of patterns) {
    // Reset regex lastIndex for each pattern
    pattern.regex.lastIndex = 0;

    let match;
    while ((match = pattern.regex.exec(content)) !== null) {
      const matchedText = match[0];
      const todoContent = match[1] || matchedText;

      // Find line number
      const position = match.index;
      let lineNumber = 1;
      let charCount = 0;

      for (let i = 0; i < lines.length; i++) {
        charCount += lines[i].length + 1; // +1 for newline
        if (charCount > position) {
          lineNumber = i + 1;
          break;
        }
      }

      todos.push({
        type: pattern.name,
        content: todoContent.trim(),
        file: filePath,
        line: lineNumber,
        priority: pattern.priority,
        category: pattern.category,
        rawText: matchedText
      });
    }
  }

  // Sort by line number
  todos.sort((a, b) => a.line - b.line);

  return todos;
}

/**
 * Main scanner function
 */
export async function scanTodos(options: ScanOptions): Promise<ScanResult> {
  const startTime = Date.now();
  const {
    rootPath,
    patterns,
    includeCompleted = false,
    groupByFile = false,
    generateHash = true,
    excludeArchives = false,
    ...traversalOptions
  } = options;

  // Get all files to scan
  const files = await traverseFiles({
    rootPath,
    ...traversalOptions
  });

  const allTodos: TodoItem[] = [];
  const byFile: Record<string, number> = {};

  // Scan each file
  for (const file of files) {
    const content = readFileSafely(file.path);
    if (!content) continue;

    // Get patterns for this file type
    const filePatterns = patterns || getPatternsForFile(file.path);

    // Extract TODOs
    const fileTodos = extractTodosFromContent(
      content,
      file.relativePath,
      filePatterns
    );

    if (fileTodos.length > 0) {
      byFile[file.relativePath] = fileTodos.length;
      allTodos.push(...fileTodos);
    }
  }

  // Filter out archived TODOs if requested
  let filteredTodos = allTodos;
  if (excludeArchives) {
    filteredTodos = filteredTodos.filter(todo => !isInArchivedPath(todo.file));
  }

  // Filter out completed tasks if requested
  if (!includeCompleted) {
    filteredTodos = filteredTodos.filter(todo => {
      // Check if it's a completed markdown task
      if (todo.type === 'Unchecked Task') {
        return true; // Keep unchecked tasks
      }
      return !todo.rawText.includes('[x]') && !todo.rawText.includes('[X]');
    });
  }

  // Calculate summary statistics
  const byPriority: Record<string, number> = {
    high: 0,
    medium: 0,
    low: 0
  };
  const byType: Record<string, number> = {};

  for (const todo of filteredTodos) {
    // Count by priority
    byPriority[todo.priority]++;

    // Count by type
    byType[todo.type] = (byType[todo.type] || 0) + 1;
  }

  const summary: ScanSummary = {
    totalTodos: filteredTodos.length,
    byPriority,
    byType,
    byFile,
    filesScanned: files.length,
    scanDuration: Date.now() - startTime
  };

  return {
    todos: filteredTodos,
    summary,
    scanDate: new Date().toISOString(),
    rootPath
  };
}

/**
 * Process scan results and add IDs and hashes
 */
export function processScanResults(result: ScanResult): {
  todos: ProcessedTodo[];
  summary: ScanSummary;
  scanDate: string;
  rootPath: string;
} {
  const processedTodos: ProcessedTodo[] = result.todos.map((todo, index) => ({
    ...todo,
    id: generateTodoId(todo, index),
    hash: generateTodoHash(todo)
  }));

  return {
    ...result,
    todos: processedTodos
  };
}

/**
 * Load state from previous scan
 */
export function loadPreviousState(statePath: string): Set<string> {
  const processedHashes = new Set<string>();

  if (fs.existsSync(statePath)) {
    try {
      const stateContent = fs.readFileSync(statePath, 'utf-8');
      const state = JSON.parse(stateContent);

      if (state.processedTodos && Array.isArray(state.processedTodos)) {
        for (const todo of state.processedTodos) {
          if (todo.hash) {
            processedHashes.add(todo.hash);
          }
        }
      }
    } catch (error) {
      console.error('Error loading previous state:', error);
    }
  }

  return processedHashes;
}

/**
 * Save current state
 */
export function saveState(
  statePath: string,
  processedTodos: ProcessedTodo[],
  metadata: any = {}
): void {
  const state = {
    lastUpdated: new Date().toISOString(),
    processedTodos,
    metadata
  };

  try {
    // Ensure directory exists
    const dir = path.dirname(statePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
  } catch (error) {
    console.error('Error saving state:', error);
  }
}

/**
 * Find new TODOs by comparing with previous state
 */
export function findNewTodos(
  currentTodos: ProcessedTodo[],
  previousHashes: Set<string>
): ProcessedTodo[] {
  return currentTodos.filter(todo => !previousHashes.has(todo.hash));
}

/**
 * Group TODOs by file
 */
export function groupTodosByFile(todos: TodoItem[]): Map<string, TodoItem[]> {
  const grouped = new Map<string, TodoItem[]>();

  for (const todo of todos) {
    const fileTodos = grouped.get(todo.file) || [];
    fileTodos.push(todo);
    grouped.set(todo.file, fileTodos);
  }

  return grouped;
}

/**
 * Group TODOs by priority
 */
export function groupTodosByPriority(todos: TodoItem[]): Map<string, TodoItem[]> {
  const grouped = new Map<string, TodoItem[]>();

  for (const todo of todos) {
    const priorityTodos = grouped.get(todo.priority) || [];
    priorityTodos.push(todo);
    grouped.set(todo.priority, priorityTodos);
  }

  return grouped;
}

/**
 * Filter TODOs by various criteria
 */
export function filterTodos(
  todos: TodoItem[],
  filters: {
    priority?: string[];
    type?: string[];
    file?: string[];
    searchTerm?: string;
  }
): TodoItem[] {
  return todos.filter(todo => {
    // Filter by priority
    if (filters.priority && filters.priority.length > 0) {
      if (!filters.priority.includes(todo.priority)) {
        return false;
      }
    }

    // Filter by type
    if (filters.type && filters.type.length > 0) {
      if (!filters.type.includes(todo.type)) {
        return false;
      }
    }

    // Filter by file
    if (filters.file && filters.file.length > 0) {
      const matchesFile = filters.file.some(pattern =>
        todo.file.includes(pattern)
      );
      if (!matchesFile) {
        return false;
      }
    }

    // Filter by search term
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      const contentMatches = todo.content.toLowerCase().includes(searchLower);
      const fileMatches = todo.file.toLowerCase().includes(searchLower);
      if (!contentMatches && !fileMatches) {
        return false;
      }
    }

    return true;
  });
}