/**
 * Tests for TODO pattern definitions
 */

import { CODE_PATTERNS, MARKDOWN_PATTERNS, getPatternsForFile, shouldScanFile } from '../src/core/patterns';

describe('Pattern Definitions', () => {
  describe('CODE_PATTERNS', () => {
    it('should match TODO comments', () => {
      const testCases = [
        '// TODO: Fix this bug',
        '# TODO: Implement feature',
        '/* TODO: Refactor this */  ',
        '* TODO: Add tests',
        '<!-- TODO: Update docs -->'
      ];

      const todoPattern = CODE_PATTERNS.find(p => p.name === 'TODO')!;

      testCases.forEach(testCase => {
        todoPattern.regex.lastIndex = 0; // Reset regex
        const match = todoPattern.regex.exec(testCase);
        expect(match).not.toBeNull();
      });
    });

    it('should match FIXME comments', () => {
      const testCase = '// FIXME: Critical bug here';
      const fixmePattern = CODE_PATTERNS.find(p => p.name === 'FIXME')!;

      fixmePattern.regex.lastIndex = 0;
      const match = fixmePattern.regex.exec(testCase);
      expect(match).not.toBeNull();
      expect(match![1].trim()).toBe('Critical bug here');
    });

    it('should have correct priority levels', () => {
      const priorities = {
        'TODO': 'medium',
        'FIXME': 'high',
        'HACK': 'low',
        'BUG': 'high',
        'OPTIMIZE': 'low',
        'NOTE': 'low'
      };

      Object.entries(priorities).forEach(([name, expectedPriority]) => {
        const pattern = CODE_PATTERNS.find(p => p.name === name);
        expect(pattern).toBeDefined();
        expect(pattern?.priority).toBe(expectedPriority);
      });
    });
  });

  describe('MARKDOWN_PATTERNS', () => {
    it('should match unchecked tasks', () => {
      const testCases = [
        '- [ ] Incomplete task',
        '  - [ ] Indented task',
        '- [ ] Task with multiple words'
      ];

      const taskPattern = MARKDOWN_PATTERNS.find(p => p.name === 'Unchecked Task')!;

      testCases.forEach(testCase => {
        taskPattern.regex.lastIndex = 0;
        const match = taskPattern.regex.exec(testCase);
        expect(match).not.toBeNull();
      });
    });

    it('should not match checked tasks', () => {
      const testCases = [
        '- [x] Completed task',
        '- [X] Another completed task'
      ];

      const taskPattern = MARKDOWN_PATTERNS.find(p => p.name === 'Unchecked Task')!;

      testCases.forEach(testCase => {
        taskPattern.regex.lastIndex = 0;
        const match = taskPattern.regex.exec(testCase);
        expect(match).toBeNull();
      });
    });
  });

  describe('getPatternsForFile', () => {
    it('should return markdown patterns for .md files', () => {
      const patterns = getPatternsForFile('README.md');
      const hasMarkdownPattern = patterns.some(p => p.category === 'markdown');
      expect(hasMarkdownPattern).toBe(true);
    });

    it('should return code patterns for .js files', () => {
      const patterns = getPatternsForFile('index.js');
      const hasCodePattern = patterns.some(p => p.category === 'code');
      const hasNoMarkdown = patterns.every(p => p.category !== 'markdown');
      expect(hasCodePattern).toBe(true);
      expect(hasNoMarkdown).toBe(true);
    });

    it('should return all patterns for unknown files', () => {
      const patterns = getPatternsForFile('unknown.xyz');
      expect(patterns.length).toBeGreaterThan(0);
    });
  });

  describe('shouldScanFile', () => {
    it('should scan common code files', () => {
      const scannable = [
        'index.js',
        'app.tsx',
        'main.py',
        'Main.java',
        'program.go',
        'lib.rs',
        'README.md'
      ];

      scannable.forEach(file => {
        expect(shouldScanFile(file)).toBe(true);
      });
    });

    it('should not scan binary files', () => {
      const nonScannable = [
        'image.jpg',
        'video.mp4',
        'archive.zip',
        'binary.exe',
        'data.pdf'
      ];

      nonScannable.forEach(file => {
        expect(shouldScanFile(file)).toBe(false);
      });
    });
  });
});