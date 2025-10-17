/**
 * Output formatters for scan results
 */

import * as fs from 'fs';
import * as path from 'path';
import { TodoItem } from '../core/patterns';
import { ScanResult, ProcessedTodo, groupTodosByFile, groupTodosByPriority } from '../core/scanner';

export type OutputFormat = 'json' | 'markdown' | 'github' | 'csv' | 'summary';

export interface FormatterOptions {
  format: OutputFormat;
  outputPath?: string;
  groupBy?: 'file' | 'priority' | 'type' | 'none';
  includeStats?: boolean;
  compact?: boolean;
}

/**
 * Format scan results as JSON
 */
export function formatAsJSON(result: ScanResult, compact = false): string {
  return JSON.stringify(result, null, compact ? 0 : 2);
}

/**
 * Format scan results as Markdown
 */
export function formatAsMarkdown(result: ScanResult, groupBy: 'file' | 'priority' | 'type' | 'none' = 'file'): string {
  const lines: string[] = [];
  const { todos, summary, scanDate, rootPath } = result;

  // Header
  lines.push('# TODO Scan Report');
  lines.push('');
  lines.push(`**Repository:** ${rootPath}`);
  lines.push(`**Scan Date:** ${new Date(scanDate).toLocaleString()}`);
  lines.push(`**Total TODOs:** ${summary.totalTodos}`);
  lines.push('');

  // Summary Statistics
  lines.push('## Summary');
  lines.push('');
  lines.push('### By Priority');
  lines.push(`- 🔴 High: ${summary.byPriority.high || 0}`);
  lines.push(`- 🟡 Medium: ${summary.byPriority.medium || 0}`);
  lines.push(`- 🟢 Low: ${summary.byPriority.low || 0}`);
  lines.push('');

  lines.push('### By Type');
  for (const [type, count] of Object.entries(summary.byType)) {
    lines.push(`- ${type}: ${count}`);
  }
  lines.push('');

  lines.push(`**Files Scanned:** ${summary.filesScanned}`);
  lines.push(`**Scan Duration:** ${summary.scanDuration}ms`);
  lines.push('');

  // TODOs
  lines.push('## TODOs');
  lines.push('');

  if (todos.length === 0) {
    lines.push('*No TODOs found*');
  } else {
    switch (groupBy) {
      case 'file':
        const byFile = groupTodosByFile(todos);
        for (const [file, fileTodos] of byFile) {
          lines.push(`### ${file}`);
          lines.push('');
          formatTodoList(fileTodos, lines);
          lines.push('');
        }
        break;

      case 'priority':
        const byPriority = groupTodosByPriority(todos);
        const priorityOrder = ['high', 'medium', 'low'];
        for (const priority of priorityOrder) {
          const priorityTodos = byPriority.get(priority);
          if (priorityTodos && priorityTodos.length > 0) {
            const emoji = priority === 'high' ? '🔴' : priority === 'medium' ? '🟡' : '🟢';
            lines.push(`### ${emoji} ${priority.charAt(0).toUpperCase() + priority.slice(1)} Priority`);
            lines.push('');
            formatTodoList(priorityTodos, lines);
            lines.push('');
          }
        }
        break;

      case 'type':
        const byType = new Map<string, TodoItem[]>();
        for (const todo of todos) {
          const typeTodos = byType.get(todo.type) || [];
          typeTodos.push(todo);
          byType.set(todo.type, typeTodos);
        }
        for (const [type, typeTodos] of byType) {
          lines.push(`### ${type}`);
          lines.push('');
          formatTodoList(typeTodos, lines);
          lines.push('');
        }
        break;

      default:
        formatTodoList(todos, lines);
    }
  }

  return lines.join('\n');
}

/**
 * Format a list of TODOs
 */
function formatTodoList(todos: TodoItem[], lines: string[]): void {
  for (const todo of todos) {
    const priorityEmoji = todo.priority === 'high' ? '🔴' : todo.priority === 'medium' ? '🟡' : '🟢';
    lines.push(`- ${priorityEmoji} **[${todo.type}]** ${todo.content}`);
    lines.push(`  - 📁 ${todo.file}:${todo.line}`);
  }
}

