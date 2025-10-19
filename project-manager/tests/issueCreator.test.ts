/**
 * Tests for issue creator
 */

import { createIssuesFromTodos, createSingleIssue } from '../src/core/issueCreator';
import { TodoItem, StateFile, GithubConfig } from '../src/types';

// Mock the GitHub client
jest.mock('../src/utils/githubClient', () => {
  return {
    GitHubClient: jest.fn().mockImplementation(() => {
      return {
        ensureLabels: jest.fn().mockResolvedValue(undefined),
        issueExists: jest.fn().mockResolvedValue({ exists: false }),
        createIssue: jest.fn().mockResolvedValue({
          number: 1,
          html_url: 'https://github.com/test/repo/issues/1',
          title: 'Test issue',
          state: 'open'
        })
      };
    }),
    formatIssueTitle: jest.fn((content) => content),
    formatIssueBody: jest.fn(() => 'Test body')
  };
});

describe('IssueCreator', () => {
  const mockGithubConfig: GithubConfig = {
    owner: 'test-owner',
    repo: 'test-repo',
    token: 'test-token',
    defaultLabels: ['auto-created']
  };

  const createMockState = (): StateFile => ({
    lastUpdated: new Date().toISOString(),
    processedTodos: [],
    metadata: {
      totalProcessed: 0,
      totalIssuesCreated: 0
    }
  });

  describe('createIssuesFromTodos', () => {
    it('should create issues successfully in dry run mode', async () => {
      const todos: TodoItem[] = [
        {
          type: 'TODO',
          content: 'Test todo',
          file: 'test.ts',
          line: 10,
          priority: 'medium',
          category: 'code',
          rawText: '// TODO: Test todo'
        }
      ];

      const result = await createIssuesFromTodos(todos, createMockState(), {
        githubConfig: mockGithubConfig,
        dryRun: true
      });

      expect(result.success).toBe(true);
      expect(result.created.length).toBe(1);
      expect(result.failed.length).toBe(0);
      expect(result.skipped.length).toBe(0);
    });

    it('should handle multiple TODOs', async () => {
      const todos: TodoItem[] = [
        {
          type: 'TODO',
          content: 'Test todo 1',
          file: 'test.ts',
          line: 10,
          priority: 'medium',
          category: 'code',
          rawText: '// TODO: Test todo 1'
        },
        {
          type: 'FIXME',
          content: 'Test fixme',
          file: 'test.ts',
          line: 20,
          priority: 'high',
          category: 'code',
          rawText: '// FIXME: Test fixme'
        }
      ];

      const result = await createIssuesFromTodos(todos, createMockState(), {
        githubConfig: mockGithubConfig,
        dryRun: true
      });

      expect(result.totalProcessed).toBe(2);
      expect(result.created.length).toBe(2);
    });

    it('should update state with processed TODOs', async () => {
      const todos: TodoItem[] = [
        {
          type: 'TODO',
          content: 'Test todo',
          file: 'test.ts',
          line: 10,
          priority: 'medium',
          category: 'code',
          rawText: '// TODO: Test todo'
        }
      ];

      const state = createMockState();

      await createIssuesFromTodos(todos, state, {
        githubConfig: mockGithubConfig,
        dryRun: true
      });

      expect(state.processedTodos.length).toBe(1);
      expect(state.processedTodos[0].content).toBe('Test todo');
    });
  });

  describe('createSingleIssue', () => {
    it('should create a single issue successfully', async () => {
      const todo: TodoItem = {
        type: 'TODO',
        content: 'Test todo',
        file: 'test.ts',
        line: 10,
        priority: 'medium',
        category: 'code',
        rawText: '// TODO: Test todo'
      };

      // Note: This test will use mocked GitHubClient
      const result = await createSingleIssue(todo, mockGithubConfig);

      expect(result.success).toBe(true);
      expect(result.issueUrl).toBeDefined();
      expect(result.issueNumber).toBeDefined();
    });
  });
});
