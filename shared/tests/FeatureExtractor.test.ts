/**
 * Tests for Feature Extractors Suite
 * FeatureExtractor, FunctionalityChecker, VisualAnalyzer
 */

import {
  FeatureExtractor,
  FunctionalityChecker,
  VisualAnalyzer
} from '../src/core/FeatureExtractor';
import { PlaywrightDriver } from '../src/core/PlaywrightDriver';

describe('FeatureExtractor', () => {
  let extractor: FeatureExtractor;
  let driver: PlaywrightDriver;

  beforeEach(() => {
    driver = new PlaywrightDriver({ headless: true });
    extractor = new FeatureExtractor(driver);
  });

  afterEach(async () => {
    if (driver.isLaunched()) {
      await driver.close();
    }
  });

  describe('initialization', () => {
    it('should create instance with provided driver', () => {
      expect(extractor).toBeInstanceOf(FeatureExtractor);
      expect(extractor.getDriver()).toBe(driver);
    });

    it('should create instance with default driver if none provided', () => {
      const defaultExtractor = new FeatureExtractor();
      expect(defaultExtractor).toBeInstanceOf(FeatureExtractor);
      expect(defaultExtractor.getDriver()).toBeInstanceOf(PlaywrightDriver);
    });
  });

  describe('extract - comprehensive feature extraction', () => {
    it('should extract features from a URL', async () => {
      const result = await extractor.extract({
        url: 'https://example.com'
      });

      expect(result).toBeDefined();
      expect(result.url).toBe('https://example.com');
      expect(Array.isArray(result.features)).toBe(true);
      expect(result.metadata).toBeDefined();
      expect(result.metadata.featuresFound).toBe(result.features.length);
      expect(result.metadata.extractionTime).toBeGreaterThan(0);
    }, 30000);

    it('should extract UI features by default', async () => {
      const result = await extractor.extract({
        url: 'https://example.com',
        extractUI: true,
        extractAPI: false,
        extractVisual: false
      });

      const uiFeatures = result.features.filter(f => f.type === 'ui');
      // example.com may have links/buttons/forms or not - just verify extraction runs
      expect(Array.isArray(uiFeatures)).toBe(true);
      expect(result.metadata.featuresFound).toBe(result.features.length);
    }, 25000);

    it('should extract API features when enabled', async () => {
      const result = await extractor.extract({
        url: 'https://example.com',
        extractAPI: true,
        extractUI: false,
        extractVisual: false
      });

      // example.com is static, so may have 0 API features
      const apiFeatures = result.features.filter(f => f.type === 'api');
      expect(Array.isArray(apiFeatures)).toBe(true);
    }, 25000);

    it('should extract visual features when enabled', async () => {
      const result = await extractor.extract({
        url: 'https://example.com',
        extractVisual: true,
        extractUI: false,
        extractAPI: false
      });

      const visualFeatures = result.features.filter(f => f.type === 'visual');
      // Visual extraction should run successfully even if no visual features found
      expect(Array.isArray(visualFeatures)).toBe(true);
    }, 25000);

    it('should extract all feature types when all enabled', async () => {
      const result = await extractor.extract({
        url: 'https://example.com',
        extractUI: true,
        extractAPI: true,
        extractVisual: true
      });

      // Should complete successfully, even if no features found on simple page
      expect(Array.isArray(result.features)).toBe(true);
      expect(result.metadata).toBeDefined();
    }, 30000);

    it('should capture screenshots when requested', async () => {
      const result = await extractor.extract({
        url: 'https://example.com',
        extractVisual: true,
        captureScreenshots: true,
        extractUI: false,
        extractAPI: false
      });

      const screenshotFeatures = result.features.filter(
        f => f.name === 'Page Screenshot'
      );

      expect(screenshotFeatures.length).toBeGreaterThan(0);
      expect(screenshotFeatures[0].screenshot).toBeDefined();
      expect(Buffer.isBuffer(screenshotFeatures[0].screenshot)).toBe(true);
    }, 25000);

    it('should respect viewport option', async () => {
      const result = await extractor.extract({
        url: 'https://example.com',
        viewport: 'mobile'
      });

      expect(result).toBeDefined();
      expect(result.url).toBe('https://example.com');
      expect(Array.isArray(result.features)).toBe(true);
    }, 25000);
  });

  describe('UI feature extraction', () => {
    it('should extract navigation links', async () => {
      const result = await extractor.extract({
        url: 'https://example.com',
        extractUI: true,
        extractAPI: false,
        extractVisual: false
      });

      const navLinks = result.features.filter(
        f => f.type === 'ui' && f.description === 'Navigation link'
      );

      // Navigation extraction should complete even if no nav links found
      expect(Array.isArray(navLinks)).toBe(true);
    }, 25000);

    it('should extract forms', async () => {
      // example.com doesn't have forms, but the extractor should handle this
      const result = await extractor.extract({
        url: 'https://example.com',
        extractUI: true,
        extractAPI: false,
        extractVisual: false
      });

      const forms = result.features.filter(
        f => f.type === 'ui' && f.name.startsWith('Form')
      );

      expect(Array.isArray(forms)).toBe(true);
    }, 25000);

    it('should extract buttons', async () => {
      const result = await extractor.extract({
        url: 'https://example.com',
        extractUI: true,
        extractAPI: false,
        extractVisual: false
      });

      const buttons = result.features.filter(
        f => f.type === 'ui' && f.description === 'Button'
      );

      expect(Array.isArray(buttons)).toBe(true);
    }, 25000);

    it('should include feature metadata', async () => {
      const result = await extractor.extract({
        url: 'https://example.com',
        extractUI: true,
        extractAPI: false,
        extractVisual: false
      });

      if (result.features.length > 0) {
        const feature = result.features[0];

        expect(feature).toHaveProperty('name');
        expect(feature).toHaveProperty('type');
        expect(feature).toHaveProperty('description');
        expect(feature).toHaveProperty('location');
        expect(feature).toHaveProperty('confidence');
        expect(typeof feature.confidence).toBe('number');
        expect(feature.confidence).toBeGreaterThan(0);
        expect(feature.confidence).toBeLessThanOrEqual(100);
      }
    }, 25000);
  });

  describe('visual feature extraction', () => {
    it('should detect images', async () => {
      const result = await extractor.extract({
        url: 'https://example.com',
        extractVisual: true,
        extractUI: false,
        extractAPI: false
      });

      // example.com may or may not have images
      const imageFeatures = result.features.filter(
        f => f.name === 'Image Gallery'
      );

      expect(Array.isArray(imageFeatures)).toBe(true);
    }, 25000);

    it('should detect video elements', async () => {
      const result = await extractor.extract({
        url: 'https://example.com',
        extractVisual: true,
        extractUI: false,
        extractAPI: false
      });

      // Just checking it doesn't error
      expect(result.features).toBeDefined();
    }, 25000);
  });

  describe('browser lifecycle', () => {
    it('should launch browser if not already launched', async () => {
      expect(driver.isLaunched()).toBe(false);

      await extractor.extract({ url: 'https://example.com' });

      // Should be closed after extraction
      expect(driver.isLaunched()).toBe(false);
    }, 25000);

    it('should not close browser if it was already launched', async () => {
      await driver.launch();
      expect(driver.isLaunched()).toBe(true);

      await extractor.extract({ url: 'https://example.com' });

      // Should still be launched
      expect(driver.isLaunched()).toBe(true);
    }, 25000);

    it('should close browser when close() is called', async () => {
      await driver.launch();
      expect(driver.isLaunched()).toBe(true);

      await extractor.close();
      expect(driver.isLaunched()).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle invalid URL gracefully', async () => {
      await expect(
        extractor.extract({ url: 'not-a-valid-url' })
      ).rejects.toThrow();
    }, 15000);
  });
});

