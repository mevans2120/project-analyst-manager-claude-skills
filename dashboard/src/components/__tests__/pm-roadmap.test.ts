/**
 * Tests for pm-roadmap component lifecycle and navigation
 */

import { fixture, expect, html, waitUntil } from '@open-wc/testing';
import { PMRoadmap } from '../pm-roadmap';
import '../pm-roadmap';

describe('pm-roadmap', () => {
  describe('Component Lifecycle', () => {
    it('should load data on initial mount', async () => {
      // Mock fetch for data.js
      const mockData = {
        project: { name: 'Test Project', status: 'Active' },
        features: {
          shipped: [],
          inProgress: [],
          nextUp: [],
          backlog: []
        },
        stats: {
          shipped: 0,
          inProgress: 0,
          nextUp: 0,
          backlog: 0
        }
      };

      const mockFetch = window.fetch;
      window.fetch = async () => ({
        ok: true,
        text: async () => `const productRoadmap = ${JSON.stringify(mockData)};`
      } as Response);

      const el = await fixture<PMRoadmap>(html`<pm-roadmap></pm-roadmap>`);

      // Wait for data to load
      await waitUntil(() => (el as any).roadmapData !== null, 'Data should load');

      expect((el as any).roadmapData).to.exist;
      expect((el as any).loadingState).to.equal('success');

      window.fetch = mockFetch;
    });

    it('should reload data when reconnected without data', async () => {
      const mockData = {
        project: { name: 'Test Project', status: 'Active' },
        features: {
          shipped: [],
          inProgress: [],
          nextUp: [],
          backlog: []
        },
        stats: {
          shipped: 0,
          inProgress: 0,
          nextUp: 0,
          backlog: 0
        }
      };

      let fetchCallCount = 0;
      const mockFetch = window.fetch;
      window.fetch = async () => {
        fetchCallCount++;
        return {
          ok: true,
          text: async () => `const productRoadmap = ${JSON.stringify(mockData)};`
        } as Response;
      };

      // Create element
      const el = await fixture<PMRoadmap>(html`<pm-roadmap></pm-roadmap>`);

      // Wait for initial load
      await waitUntil(() => (el as any).roadmapData !== null, 'Initial data should load');
      expect(fetchCallCount).to.equal(1);

      // Simulate disconnection (navigation away)
      el.remove();

      // Clear data as if component was unmounted
      (el as any).roadmapData = null;
      (el as any).loadingState = 'idle';

      // Reconnect (navigation back)
      document.body.appendChild(el);

      // Should trigger reload since data is null
      await waitUntil(() => (el as any).roadmapData !== null, 'Data should reload on reconnect');
      expect(fetchCallCount).to.equal(2);

      window.fetch = mockFetch;
    });

    it('should not reload data on reconnect if data exists', async () => {
      const mockData = {
        project: { name: 'Test Project', status: 'Active' },
        features: {
          shipped: [],
          inProgress: [],
          nextUp: [],
          backlog: []
        },
        stats: {
          shipped: 0,
          inProgress: 0,
          nextUp: 0,
          backlog: 0
        }
      };

      let fetchCallCount = 0;
      const mockFetch = window.fetch;
      window.fetch = async () => {
        fetchCallCount++;
        return {
          ok: true,
          text: async () => `const productRoadmap = ${JSON.stringify(mockData)};`
        } as Response;
      };

      // Create element
      const el = await fixture<PMRoadmap>(html`<pm-roadmap></pm-roadmap>`);

      // Wait for initial load
      await waitUntil(() => (el as any).roadmapData !== null, 'Initial data should load');
      expect(fetchCallCount).to.equal(1);

      // Simulate disconnection without clearing data
      el.remove();

      // Reconnect
      document.body.appendChild(el);

      // Give it time to potentially reload
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should NOT reload since data still exists
      expect(fetchCallCount).to.equal(1);

      window.fetch = mockFetch;
    });
  });

  describe('Error Handling', () => {
    it('should show error state when fetch fails', async () => {
      const mockFetch = window.fetch;
      window.fetch = async () => ({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      } as Response);

      const el = await fixture<PMRoadmap>(html`<pm-roadmap></pm-roadmap>`);

      // Wait for error state
      await waitUntil(() => (el as any).error !== null, 'Error should be set');

      expect((el as any).error).to.exist;
      expect((el as any).loadingState).to.equal('error');

      window.fetch = mockFetch;
    });

    it('should show error for invalid data structure', async () => {
      const mockFetch = window.fetch;
      window.fetch = async () => ({
        ok: true,
        text: async () => 'const productRoadmap = { invalid: true };'
      } as Response);

      const el = await fixture<PMRoadmap>(html`<pm-roadmap></pm-roadmap>`);

      // Wait for error state
      await waitUntil(() => (el as any).error !== null, 'Error should be set');

      expect((el as any).error).to.exist;
      expect((el as any).error.message).to.include('Invalid roadmap data structure');

      window.fetch = mockFetch;
    });
  });

  describe('Navigation Scenario', () => {
    it('should handle Tests -> Roadmap -> Tests -> Roadmap navigation', async () => {
      const mockData = {
        project: { name: 'Test Project', status: 'Active' },
        features: {
          shipped: [],
          inProgress: [],
          nextUp: [],
          backlog: []
        },
        stats: {
          shipped: 0,
          inProgress: 0,
          nextUp: 0,
          backlog: 0
        }
      };

      let fetchCallCount = 0;
      const mockFetch = window.fetch;
      window.fetch = async () => {
        fetchCallCount++;
        return {
          ok: true,
          text: async () => `const productRoadmap = ${JSON.stringify(mockData)};`
        } as Response;
      };

      // Initial roadmap load
      const el = await fixture<PMRoadmap>(html`<pm-roadmap></pm-roadmap>`);
      await waitUntil(() => (el as any).roadmapData !== null, 'Initial load');
      expect(fetchCallCount).to.equal(1);

      // Simulate navigation to Tests (disconnect)
      el.remove();
      (el as any).roadmapData = null;
      (el as any).loadingState = 'idle';

      // Navigate back to Roadmap (reconnect)
      document.body.appendChild(el);
      await waitUntil(() => (el as any).roadmapData !== null, 'First navigation back');
      expect(fetchCallCount).to.equal(2);

      // Navigate to Tests again
      el.remove();
      (el as any).roadmapData = null;
      (el as any).loadingState = 'idle';

      // Navigate back to Roadmap again
      document.body.appendChild(el);
      await waitUntil(() => (el as any).roadmapData !== null, 'Second navigation back');
      expect(fetchCallCount).to.equal(3);

      window.fetch = mockFetch;
    });
  });
});
