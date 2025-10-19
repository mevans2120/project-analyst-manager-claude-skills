/**
 * Tests for label manager
 */

import {
  determineLabels,
  getIssueType,
  getTypeEmoji,
  validateLabel,
  sanitizeLabel,
  getAllLabels,
  DEFAULT_LABEL_MAPPING,
  PRIORITY_LABELS
} from '../src/utils/labelManager';
import { TodoItem } from '../src/types';

describe('LabelManager', () => {
  describe('determineLabels', () => {
    it('should determine labels for TODO type', () => {
      const todo: TodoItem = {
        type: 'TODO',
        content: 'Test todo',
        file: 'test.ts',
        line: 10,
        priority: 'medium',
        category: 'code',
        rawText: '// TODO: Test todo'
      };

      const result = determineLabels(todo);

      expect(result.labels).toContain('feature');
      expect(result.labels).toContain('priority-medium');
      expect(result.labels).toContain('auto-created');
      expect(result.labels).toContain('from-todo');
      expect(result.labels).toContain('from-code');
      expect(result.priority).toBe('medium');
    });

    it('should determine labels for FIXME type', () => {
      const todo: TodoItem = {
        type: 'FIXME',
        content: 'Fix this bug',
        file: 'test.ts',
        line: 10,
        priority: 'high',
        category: 'code',
        rawText: '// FIXME: Fix this bug'
      };

      const result = determineLabels(todo);

      expect(result.labels).toContain('bug');
      expect(result.labels).toContain('priority-high');
      expect(result.priority).toBe('high');
    });

    it('should apply custom label mapping', () => {
      const todo: TodoItem = {
        type: 'TODO',
        content: 'Test todo',
        file: 'test.ts',
        line: 10,
        priority: 'medium',
        category: 'code',
        rawText: '// TODO: Test todo'
      };

      const customMapping = {
        'TODO': ['custom-label', 'another-label']
      };

      const result = determineLabels(todo, customMapping);

      expect(result.labels).toContain('custom-label');
      expect(result.labels).toContain('another-label');
    });

    it('should add from-markdown label for markdown TODOs', () => {
      const todo: TodoItem = {
        type: 'Unchecked Task',
        content: 'Task to do',
        file: 'README.md',
        line: 10,
        priority: 'medium',
        category: 'markdown',
        rawText: '- [ ] Task to do'
      };

      const result = determineLabels(todo);

      expect(result.labels).toContain('from-markdown');
    });

    it('should apply custom default labels', () => {
      const todo: TodoItem = {
        type: 'TODO',
        content: 'Test todo',
        file: 'test.ts',
        line: 10,
        priority: 'medium',
        category: 'code',
        rawText: '// TODO: Test todo'
      };

      const result = determineLabels(todo, undefined, ['custom-default', 'another-default']);

      expect(result.labels).toContain('custom-default');
      expect(result.labels).toContain('another-default');
    });
  });

  describe('getIssueType', () => {
    it('should identify bug type', () => {
      const labels = ['bug', 'priority-high'];
      expect(getIssueType(labels)).toBe('bug');
    });

    it('should identify feature type', () => {
      const labels = ['feature', 'priority-medium'];
      expect(getIssueType(labels)).toBe('feature');
    });

    it('should default to task for unknown labels', () => {
      const labels = ['unknown-label'];
      expect(getIssueType(labels)).toBe('task');
    });
  });

  describe('getTypeEmoji', () => {
    it('should return correct emoji for bug', () => {
      expect(getTypeEmoji('bug')).toBe('🐛');
    });

    it('should return correct emoji for feature', () => {
      expect(getTypeEmoji('feature')).toBe('✨');
    });

    it('should return default emoji for unknown type', () => {
      expect(getTypeEmoji('unknown')).toBe('📌');
    });
  });

  describe('validateLabel', () => {
    it('should validate valid label', () => {
      expect(validateLabel('valid-label')).toBe(true);
    });

    it('should reject empty label', () => {
      expect(validateLabel('')).toBe(false);
    });

    it('should reject label that is too long', () => {
      const longLabel = 'a'.repeat(51);
      expect(validateLabel(longLabel)).toBe(false);
    });

    it('should reject whitespace-only label', () => {
      expect(validateLabel('   ')).toBe(false);
    });
  });

  describe('sanitizeLabel', () => {
    it('should sanitize label with spaces', () => {
      expect(sanitizeLabel('my label')).toBe('my-label');
    });

    it('should convert to lowercase', () => {
      expect(sanitizeLabel('MyLabel')).toBe('mylabel');
    });

    it('should remove invalid characters', () => {
      expect(sanitizeLabel('my@label!')).toBe('mylabel');
    });

    it('should truncate long labels', () => {
      const longLabel = 'a'.repeat(60);
      const sanitized = sanitizeLabel(longLabel);
      expect(sanitized.length).toBe(50);
    });

    it('should trim whitespace', () => {
      expect(sanitizeLabel('  my-label  ')).toBe('my-label');
    });
  });

  describe('getAllLabels', () => {
    it('should collect all unique labels from TODOs', () => {
      const todos: TodoItem[] = [
        {
          type: 'TODO',
          content: 'Test 1',
          file: 'test.ts',
          line: 10,
          priority: 'medium',
          category: 'code',
          rawText: ''
        },
        {
          type: 'FIXME',
          content: 'Test 2',
          file: 'test.ts',
          line: 20,
          priority: 'high',
          category: 'code',
          rawText: ''
        }
      ];

      const labels = getAllLabels(todos);

      expect(labels).toContain('feature');
      expect(labels).toContain('bug');
      expect(labels).toContain('priority-medium');
      expect(labels).toContain('priority-high');
      expect(labels).toContain('auto-created');
      expect(labels).toContain('from-todo');
      expect(labels).toContain('from-code');
    });

    it('should not duplicate labels', () => {
      const todos: TodoItem[] = [
        {
          type: 'TODO',
          content: 'Test 1',
          file: 'test.ts',
          line: 10,
          priority: 'medium',
          category: 'code',
          rawText: ''
        },
        {
          type: 'TODO',
          content: 'Test 2',
          file: 'test.ts',
          line: 20,
          priority: 'medium',
          category: 'code',
          rawText: ''
        }
      ];

      const labels = getAllLabels(todos);

      const uniqueLabels = new Set(labels);
      expect(labels.length).toBe(uniqueLabels.size);
    });
  });
});