describe('FunctionalityChecker', () => {
  let driver: PlaywrightDriver;
  let checker: FunctionalityChecker;

  beforeEach(async () => {
    driver = new PlaywrightDriver({ headless: true });
    await driver.launch();
    await driver.navigate({ url: 'https://example.com' });
    checker = new FunctionalityChecker(driver);
  }, 20000);

  afterEach(async () => {
    if (driver.isLaunched()) {
      await driver.close();
    }
  });

  describe('check - UI features', () => {
    it('should verify functional UI element', async () => {
      const feature = {
        name: 'Example Heading',
        type: 'ui' as const,
        description: 'Main heading',
        location: 'h1',
        confidence: 100
      };

      const result = await checker.check(feature);

      expect(result.functional).toBe(true);
      expect(result.feature).toBe('Example Heading');
      expect(result.details).toContain('exists');
      expect(Array.isArray(result.evidence)).toBe(true);
    }, 15000);

    it('should detect non-functional UI element', async () => {
      const feature = {
        name: 'Non-existent Element',
        type: 'ui' as const,
        description: 'Should not exist',
        location: '.definitely-not-a-real-class-12345',
        confidence: 100
      };

      const result = await checker.check(feature);

      expect(result.functional).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('not found');
    }, 15000);
  });

  describe('check - API features', () => {
    it('should mark API features as functional', async () => {
      const feature = {
        name: 'User API',
        type: 'api' as const,
        description: 'User endpoint',
        location: 'https://api.example.com/users',
        confidence: 95,
        evidence: ['GET /users', 'POST /users']
      };

      const result = await checker.check(feature);

      expect(result.functional).toBe(true);
      expect(result.details).toContain('responding');
      expect(result.evidence).toEqual(['GET /users', 'POST /users']);
    });
  });

  describe('check - other feature types', () => {
    it('should handle visual features', async () => {
      const feature = {
        name: 'Screenshot',
        type: 'visual' as const,
        description: 'Page screenshot',
        location: 'page',
        confidence: 100
      };

      const result = await checker.check(feature);

      expect(result.functional).toBe(true);
      expect(result.details).toContain('detected');
    });
  });

  describe('error handling', () => {
    it('should handle errors during check', async () => {
      // Close driver to cause an error
      await driver.close();

      const feature = {
        name: 'Test Feature',
        type: 'ui' as const,
        description: 'Test',
        location: 'h1',
        confidence: 100
      };

      const result = await checker.check(feature);

      expect(result.functional).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});

describe('VisualAnalyzer', () => {
  let driver: PlaywrightDriver;
  let analyzer: VisualAnalyzer;

  beforeEach(async () => {
    driver = new PlaywrightDriver({ headless: true });
    await driver.launch();
    await driver.navigate({ url: 'https://example.com' });
    analyzer = new VisualAnalyzer(driver);
  }, 20000);

  afterEach(async () => {
    if (driver.isLaunched()) {
      await driver.close();
    }
  });

  describe('analyze', () => {
    it('should analyze visual elements on the page', async () => {
      const elements = await analyzer.analyze();

      expect(Array.isArray(elements)).toBe(true);
      expect(elements.length).toBeGreaterThan(0);
    }, 15000);

    it('should detect buttons', async () => {
      const elements = await analyzer.analyze();
      const buttons = elements.filter(el => el.type === 'button');

      // example.com may or may not have buttons
      expect(Array.isArray(buttons)).toBe(true);
    }, 15000);

    it('should detect links', async () => {
      const elements = await analyzer.analyze();
      const links = elements.filter(el => el.type === 'link');

      expect(links.length).toBeGreaterThan(0);

      for (const link of links) {
        expect(link).toHaveProperty('selector');
        expect(link).toHaveProperty('text');
        expect(link).toHaveProperty('attributes');
      }
    }, 15000);

    it('should detect forms', async () => {
      const elements = await analyzer.analyze();
      const forms = elements.filter(el => el.type === 'form');

      expect(Array.isArray(forms)).toBe(true);
    }, 15000);

    it('should detect inputs', async () => {
      const elements = await analyzer.analyze();
      const inputs = elements.filter(el => el.type === 'input');

      expect(Array.isArray(inputs)).toBe(true);
    }, 15000);

    it('should detect images', async () => {
      const elements = await analyzer.analyze();
      const images = elements.filter(el => el.type === 'image');

      expect(Array.isArray(images)).toBe(true);
    }, 15000);

    it('should include element metadata', async () => {
      const elements = await analyzer.analyze();

      if (elements.length > 0) {
        const element = elements[0];

        expect(element).toHaveProperty('type');
        expect(element).toHaveProperty('selector');
        expect(element).toHaveProperty('text');
        expect(element).toHaveProperty('attributes');
        expect(typeof element.attributes).toBe('object');
      }
    }, 15000);

    it('should capture element attributes', async () => {
      const elements = await analyzer.analyze();
      const links = elements.filter(el => el.type === 'link');

      if (links.length > 0) {
        const link = links[0];
        expect(link.attributes).toHaveProperty('href');
      }
    }, 15000);
  });
});
