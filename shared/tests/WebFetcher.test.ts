/**
 * Tests for WebFetcher
 */

import { WebFetcher } from '../src/core/WebFetcher';

describe('WebFetcher', () => {
  let fetcher: WebFetcher;

  beforeEach(() => {
    fetcher = new WebFetcher();
  });

  describe('analyze', () => {
    it('should extract title from HTML', () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <head><title>Test Page</title></head>
          <body><h1>Welcome</h1></body>
        </html>
      `;

      const result = fetcher.analyze(html);
      expect(result.title).toBe('Test Page');
    });

    it('should extract description from meta tags', () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta name="description" content="This is a test page">
          </head>
          <body></body>
        </html>
      `;

      const result = fetcher.analyze(html);
      expect(result.description).toBe('This is a test page');
    });

    it('should extract links', () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <body>
            <a href="/page1">Page 1</a>
            <a href="/page2">Page 2</a>
          </body>
        </html>
      `;

      const result = fetcher.analyze(html);
      expect(result.links).toContain('/page1');
      expect(result.links).toContain('/page2');
      expect(result.links?.length).toBe(2);
    });

    it('should extract main content when specified', () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <body>
            <nav>Navigation</nav>
            <main>Main Content Here</main>
            <footer>Footer</footer>
          </body>
        </html>
      `;

      const result = fetcher.analyze(html, { mainContentOnly: true });
      expect(result.text).toContain('Main Content Here');
      expect(result.text).not.toContain('Navigation');
      expect(result.text).not.toContain('Footer');
    });

    it('should remove navigation when specified', () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <body>
            <nav>Should be removed</nav>
            <div>Should remain</div>
          </body>
        </html>
      `;

      const result = fetcher.analyze(html, { removeNav: true });
      expect(result.text).not.toContain('Should be removed');
      expect(result.text).toContain('Should remain');
    });

    it('should truncate text when maxLength is specified', () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <body><p>This is a very long text that should be truncated</p></body>
        </html>
      `;

      const result = fetcher.analyze(html, { maxLength: 20 });
      expect(result.text.length).toBeLessThanOrEqual(24); // 20 + '...'
      expect(result.text).toContain('...');
    });

    it('should extract JSON-LD structured data', () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <script type="application/ld+json">
              {"@type": "WebPage", "name": "Test"}
            </script>
          </head>
          <body></body>
        </html>
      `;

      const result = fetcher.analyze(html);
      expect(result.data['@type']).toBe('WebPage');
      expect(result.data.name).toBe('Test');
    });
  });
});
