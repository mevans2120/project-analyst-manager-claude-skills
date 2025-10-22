# Shared Library - Web Viewing Capabilities

**Status**: ✅ Production Ready
**Version**: 1.0.0
**Tests**: 7/7 passing

## Overview

The shared library provides web viewing capabilities for all Project Management Suite skills. It includes the `WebFetcher` component for static HTML analysis.

## Features

### WebFetcher - Static HTML Analysis

Foundation for all web viewing capabilities:

- ✅ Fetch HTML from any URL
- ✅ Convert HTML to Markdown automatically
- ✅ Extract structured data (title, description, links)
- ✅ Intelligent content extraction (main content only)
- ✅ Remove navigation/footer elements
- ✅ JSON-LD structured data parsing
- ✅ Content truncation support
- ✅ Custom selector extraction

## Installation

```bash
npm install @project-suite/shared
```

## Usage

### Basic Fetch

```typescript
import { webFetcher } from '@project-suite/shared';

// Fetch and convert to markdown
const result = await webFetcher.fetch({
  url: 'https://example.com',
  timeout: 30000
});

console.log(result.markdown);
console.log(result.statusCode);
```

### Analyze HTML

```typescript
import { WebFetcher } from '@project-suite/shared';

const fetcher = new WebFetcher();
const html = '<html><body><main>Content</main></body></html>';

const analysis = fetcher.analyze(html, {
  mainContentOnly: true,
  removeNav: true,
  maxLength: 1000
});

console.log(analysis.text);
console.log(analysis.title);
console.log(analysis.links);
```

### Fetch and Analyze

```typescript
// One-step fetch and analyze
const result = await webFetcher.fetchAndAnalyze(
  { url: 'https://example.com' },
  { mainContentOnly: true }
);

console.log(result.analysis.text);
console.log(result.markdown);
```

## API Reference

### `WebFetcher.fetch(options: FetchOptions): Promise<FetchResult>`

Fetches HTML from a URL and converts to markdown.

**Options:**
- `url` (required): URL to fetch
- `timeout` (optional): Timeout in milliseconds (default: 30000)
- `headers` (optional): Custom HTTP headers
- `followRedirects` (optional): Follow redirects (default: true)

**Returns:**
- `html`: Raw HTML content
- `markdown`: Markdown conversion
- `finalUrl`: URL after redirects
- `statusCode`: HTTP status code
- `headers`: Response headers
- `timestamp`: Fetch timestamp

### `WebFetcher.analyze(html: string, options?: AnalysisOptions): AnalysisResult`

Analyzes HTML and extracts structured data.

**Options:**
- `mainContentOnly` (optional): Extract only main content (default: true)
- `removeNav` (optional): Remove navigation elements (default: true)
- `maxLength` (optional): Maximum content length
- `selectors` (optional): Custom CSS selectors to extract

**Returns:**
- `text`: Extracted text content
- `data`: Structured data (JSON-LD, etc.)
- `title`: Page title
- `description`: Meta description
- `links`: Array of links found

## Testing

```bash
npm test
```

All 7 tests passing:
- ✅ Title extraction
- ✅ Meta description extraction
- ✅ Link extraction
- ✅ Main content extraction
- ✅ Navigation removal
- ✅ Content truncation
- ✅ JSON-LD structured data parsing

## Next Steps

This library will be extended with:
- **PlaywrightDriver** (PM-2): Browser automation for SPAs
- **ScreenshotCapture** (PM-4): Visual documentation
- **NetworkMonitor** (PM-5): API discovery
- **Feature Extractors** (PM-6): Advanced analysis tools

## License

MIT
