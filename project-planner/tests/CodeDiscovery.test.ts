/**
 * Tests for CodeDiscovery
 * PM-54: Code-Based Feature Discovery
 */

import { CodeDiscovery } from '../src/core/CodeDiscovery';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('CodeDiscovery', () => {
  let tempDir: string;
  let discovery: CodeDiscovery;

  beforeEach(async () => {
    // Create temporary test directory
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'code-discovery-test-'));
  });

  afterEach(async () => {
    // Clean up temporary directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  describe('initialization', () => {
    it('should create instance with default options', () => {
      discovery = new CodeDiscovery({
        rootDir: tempDir
      });

      expect(discovery).toBeInstanceOf(CodeDiscovery);
    });

    it('should accept custom include patterns', () => {
      discovery = new CodeDiscovery({
        rootDir: tempDir,
        includePatterns: ['**/*.tsx']
      });

      expect(discovery).toBeInstanceOf(CodeDiscovery);
    });

    it('should accept custom exclude patterns', () => {
      discovery = new CodeDiscovery({
        rootDir: tempDir,
        excludePatterns: ['**/test/**', '**/tests/**']
      });

      expect(discovery).toBeInstanceOf(CodeDiscovery);
    });
  });

  describe('discover', () => {
    it('should discover features from React routes', async () => {
      // Create test file with React routes
      const testFile = path.join(tempDir, 'routes.tsx');
      await fs.writeFile(testFile, `
        import React from 'react';
        import { Route } from 'react-router-dom';

        // User dashboard
        <Route path="/dashboard" component={Dashboard} />

        // User profile page
        <Route path="/profile/:id" component={UserProfile} />
      `);

      discovery = new CodeDiscovery({ rootDir: tempDir });
      const result = await discovery.discover();

      expect(result.features).toBeDefined();
      expect(result.features.length).toBeGreaterThanOrEqual(2);
      expect(result.filesScanned).toBe(1);

      const dashboardFeature = result.features.find(f => f.path === '/dashboard');
      expect(dashboardFeature).toBeDefined();
      expect(dashboardFeature?.type).toBe('route');
      expect(dashboardFeature?.description).toContain('User dashboard');

      const profileFeature = result.features.find(f => f.path === '/profile/:id');
      expect(profileFeature).toBeDefined();
      expect(profileFeature?.name).toContain('Profile');
    });

    it('should discover features from Express endpoints', async () => {
      const testFile = path.join(tempDir, 'api.ts');
      await fs.writeFile(testFile, `
        import express from 'express';
        const app = express();

        // Get all users
        app.get('/api/users', (req, res) => {
          // handler
        });

        // Create new user
        app.post('/api/users', (req, res) => {
          // handler
        });

        router.delete('/api/users/:id', (req, res) => {
          // handler
        });
      `);

      discovery = new CodeDiscovery({ rootDir: tempDir });
      const result = await discovery.discover();

      expect(result.features.length).toBeGreaterThanOrEqual(3);

      const getEndpoint = result.features.find(f => f.path === '/api/users' && f.method === 'GET');
      expect(getEndpoint).toBeDefined();
      expect(getEndpoint?.type).toBe('endpoint');
      expect(getEndpoint?.description).toContain('Get all users');

      const postEndpoint = result.features.find(f => f.path === '/api/users' && f.method === 'POST');
      expect(postEndpoint).toBeDefined();
      expect(postEndpoint?.method).toBe('POST');

      const deleteEndpoint = result.features.find(f => f.method === 'DELETE');
      expect(deleteEndpoint).toBeDefined();
    });

    it('should discover React components', async () => {
      const testFile = path.join(tempDir, 'components.tsx');
      await fs.writeFile(testFile, `
        import React from 'react';

        // User authentication form
        export default function LoginForm() {
          return <form />;
        }

        // Dashboard header component
        export const DashboardHeader = () => {
          return <header />;
        };

        // Generic app wrapper (should be skipped)
        export function App() {
          return <div />;
        }
      `);

      discovery = new CodeDiscovery({ rootDir: tempDir });
      const result = await discovery.discover();

      expect(result.features.length).toBeGreaterThanOrEqual(2);

      const loginForm = result.features.find(f => f.name === 'LoginForm');
      expect(loginForm).toBeDefined();
      expect(loginForm?.type).toBe('component');
      expect(loginForm?.description).toContain('User authentication form');

      const dashboardHeader = result.features.find(f => f.name === 'DashboardHeader');
      expect(dashboardHeader).toBeDefined();

      // Generic names should be filtered
      const app = result.features.find(f => f.name === 'App');
      expect(app).toBeUndefined();
    });

    it('should discover features from package.json', async () => {
      const testFile = path.join(tempDir, 'package.json');
      await fs.writeFile(testFile, JSON.stringify({
        name: 'test-app',
        scripts: {
          dev: 'vite',
          build: 'tsc && vite build',
          test: 'jest'
        },
        dependencies: {
          express: '^4.18.0',
          'react-router': '^6.0.0',
          stripe: '^12.0.0',
          mongoose: '^7.0.0'
        },
        devDependencies: {
          jest: '^29.0.0',
          typescript: '^5.0.0'
        }
      }, null, 2));

      discovery = new CodeDiscovery({ rootDir: tempDir });
      const result = await discovery.discover();

      expect(result.features.length).toBeGreaterThanOrEqual(9); // 3 scripts + 6 dependencies

      // Check for scripts
      const buildScript = result.features.find(f => f.name === 'Script: build');
      expect(buildScript).toBeDefined();
      expect(buildScript?.type).toBe('config');

      // Check for detected features from dependencies
      const restAPI = result.features.find(f => f.name === 'REST API');
      expect(restAPI).toBeDefined();
      expect(restAPI?.description).toContain('express');

      const payment = result.features.find(f => f.name === 'Payment Processing');
      expect(payment).toBeDefined();
      expect(payment?.description).toContain('stripe');

      const database = result.features.find(f => f.name === 'MongoDB Database');
      expect(database).toBeDefined();

      const testing = result.features.find(f => f.name === 'Testing');
      expect(testing).toBeDefined();
    });

    it('should respect exclude patterns', async () => {
      // Create files in excluded directory
      await fs.mkdir(path.join(tempDir, 'node_modules'), { recursive: true });
      await fs.writeFile(path.join(tempDir, 'node_modules', 'test.js'), `
        app.get('/excluded', () => {});
      `);

      // Create included file
      await fs.writeFile(path.join(tempDir, 'included.ts'), `
        app.get('/included', () => {});
      `);

      discovery = new CodeDiscovery({ rootDir: tempDir });
      const result = await discovery.discover();

      // Should only scan included file
      expect(result.filesScanned).toBe(1);

      const excludedFeature = result.features.find(f => f.path === '/excluded');
      expect(excludedFeature).toBeUndefined();

      const includedFeature = result.features.find(f => f.path === '/included');
      expect(includedFeature).toBeDefined();
    });

    it('should handle nested directories', async () => {
      await fs.mkdir(path.join(tempDir, 'src', 'components'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'src', 'api'), { recursive: true });

      await fs.writeFile(path.join(tempDir, 'src', 'components', 'Button.tsx'), `
        export default function Button() { return <button />; }
      `);

      await fs.writeFile(path.join(tempDir, 'src', 'api', 'routes.ts'), `
        app.get('/api/test', () => {});
      `);

      discovery = new CodeDiscovery({ rootDir: tempDir });
      const result = await discovery.discover();

      expect(result.filesScanned).toBe(2);
      expect(result.features.length).toBeGreaterThanOrEqual(2);
    });

    it('should include metadata in result', async () => {
      await fs.writeFile(path.join(tempDir, 'test.ts'), `
        app.get('/test', () => {});
      `);

      discovery = new CodeDiscovery({
        rootDir: tempDir,
        frameworks: ['express', 'react']
      });

      const result = await discovery.discover();

      expect(result.metadata).toBeDefined();
      expect(result.metadata.rootDir).toBe(tempDir);
      expect(result.metadata.frameworks).toEqual(['express', 'react']);
      expect(result.metadata.scanTime).toBeGreaterThan(0);
      expect(result.metadata.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('path conversion', () => {
    beforeEach(() => {
      discovery = new CodeDiscovery({ rootDir: tempDir });
    });

    it('should convert URL paths to feature names', async () => {
      await fs.writeFile(path.join(tempDir, 'routes.tsx'), `
        <Route path="/user-profile" component={Profile} />
        <Route path="/api/users/:id" component={User} />
        <Route path="/" component={Home} />
        <Route path="/dashboard_view" component={Dashboard} />
      `);

      const result = await discovery.discover();

      const userProfile = result.features.find(f => f.path === '/user-profile');
      expect(userProfile?.name).toBe('User Profile');

      const apiUsers = result.features.find(f => f.path === '/api/users/:id');
      expect(apiUsers?.name).toContain('Users');
      expect(apiUsers?.name).toContain('Item');

      const home = result.features.find(f => f.path === '/');
      expect(home?.name).toBe('Home');

      const dashboard = result.features.find(f => f.path === '/dashboard_view');
      expect(dashboard?.name).toContain('Dashboard');
    });
  });

  describe('comment extraction', () => {
    it('should extract single-line comments', async () => {
      await fs.writeFile(path.join(tempDir, 'routes.tsx'), `
        // User authentication endpoint
        app.post('/auth/login', () => {});

        // Get user profile data
        app.get('/user/profile', () => {});
      `);

      discovery = new CodeDiscovery({ rootDir: tempDir });
      const result = await discovery.discover();

      const login = result.features.find(f => f.path === '/auth/login');
      expect(login?.description).toBe('User authentication endpoint');

      const profile = result.features.find(f => f.path === '/user/profile');
      expect(profile?.description).toBe('Get user profile data');
    });

    it('should extract multi-line comments', async () => {
      await fs.writeFile(path.join(tempDir, 'routes.tsx'), `
        /**
         * Complex user registration endpoint
         * with validation and email verification
         */
        app.post('/auth/register', () => {});
      `);

      discovery = new CodeDiscovery({ rootDir: tempDir });
      const result = await discovery.discover();

      const register = result.features.find(f => f.path === '/auth/register');
      expect(register?.description).toBeDefined();
      expect(register?.description).toContain('Complex user registration');
      expect(register?.description).toContain('validation');
    });
  });

  describe('getSummary', () => {
    it('should calculate summary statistics', async () => {
      await fs.writeFile(path.join(tempDir, 'mixed.tsx'), `
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/profile" component={Profile} />
        app.get('/api/users', () => {});
        app.post('/api/posts', () => {});
        export default function LoginForm() { return <form />; }
        export const SignupForm = () => <form />;
      `);

      await fs.writeFile(path.join(tempDir, 'package.json'), JSON.stringify({
        scripts: { dev: 'vite', build: 'tsc' }
      }));

      discovery = new CodeDiscovery({ rootDir: tempDir });
      const result = await discovery.discover();
      const summary = discovery.getSummary(result);

      expect(summary.total).toBeGreaterThan(0);
      expect(summary.routes).toBeGreaterThanOrEqual(2);
      expect(summary.endpoints).toBeGreaterThanOrEqual(2);
      expect(summary.components).toBeGreaterThanOrEqual(2);
      expect(summary.config).toBeGreaterThanOrEqual(2);
    });
  });

  describe('confidence scoring', () => {
    it('should assign appropriate confidence scores', async () => {
      await fs.writeFile(path.join(tempDir, 'features.tsx'), `
        <Route path="/dashboard" component={Dashboard} />
        path: "/settings"
        app.get('/api/data', () => {});
        export const MyComponent = () => <div />;
      `);

      await fs.writeFile(path.join(tempDir, 'package.json'), JSON.stringify({
        scripts: { test: 'jest' }
      }));

      discovery = new CodeDiscovery({ rootDir: tempDir });
      const result = await discovery.discover();

      // Express endpoints should have highest confidence
      const endpoint = result.features.find(f => f.type === 'endpoint');
      expect(endpoint?.confidence).toBeGreaterThanOrEqual(90);

      // React Router routes should have high confidence
      const route = result.features.find(f => f.type === 'route' && f.path === '/dashboard');
      expect(route?.confidence).toBeGreaterThanOrEqual(85);

      // Config features should have 100% confidence
      const config = result.features.find(f => f.type === 'config');
      expect(config?.confidence).toBe(100);

      // Components should have lower confidence
      const component = result.features.find(f => f.type === 'component');
      expect(component?.confidence).toBeLessThan(90);
    });
  });

  describe('error handling', () => {
    it('should handle non-existent directory gracefully', async () => {
      discovery = new CodeDiscovery({
        rootDir: '/nonexistent/directory'
      });

      const result = await discovery.discover();

      expect(result.filesScanned).toBe(0);
      expect(result.features).toEqual([]);
    });

    it('should handle invalid JSON files gracefully', async () => {
      await fs.writeFile(path.join(tempDir, 'broken.json'), 'invalid json {');

      discovery = new CodeDiscovery({ rootDir: tempDir });
      const result = await discovery.discover();

      // Should not crash, just skip the invalid JSON
      expect(result).toBeDefined();
    });

    it('should handle permission errors gracefully', async () => {
      const restrictedDir = path.join(tempDir, 'restricted');
      await fs.mkdir(restrictedDir);
      await fs.writeFile(path.join(restrictedDir, 'test.ts'), 'app.get("/test", () => {});');

      // Make directory unreadable (may not work on all systems)
      try {
        await fs.chmod(restrictedDir, 0o000);
      } catch {
        // Skip test if chmod doesn't work
        return;
      }

      discovery = new CodeDiscovery({ rootDir: tempDir });
      const result = await discovery.discover();

      // Should complete without crashing
      expect(result).toBeDefined();

      // Restore permissions for cleanup
      await fs.chmod(restrictedDir, 0o755);
    });
  });

  describe('React Router config patterns', () => {
    it('should detect path: config-style routes', async () => {
      await fs.writeFile(path.join(tempDir, 'config.tsx'), `
        const routes = [
          { path: "/home", component: Home },
          { path: "/about", component: About },
          { path: "/contact", component: Contact }
        ];
      `);

      discovery = new CodeDiscovery({ rootDir: tempDir });
      const result = await discovery.discover();

      expect(result.features.length).toBeGreaterThanOrEqual(3);

      const homeRoute = result.features.find(f => f.path === '/home');
      expect(homeRoute).toBeDefined();
      expect(homeRoute?.type).toBe('route');
      expect(homeRoute?.confidence).toBe(80); // Config-style has lower confidence than JSX
    });
  });

  describe('file type filtering', () => {
    it('should only scan TypeScript and JavaScript files', async () => {
      await fs.writeFile(path.join(tempDir, 'styles.css'), '.button { color: blue; }');
      await fs.writeFile(path.join(tempDir, 'README.md'), '# Project');
      await fs.writeFile(path.join(tempDir, 'code.ts'), 'app.get("/test", () => {});');

      discovery = new CodeDiscovery({ rootDir: tempDir });
      const result = await discovery.discover();

      // Should only scan .ts file (and package.json if present)
      expect(result.filesScanned).toBe(1);
    });

    it('should respect custom include patterns', async () => {
      await fs.writeFile(path.join(tempDir, 'file.ts'), 'app.get("/ts", () => {});');
      await fs.writeFile(path.join(tempDir, 'file.tsx'), '<Route path="/tsx" />');
      await fs.writeFile(path.join(tempDir, 'file.js'), 'app.get("/js", () => {});');

      discovery = new CodeDiscovery({
        rootDir: tempDir,
        includePatterns: ['**/*.tsx'] // Only .tsx files
      });

      const result = await discovery.discover();

      expect(result.filesScanned).toBe(1);
      const tsxFeature = result.features.find(f => f.path === '/tsx');
      expect(tsxFeature).toBeDefined();

      const tsFeature = result.features.find(f => f.path === '/ts');
      expect(tsFeature).toBeUndefined();
    });
  });
});
