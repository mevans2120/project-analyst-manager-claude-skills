/**
 * Label manager for determining and applying labels to GitHub issues
 */

import { TodoItem, LabelMapping, LabelResult } from '../types';

/**
 * Default label mappings
 */
export const DEFAULT_LABEL_MAPPING: LabelMapping = {
  'TODO': ['feature', 'priority-medium'],
  'FIXME': ['bug', 'priority-high'],
  'BUG': ['bug', 'priority-high'],
  'HACK': ['tech-debt', 'priority-low'],
  'OPTIMIZE': ['enhancement', 'priority-low'],
  'REFACTOR': ['refactor', 'priority-medium'],
  'NOTE': ['documentation', 'priority-low'],
  'XXX': ['needs-review', 'priority-medium'],
  'Unchecked Task': ['task', 'priority-medium'],
  'TODO Section': ['feature', 'priority-medium'],
  'Action Item': ['action-item', 'priority-high'],
  'Incomplete Note': ['incomplete', 'priority-medium']
};

/**
 * Priority to label mapping
 */
export const PRIORITY_LABELS: Record<string, string> = {
  'high': 'priority-high',
  'medium': 'priority-medium',
  'low': 'priority-low'
};

/**
 * Source labels
 */
export const SOURCE_LABELS = {
  fromTodo: 'from-todo',
  fromSpec: 'from-spec',
  fromGap: 'from-gap'
};

/**
 * Determine labels for a TODO item
 */
export function determineLabels(
  todo: TodoItem,
  customMapping?: LabelMapping,
  defaultLabels: string[] = ['auto-created']
): LabelResult {
  const mapping = customMapping || DEFAULT_LABEL_MAPPING;
  const labels = new Set<string>(defaultLabels);

  // Get labels based on TODO type
  const typeLabels = mapping[todo.type] || [];
  typeLabels.forEach(label => labels.add(label));

  // Add priority label if not already included
  const priorityLabel = PRIORITY_LABELS[todo.priority];
  if (priorityLabel && !Array.from(labels).some(l => l.startsWith('priority-'))) {
    labels.add(priorityLabel);
  }

  // Add source label
  labels.add(SOURCE_LABELS.fromTodo);

  // Add category-based label
  if (todo.category === 'markdown') {
    labels.add('from-markdown');
  } else if (todo.category === 'code') {
    labels.add('from-code');
  }

  return {
    labels: Array.from(labels),
    priority: todo.priority
  };
}

/**
 * Extract issue type from labels
 */
export function getIssueType(labels: string[]): string {
  const typeMapping: Record<string, string> = {
    'bug': 'bug',
    'feature': 'feature',
    'enhancement': 'enhancement',
    'tech-debt': 'tech-debt',
    'refactor': 'refactor',
    'documentation': 'documentation',
    'task': 'task',
    'action-item': 'action-item'
  };

  for (const label of labels) {
    if (typeMapping[label]) {
      return typeMapping[label];
    }
  }

  return 'task'; // default
}

/**
 * Get emoji for issue type
 */
export function getTypeEmoji(type: string): string {
  const emojiMapping: Record<string, string> = {
    'bug': '🐛',
    'feature': '✨',
    'enhancement': '🚀',
    'tech-debt': '⚠️',
    'refactor': '♻️',
    'documentation': '📝',
    'task': '✅',
    'action-item': '🎯'
  };

  return emojiMapping[type] || '📌';
}

/**
 * Validate label names (GitHub label naming rules)
 */
export function validateLabel(label: string): boolean {
  // GitHub labels must be 1-50 characters
  if (label.length === 0 || label.length > 50) {
    return false;
  }

  // Cannot be only whitespace
  if (label.trim().length === 0) {
    return false;
  }

  return true;
}

/**
 * Sanitize label name
 */
export function sanitizeLabel(label: string): string {
  // Trim and lowercase
  let sanitized = label.trim().toLowerCase();

  // Replace spaces with hyphens
  sanitized = sanitized.replace(/\s+/g, '-');

  // Remove invalid characters
  sanitized = sanitized.replace(/[^a-z0-9-_]/g, '');

  // Ensure not too long
  if (sanitized.length > 50) {
    sanitized = sanitized.substring(0, 50);
  }

  return sanitized;
}

/**
 * Get all unique labels from a list of TODOs
 */
export function getAllLabels(
  todos: TodoItem[],
  customMapping?: LabelMapping,
  defaultLabels: string[] = ['auto-created']
): string[] {
  const allLabels = new Set<string>();

  for (const todo of todos) {
    const { labels } = determineLabels(todo, customMapping, defaultLabels);
    labels.forEach(label => allLabels.add(label));
  }

  return Array.from(allLabels).sort();
}

/**
 * Group TODOs by label
 */
export function groupByLabel(todos: TodoItem[], customMapping?: LabelMapping): Map<string, TodoItem[]> {
  const grouped = new Map<string, TodoItem[]>();

  for (const todo of todos) {
    const { labels } = determineLabels(todo, customMapping);

    for (const label of labels) {
      const existing = grouped.get(label) || [];
      existing.push(todo);
      grouped.set(label, existing);
    }
  }

  return grouped;
}
