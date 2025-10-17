/**
 * Pattern definitions for identifying TODO items in code and markdown files
 */

export interface TodoPattern {
  name: string;
  regex: RegExp;
  priority: 'high' | 'medium' | 'low';
  category: 'code' | 'markdown' | 'both';
}

export interface TodoItem {
  type: string;
  content: string;
  file: string;
  line: number;
  priority: 'high' | 'medium' | 'low';
  category: string;
  rawText: string;
}

// Code comment patterns for various programming languages
export const CODE_PATTERNS: TodoPattern[] = [
  {
    name: 'TODO',
    regex: /(?:\/\/|#|\/\*|\*|<!--)\s*TODO:?\s*(.+?)(?:\*\/|-->)?$/gmi,
    priority: 'medium',
    category: 'code'
  },
  {
    name: 'FIXME',
    regex: /(?:\/\/|#|\/\*|\*|<!--)\s*FIXME:?\s*(.+?)(?:\*\/|-->)?$/gmi,
    priority: 'high',
    category: 'code'
  },
  {
    name: 'HACK',
    regex: /(?:\/\/|#|\/\*|\*|<!--)\s*HACK:?\s*(.+?)(?:\*\/|-->)?$/gmi,
    priority: 'low',
    category: 'code'
  },
  {
    name: 'BUG',
    regex: /(?:\/\/|#|\/\*|\*|<!--)\s*BUG:?\s*(.+?)(?:\*\/|-->)?$/gmi,
    priority: 'high',
    category: 'code'
  },
  {
    name: 'OPTIMIZE',
    regex: /(?:\/\/|#|\/\*|\*|<!--)\s*OPTIMIZE:?\s*(.+?)(?:\*\/|-->)?$/gmi,
    priority: 'low',
    category: 'code'
  },
  {
    name: 'REFACTOR',
    regex: /(?:\/\/|#|\/\*|\*|<!--)\s*REFACTOR:?\s*(.+?)(?:\*\/|-->)?$/gmi,
    priority: 'medium',
    category: 'code'
  },
  {
    name: 'NOTE',
    regex: /(?:\/\/|#|\/\*|\*|<!--)\s*NOTE:?\s*(.+?)(?:\*\/|-->)?$/gmi,
    priority: 'low',
    category: 'code'
  },
  {
    name: 'XXX',
    regex: /(?:\/\/|#|\/\*|\*|<!--)\s*XXX:?\s*(.+?)(?:\*\/|-->)?$/gmi,
    priority: 'medium',
    category: 'code'
  }
];

// Markdown-specific patterns
export const MARKDOWN_PATTERNS: TodoPattern[] = [
  {
    name: 'Unchecked Task',
    regex: /^[\s]*-\s+\[\s\]\s+(.+)$/gm,
    priority: 'medium',
    category: 'markdown'
  },
  {
    name: 'TODO Section',
    regex: /^#+\s*(?:TODO|To\s*Do|Tasks?)(?:\s*:)?\s*\n+((?:.*\n)*?)(?=^#|\Z)/gmi,
    priority: 'medium',
    category: 'markdown'
  },
  {
    name: 'Action Item',
    regex: /^(?:Action\s*Item|AI)(?:\s*\d*)?:\s*(.+)$/gmi,
    priority: 'high',
    category: 'markdown'
  },
  {
    name: 'Incomplete Note',
    regex: /\[(?:TBD|TBA|WIP|INCOMPLETE)\]/gi,
    priority: 'medium',
    category: 'markdown'
  }
];

// Combined patterns for scanning all file types
export const ALL_PATTERNS: TodoPattern[] = [...CODE_PATTERNS, ...MARKDOWN_PATTERNS];

/**
 * Get patterns based on file extension
 */
export function getPatternsForFile(filePath: string): TodoPattern[] {
  const ext = filePath.split('.').pop()?.toLowerCase() || '';

  const markdownExtensions = ['md', 'mdx', 'markdown'];
  const codeExtensions = ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'cs', 'go', 'rs', 'rb', 'php', 'swift', 'kt', 'scala', 'r', 'sh', 'bash'];

  if (markdownExtensions.includes(ext)) {
    return [...MARKDOWN_PATTERNS, ...CODE_PATTERNS]; // Markdown can contain code blocks
  } else if (codeExtensions.includes(ext)) {
    return CODE_PATTERNS;
  }

  // Default to all patterns for unknown file types
  return ALL_PATTERNS;
}

/**
 * Check if a file should be scanned based on its extension
 */
export function shouldScanFile(filePath: string): boolean {
  const ext = filePath.split('.').pop()?.toLowerCase() || '';

  // List of extensions to scan
  const scannable = [
    'md', 'mdx', 'markdown', 'txt', 'rst',
    'js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs',
    'py', 'pyw', 'pyx',
    'java', 'kt', 'kts',
    'cpp', 'c', 'h', 'hpp', 'cc', 'cxx',
    'cs', 'vb',
    'go',
    'rs',
    'rb', 'erb',
    'php', 'phtml',
    'swift',
    'scala', 'sc',
    'r', 'rmd',
    'sh', 'bash', 'zsh', 'fish',
    'yaml', 'yml',
    'json', 'jsonc',
    'xml', 'html', 'htm',
    'sql',
    'dart',
    'lua',
    'perl', 'pl',
    'julia', 'jl',
    'vue', 'svelte'
  ];

  return scannable.includes(ext);
}