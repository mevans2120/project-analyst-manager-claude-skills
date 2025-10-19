/**
 * Tests for state tracker
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  generateTodoHash,
  loadState,
  saveState,
  isProcessed,
  addProcessedTodo,
  filterNewTodos,
  getStateStats,
  cleanupOldEntries
} from '../src/core/stateTracker';
import { TodoItem, StateFile } from '../src/types';

describe('StateTracker', () => {
  const testStateDir = path.join(__dirname, 'test-state');
  const testStatePath = path.join(testStateDir, 'test-state.json');

  beforeEach(() => {
    // Clean up test directory
    if (fs.existsSync(testStateDir)) {
      fs.rmSync(testStateDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(testStateDir)) {
      fs.rmSync(testStateDir, { recursive: true });
    }
  });

  describe('generateTodoHash', () => {
    it('should generate consistent hash for same TODO', () => {
      const todo: TodoItem = {
        type: 'TODO',
        content: 'Test todo',
        file: 'test.ts',
        line: 10,
        priority: 'medium',
        category: 'code',
        rawText: '// TODO: Test todo'
      };

      const hash1 = generateTodoHash(todo);
      const hash2 = generateTodoHash(todo);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA256 produces 64 hex characters
    });

    it('should generate different hashes for different TODOs', () => {
      const todo1: TodoItem = {
        type: 'TODO',
        content: 'Test todo 1',
        file: 'test.ts',
        line: 10,
        priority: 'medium',
        category: 'code',
        rawText: '// TODO: Test todo 1'
      };

      const todo2: TodoItem = {
        type: 'TODO',
        content: 'Test todo 2',
        file: 'test.ts',
        line: 10,
        priority: 'medium',
        category: 'code',
        rawText: '// TODO: Test todo 2'
      };

      const hash1 = generateTodoHash(todo1);
      const hash2 = generateTodoHash(todo2);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('loadState', () => {
    it('should return default state when file does not exist', () => {
      const state = loadState(testStatePath);

      expect(state.processedTodos).toEqual([]);
      expect(state.metadata.totalProcessed).toBe(0);
      expect(state.metadata.totalIssuesCreated).toBe(0);
    });

    it('should load existing state from file', () => {
      const mockState: StateFile = {
        lastUpdated: new Date().toISOString(),
        processedTodos: [
          {
            hash: 'test-hash',
            content: 'Test todo',
            file: 'test.ts',
            line: 10,
            type: 'TODO',
            priority: 'medium',
            processedAt: new Date().toISOString(),
            status: 'created'
          }
        ],
        metadata: {
          totalProcessed: 1,
          totalIssuesCreated: 1
        }
      };

      fs.mkdirSync(testStateDir, { recursive: true });
      fs.writeFileSync(testStatePath, JSON.stringify(mockState));

      const state = loadState(testStatePath);

      expect(state.processedTodos).toHaveLength(1);
      expect(state.metadata.totalProcessed).toBe(1);
    });
  });

  describe('saveState', () => {
    it('should save state to file', () => {
      const state: StateFile = {
        lastUpdated: new Date().toISOString(),
        processedTodos: [],
        metadata: {
          totalProcessed: 0,
          totalIssuesCreated: 0
        }
      };

      saveState(testStatePath, state);

      expect(fs.existsSync(testStatePath)).toBe(true);

      const loaded = JSON.parse(fs.readFileSync(testStatePath, 'utf-8'));
      expect(loaded.processedTodos).toEqual([]);
    });

    it('should create directory if it does not exist', () => {
      const state: StateFile = {
        lastUpdated: new Date().toISOString(),
        processedTodos: [],
        metadata: {
          totalProcessed: 0,
          totalIssuesCreated: 0
        }
      };

      saveState(testStatePath, state);

      expect(fs.existsSync(testStateDir)).toBe(true);
      expect(fs.existsSync(testStatePath)).toBe(true);
    });
  });

  describe('isProcessed', () => {
    it('should return true for processed TODO', () => {
      const state: StateFile = {
        lastUpdated: new Date().toISOString(),
        processedTodos: [
          {
            hash: 'test-hash',
            content: 'Test todo',
            file: 'test.ts',
            line: 10,
            type: 'TODO',
            priority: 'medium',
            processedAt: new Date().toISOString(),
            status: 'created'
          }
        ],
        metadata: {
          totalProcessed: 1,
          totalIssuesCreated: 1
        }
      };

      expect(isProcessed(state, 'test-hash')).toBe(true);
    });

    it('should return false for unprocessed TODO', () => {
      const state: StateFile = {
        lastUpdated: new Date().toISOString(),
        processedTodos: [],
        metadata: {
          totalProcessed: 0,
          totalIssuesCreated: 0
        }
      };

      expect(isProcessed(state, 'test-hash')).toBe(false);
    });
  });

  describe('addProcessedTodo', () => {
    it('should add processed TODO to state', () => {
      const state: StateFile = {
        lastUpdated: new Date().toISOString(),
        processedTodos: [],
        metadata: {
          totalProcessed: 0,
          totalIssuesCreated: 0
        }
      };

      const todo: TodoItem = {
        type: 'TODO',
        content: 'Test todo',
        file: 'test.ts',
        line: 10,
        priority: 'medium',
        category: 'code',
        rawText: '// TODO: Test todo'
      };

      addProcessedTodo(state, todo, 'https://github.com/test/issue/1', 1, 'created');

      expect(state.processedTodos).toHaveLength(1);
      expect(state.processedTodos[0].content).toBe('Test todo');
      expect(state.metadata.totalProcessed).toBe(1);
      expect(state.metadata.totalIssuesCreated).toBe(1);
    });

    it('should update metadata correctly for failed status', () => {
      const state: StateFile = {
        lastUpdated: new Date().toISOString(),
        processedTodos: [],
        metadata: {
          totalProcessed: 0,
          totalIssuesCreated: 0
        }
      };

      const todo: TodoItem = {
        type: 'TODO',
        content: 'Test todo',
        file: 'test.ts',
        line: 10,
        priority: 'medium',
        category: 'code',
        rawText: '// TODO: Test todo'
      };

      addProcessedTodo(state, todo, undefined, undefined, 'failed', 'Test error');

      expect(state.processedTodos).toHaveLength(1);
      expect(state.processedTodos[0].status).toBe('failed');
      expect(state.metadata.totalIssuesCreated).toBe(0);
    });
  });

  describe('filterNewTodos', () => {
    it('should filter out processed TODOs', () => {
      const state: StateFile = {
        lastUpdated: new Date().toISOString(),
        processedTodos: [
          {
            hash: generateTodoHash({
              type: 'TODO',
              content: 'Processed todo',
              file: 'test.ts',
              line: 10,
              priority: 'medium',
              category: 'code',
              rawText: ''
            }),
            content: 'Processed todo',
            file: 'test.ts',
            line: 10,
            type: 'TODO',
            priority: 'medium',
            processedAt: new Date().toISOString(),
            status: 'created'
          }
        ],
        metadata: {
          totalProcessed: 1,
          totalIssuesCreated: 1
        }
      };

      const todos: TodoItem[] = [
        {
          type: 'TODO',
          content: 'Processed todo',
          file: 'test.ts',
          line: 10,
          priority: 'medium',
          category: 'code',
          rawText: ''
        },
        {
          type: 'TODO',
          content: 'New todo',
          file: 'test.ts',
          line: 20,
          priority: 'medium',
          category: 'code',
          rawText: ''
        }
      ];

      const newTodos = filterNewTodos(state, todos);

      expect(newTodos).toHaveLength(1);
      expect(newTodos[0].content).toBe('New todo');
    });
  });

  describe('getStateStats', () => {
    it('should calculate statistics correctly', () => {
      const state: StateFile = {
        lastUpdated: new Date().toISOString(),
        processedTodos: [
          {
            hash: 'hash1',
            content: 'Todo 1',
            file: 'test.ts',
            line: 10,
            type: 'TODO',
            priority: 'high',
            processedAt: new Date().toISOString(),
            status: 'created'
          },
          {
            hash: 'hash2',
            content: 'Todo 2',
            file: 'test.ts',
            line: 20,
            type: 'FIXME',
            priority: 'medium',
            processedAt: new Date().toISOString(),
            status: 'failed'
          }
        ],
        metadata: {
          totalProcessed: 2,
          totalIssuesCreated: 1
        }
      };

      const stats = getStateStats(state, 7);

      expect(stats.totalProcessed).toBe(2);
      expect(stats.totalCreated).toBe(1);
      expect(stats.totalFailed).toBe(1);
      expect(stats.byPriority.high).toBe(1);
      expect(stats.byPriority.medium).toBe(1);
      expect(stats.byType.TODO).toBe(1);
      expect(stats.byType.FIXME).toBe(1);
    });
  });

  describe('cleanupOldEntries', () => {
    it('should remove old entries without issue URLs', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 100);

      const state: StateFile = {
        lastUpdated: new Date().toISOString(),
        processedTodos: [
          {
            hash: 'hash1',
            content: 'Old todo',
            file: 'test.ts',
            line: 10,
            type: 'TODO',
            priority: 'medium',
            processedAt: oldDate.toISOString(),
            status: 'failed'
          },
          {
            hash: 'hash2',
            content: 'Recent todo',
            file: 'test.ts',
            line: 20,
            type: 'TODO',
            priority: 'medium',
            processedAt: new Date().toISOString(),
            status: 'created'
          }
        ],
        metadata: {
          totalProcessed: 2,
          totalIssuesCreated: 1
        }
      };

      const cleaned = cleanupOldEntries(state, 60);

      expect(cleaned.processedTodos).toHaveLength(1);
      expect(cleaned.processedTodos[0].content).toBe('Recent todo');
    });

    it('should keep old entries with issue URLs', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 100);

      const state: StateFile = {
        lastUpdated: new Date().toISOString(),
        processedTodos: [
          {
            hash: 'hash1',
            content: 'Old todo with issue',
            file: 'test.ts',
            line: 10,
            type: 'TODO',
            priority: 'medium',
            processedAt: oldDate.toISOString(),
            status: 'created',
            issueUrl: 'https://github.com/test/issue/1'
          }
        ],
        metadata: {
          totalProcessed: 1,
          totalIssuesCreated: 1
        }
      };

      const cleaned = cleanupOldEntries(state, 60);

      expect(cleaned.processedTodos).toHaveLength(1);
      expect(cleaned.processedTodos[0].content).toBe('Old todo with issue');
    });
  });
});
