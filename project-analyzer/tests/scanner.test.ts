/**
 * Tests for the TODO scanner core functionality
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { scanTodos, processScanResults, generateTodoHash, findNewTodos } from '../src/core/scanner';

describe('Scanner', () => {
  let testDir: string;

  beforeEach(() => {
    // Create a temporary test directory
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scanner-test-'));
  });

  afterEach(() => {
    // Clean up test directory
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  describe('scanTodos', () => {
    it('should find TODOs in JavaScript files', async () => {
      const testFile = path.join(testDir, 'test.js');
      fs.writeFileSync(testFile, `
// TODO: Implement this function
function doSomething() {
  // FIXME: This is broken
  return null;
}
// NOTE: Consider refactoring
      `);

      const result = await scanTodos({ rootPath: testDir });

      expect(result.todos.length).toBe(3);
      expect(result.todos[0].type).toBe('TODO');
      expect(result.todos[1].type).toBe('FIXME');
      expect(result.todos[2].type).toBe('NOTE');
    });

    it('should find TODOs in Markdown files', async () => {
      const testFile = path.join(testDir, 'README.md');
      fs.writeFileSync(testFile, `
# Project

## Tasks
- [ ] Implement feature A
- [ ] Fix bug B
- [x] Completed task (should be ignored)
      `);

      const result = await scanTodos({ rootPath: testDir });

      expect(result.todos.length).toBe(2);
      expect(result.todos[0].content).toContain('Implement feature A');
      expect(result.todos[1].content).toContain('Fix bug B');
    });

    it('should respect gitignore patterns', async () => {
      // Create .gitignore
      fs.writeFileSync(path.join(testDir, '.gitignore'), 'ignored.js\n');

      // Create ignored file with TODOs
      fs.writeFileSync(path.join(testDir, 'ignored.js'), '// TODO: Should be ignored');

      // Create normal file with TODOs
      fs.writeFileSync(path.join(testDir, 'normal.js'), '// TODO: Should be found');

      const result = await scanTodos({ rootPath: testDir, useGitignore: true });

      expect(result.todos.length).toBe(1);
      expect(result.todos[0].content).toContain('Should be found');
    });

    it('should calculate correct line numbers', async () => {
      const testFile = path.join(testDir, 'test.py');
      fs.writeFileSync(testFile, `
def function1():
    pass

# TODO: Add error handling
def function2():
    # FIXME: Race condition here
    return None
      `);

      const result = await scanTodos({ rootPath: testDir });

      const todo = result.todos.find(t => t.type === 'TODO');
      const fixme = result.todos.find(t => t.type === 'FIXME');

      expect(todo?.line).toBe(5);
      expect(fixme?.line).toBe(7);
    });

    it('should group by priority correctly', async () => {
      const testFile = path.join(testDir, 'test.js');
      fs.writeFileSync(testFile, `
// TODO: Medium priority
// FIXME: High priority
// NOTE: Low priority
// BUG: High priority
// HACK: Low priority
      `);

      const result = await scanTodos({ rootPath: testDir });

      expect(result.summary.byPriority.high).toBe(2);
      expect(result.summary.byPriority.medium).toBe(1);
      expect(result.summary.byPriority.low).toBe(2);
    });
  });

  describe('processScanResults', () => {
    it('should add IDs and hashes to todos', async () => {
      const testFile = path.join(testDir, 'test.js');
      fs.writeFileSync(testFile, '// TODO: Test todo');

      const result = await scanTodos({ rootPath: testDir });
      const processed = processScanResults(result);

      expect(processed.todos[0]).toHaveProperty('id');
      expect(processed.todos[0]).toHaveProperty('hash');
      expect(processed.todos[0].id).toMatch(/^todo-\d+-\d+$/);
      expect(processed.todos[0].hash).toHaveLength(32); // MD5 hash length
    });
  });

  describe('findNewTodos', () => {
    it('should identify new todos', () => {
      const todos = [
        {
          type: 'TODO',
          content: 'New todo',
          file: 'test.js',
          line: 1,
          priority: 'medium' as const,
          category: 'code',
          rawText: '// TODO: New todo',
          id: 'todo-1',
          hash: 'hash1'
        },
        {
          type: 'TODO',
          content: 'Existing todo',
          file: 'test.js',
          line: 2,
          priority: 'medium' as const,
          category: 'code',
          rawText: '// TODO: Existing todo',
          id: 'todo-2',
          hash: 'hash2'
        }
      ];

      const previousHashes = new Set(['hash2']); // Only hash2 exists
      const newTodos = findNewTodos(todos, previousHashes);

      expect(newTodos.length).toBe(1);
      expect(newTodos[0].content).toBe('New todo');
    });
  });

  describe('Summary Statistics', () => {
    it('should calculate correct summary', async () => {
      const testFile = path.join(testDir, 'test.js');
      fs.writeFileSync(testFile, `
// TODO: Task 1
// TODO: Task 2
// FIXME: Bug 1
      `);

      const result = await scanTodos({ rootPath: testDir });

      expect(result.summary.totalTodos).toBe(3);
      expect(result.summary.byType['TODO']).toBe(2);
      expect(result.summary.byType['FIXME']).toBe(1);
      expect(result.summary.filesScanned).toBe(1);
      expect(result.summary.scanDuration).toBeGreaterThan(0);
    });
  });
});