/**
 * Format scan results as GitHub issues format
 */
export function formatAsGitHub(result: ScanResult): string {
  const lines: string[] = [];
  const { todos } = result;

  for (const todo of todos) {
    lines.push('---');
    lines.push(`title: "[${todo.type}] ${todo.content.slice(0, 50)}${todo.content.length > 50 ? '...' : ''}"`);
    lines.push(`labels: todo, ${todo.priority}-priority, ${todo.type.toLowerCase().replace(/\s+/g, '-')}`);
    lines.push('---');
    lines.push('');
    lines.push('## Description');
    lines.push(todo.content);
    lines.push('');
    lines.push('## Source');
    lines.push(`- **File:** \`${todo.file}\``);
    lines.push(`- **Line:** ${todo.line}`);
    lines.push(`- **Priority:** ${todo.priority}`);
    lines.push(`- **Type:** ${todo.type}`);
    lines.push('');
    lines.push('## Context');
    lines.push('```');
    lines.push(todo.rawText);
    lines.push('```');
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Format scan results as CSV
 */
export function formatAsCSV(result: ScanResult): string {
  const lines: string[] = [];
  const { todos } = result;

  // Header
  lines.push('Type,Priority,Content,File,Line');

  // Data rows
  for (const todo of todos) {
    const content = `"${todo.content.replace(/"/g, '""')}"`;
    const file = `"${todo.file}"`;
    lines.push(`${todo.type},${todo.priority},${content},${file},${todo.line}`);
  }

  return lines.join('\n');
}

/**
 * Format just the summary
 */
export function formatSummary(result: ScanResult): string {
  const { summary, scanDate, rootPath } = result;

  const lines: string[] = [];
  lines.push('TODO Scan Summary');
  lines.push('=================');
  lines.push(`Repository: ${rootPath}`);
  lines.push(`Scan Date: ${new Date(scanDate).toLocaleString()}`);
  lines.push(`Total TODOs: ${summary.totalTodos}`);
  lines.push('');
  lines.push('By Priority:');
  lines.push(`  High: ${summary.byPriority.high || 0}`);
  lines.push(`  Medium: ${summary.byPriority.medium || 0}`);
  lines.push(`  Low: ${summary.byPriority.low || 0}`);
  lines.push('');
  lines.push('By Type:');
  for (const [type, count] of Object.entries(summary.byType)) {
    lines.push(`  ${type}: ${count}`);
  }
  lines.push('');
  lines.push(`Files Scanned: ${summary.filesScanned}`);
  lines.push(`Scan Duration: ${summary.scanDuration}ms`);

  return lines.join('\n');
}

/**
 * Main formatter function
 */
export function formatOutput(result: ScanResult, options: FormatterOptions): string {
  const { format, groupBy = 'file', compact = false } = options;

  switch (format) {
    case 'json':
      return formatAsJSON(result, compact);

    case 'markdown':
      return formatAsMarkdown(result, groupBy);

    case 'github':
      return formatAsGitHub(result);

    case 'csv':
      return formatAsCSV(result);

    case 'summary':
      return formatSummary(result);

    default:
      return formatAsJSON(result, compact);
  }
}

/**
 * Write formatted output to file
 */
export function writeOutput(content: string, outputPath: string): void {
  try {
    // Ensure directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, content, 'utf-8');
    console.log(`✅ Output written to: ${outputPath}`);
  } catch (error) {
    console.error(`❌ Error writing output: ${error}`);
    throw error;
  }
}

/**
 * Create a report filename with timestamp
 */
export function generateReportFilename(format: OutputFormat, prefix = 'todo-scan'): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const extension = format === 'markdown' ? 'md' : format === 'csv' ? 'csv' : 'json';
  return `${prefix}-${timestamp}.${extension}`;
}