/**
 * State tracker for managing processed TODOs and preventing duplicates
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { StateFile, ProcessedTodo, TodoItem } from '../types';

/**
 * Generate SHA256 hash for a TODO item
 */
export function generateTodoHash(todo: TodoItem | ProcessedTodo): string {
  const content = `${todo.file}:${todo.line}:${todo.type}:${todo.content}`;
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Load state from file
 */
export function loadState(statePath: string): StateFile {
  const defaultState: StateFile = {
    lastUpdated: new Date().toISOString(),
    processedTodos: [],
    metadata: {
      totalProcessed: 0,
      totalIssuesCreated: 0
    }
  };

  if (!fs.existsSync(statePath)) {
    return defaultState;
  }

  try {
    const content = fs.readFileSync(statePath, 'utf-8');
    const state = JSON.parse(content) as StateFile;

    // Validate state structure
    if (!state.processedTodos || !Array.isArray(state.processedTodos)) {
      console.warn('Invalid state file structure, using default state');
      return defaultState;
    }

    return state;
  } catch (error) {
    console.error('Error loading state:', error);
    return defaultState;
  }
}

/**
 * Save state to file
 */
export function saveState(statePath: string, state: StateFile): void {
  try {
    // Ensure directory exists
    const dir = path.dirname(statePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Update timestamp
    state.lastUpdated = new Date().toISOString();

    // Write state file
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving state:', error);
    throw error;
  }
}

/**
 * Check if a TODO has been processed
 */
export function isProcessed(state: StateFile, todoHash: string): boolean {
  return state.processedTodos.some(todo => todo.hash === todoHash);
}

/**
 * Get processed TODO by hash
 */
export function getProcessedTodo(state: StateFile, todoHash: string): ProcessedTodo | undefined {
  return state.processedTodos.find(todo => todo.hash === todoHash);
}

/**
 * Add processed TODO to state
 */
export function addProcessedTodo(
  state: StateFile,
  todo: TodoItem,
  issueUrl?: string,
  issueNumber?: number,
  status: 'created' | 'failed' | 'skipped' = 'created',
  error?: string
): void {
  const hash = todo.hash || generateTodoHash(todo);

  const processedTodo: ProcessedTodo = {
    hash,
    content: todo.content,
    file: todo.file,
    line: todo.line,
    type: todo.type,
    priority: todo.priority,
    processedAt: new Date().toISOString(),
    issueUrl,
    issueNumber,
    status,
    error
  };

  // Remove existing entry if present (update scenario)
  state.processedTodos = state.processedTodos.filter(t => t.hash !== hash);

  // Add new entry
  state.processedTodos.push(processedTodo);

  // Update metadata
  state.metadata.totalProcessed = state.processedTodos.length;
  if (status === 'created') {
    state.metadata.totalIssuesCreated = state.processedTodos.filter(
      t => t.status === 'created'
    ).length;
  }
}

/**
 * Filter out already processed TODOs
 */
export function filterNewTodos(state: StateFile, todos: TodoItem[]): TodoItem[] {
  return todos.filter(todo => {
    const hash = todo.hash || generateTodoHash(todo);
    return !isProcessed(state, hash);
  });
}

/**
 * Get statistics from state
 */
export interface StateStats {
  totalProcessed: number;
  totalCreated: number;
  totalFailed: number;
  totalSkipped: number;
  byPriority: Record<string, number>;
  byType: Record<string, number>;
  recentActivity: ProcessedTodo[];
}

export function getStateStats(state: StateFile, daysBack: number = 7): StateStats {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);

  const recentTodos = state.processedTodos.filter(todo => {
    const processedDate = new Date(todo.processedAt);
    return processedDate >= cutoffDate;
  });

  const byPriority: Record<string, number> = {
    high: 0,
    medium: 0,
    low: 0
  };

  const byType: Record<string, number> = {};

  let totalCreated = 0;
  let totalFailed = 0;
  let totalSkipped = 0;

  for (const todo of state.processedTodos) {
    // Count by priority
    byPriority[todo.priority] = (byPriority[todo.priority] || 0) + 1;

    // Count by type
    byType[todo.type] = (byType[todo.type] || 0) + 1;

    // Count by status
    if (todo.status === 'created') totalCreated++;
    if (todo.status === 'failed') totalFailed++;
    if (todo.status === 'skipped') totalSkipped++;
  }

  return {
    totalProcessed: state.processedTodos.length,
    totalCreated,
    totalFailed,
    totalSkipped,
    byPriority,
    byType,
    recentActivity: recentTodos
  };
}

/**
 * Clean up old entries from state (optional maintenance)
 */
export function cleanupOldEntries(
  state: StateFile,
  daysToKeep: number = 60
): StateFile {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const filteredTodos = state.processedTodos.filter(todo => {
    const processedDate = new Date(todo.processedAt);
    // Keep if recent OR if there's an issue URL (successfully created)
    return processedDate >= cutoffDate || todo.issueUrl;
  });

  return {
    ...state,
    processedTodos: filteredTodos,
    metadata: {
      ...state.metadata,
      totalProcessed: filteredTodos.length,
      totalIssuesCreated: filteredTodos.filter(t => t.status === 'created').length
    }
  };
}
