# Shared Web Viewer Library

A collection of tools for fetching, analyzing, and extracting data from web pages using Claude AI. This library is shared across Project Planner, Analyzer, and Manager skills.

## Status

**PM-1: WebFetcher** - ✅ Complete (24 tests passing)

## Features

- 🌐 **WebFetcher**: Fetch and analyze web pages with AI
- 🧠 **AI Analysis**: Use Claude to extract insights from web content
- 🔄 **Batch Processing**: Fetch multiple pages in parallel
- 📊 **Structured Extraction**: Extract specific data using JSON schemas
- ✅ **Error Handling**: Graceful handling of network and parsing errors

## Installation

```bash
cd shared/web-viewer
npm install
```

## Usage

### Basic Fetching

```javascript
const { WebFetcher } = require('./src/index');

// Create a fetcher with Claude's WebFetch tool
const fetcher = new WebFetcher({
  webFetchTool: webFetchToolFunction
});

// Fetch and analyze a page
const result = await fetcher.fetch(
  'https://example.com',
  'Extract the main heading and description from this page'
);

console.log(result.content); // AI analysis result
```

### Extracting Structured Data

```javascript
// Define a schema for the data you want
const schema = {
  title: 'The main page title',
  description: 'The meta description or page summary',
  links: 'All navigation links as an array'
};

// Extract data matching the schema
const result = await fetcher.extract('https://example.com', schema);

console.log(result.data);
// {
//   title: "Example Domain",
//   description: "This domain is for use in...",
//   links: ["More information...", ...]
// }
```

### Batch Fetching

```javascript
// Fetch multiple pages in parallel
const requests = [
  { url: 'https://example1.com', prompt: 'Get the title' },
  { url: 'https://example2.com', prompt: 'Get the title' },
  { url: 'https://example3.com', prompt: 'Get the title' }
];

const results = await fetcher.fetchMany(requests, 3); // 3 concurrent requests

results.forEach(result => {
  console.log(`${result.url}: ${result.content}`);
});
```

### Checking URL Accessibility

```javascript
const accessible = await fetcher.isAccessible('https://example.com');

if (accessible) {
  console.log('URL is accessible');
} else {
  console.log('URL is not accessible');
}
```

## API Reference

### `WebFetcher`

#### Constructor

```javascript
new WebFetcher(options)
```

**Options**:
- `webFetchTool` (Function, required): The WebFetch tool from Claude Code
- `timeout` (Number, optional): Request timeout in milliseconds (default: 30000)

#### Methods

##### `fetch(url, prompt)`

Fetch and analyze a single web page.

**Parameters**:
- `url` (String): The URL to fetch
- `prompt` (String): The analysis prompt for Claude AI

**Returns**: Promise<Object>
```javascript
{
  success: true,
  url: "https://example.com",
  content: "Analysis result",
  timestamp: "2025-10-21T12:00:00.000Z"
}
```

##### `fetchMany(requests, concurrency)`

Fetch multiple pages in parallel.

**Parameters**:
- `requests` (Array): Array of `{url, prompt}` objects
- `concurrency` (Number, optional): Max parallel requests (default: 3)

**Returns**: Promise<Array<Object>>

##### `extract(url, schema)`

Extract structured data from a web page.

**Parameters**:
- `url` (String): The URL to fetch
- `schema` (Object): Data schema defining what to extract

**Returns**: Promise<Object>
```javascript
{
  success: true,
  url: "https://example.com",
  data: { ... },  // Extracted data matching schema
  timestamp: "2025-10-21T12:00:00.000Z"
}
```

##### `isAccessible(url)`

Check if a URL is accessible.

**Parameters**:
- `url` (String): The URL to check

**Returns**: Promise<Boolean>

## Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

**Test Results**:
- ✅ 24 tests passing
- ✅ 100% code coverage
- ✅ All edge cases handled

## Error Handling

All methods return structured error responses:

```javascript
{
  success: false,
  url: "https://example.com",
  error: "Network error message",
  timestamp: "2025-10-21T12:00:00.000Z"
}
```

## Integration with Skills

### Project Planner

Use WebFetcher to discover features from live websites:

```javascript
const features = await fetcher.extract('https://competitor-site.com', {
  features: 'List all product features mentioned on the page',
  pricing: 'Extract pricing information'
});
```

### Project Analyzer

Use WebFetcher to verify features in production:

```javascript
const verification = await fetcher.fetch(
  'https://your-app.com/feature',
  'Verify that the user can access this feature and describe what you see'
);
```

### Project Manager

Use WebFetcher to capture screenshots and analyze UI:

```javascript
const analysis = await fetcher.fetch(
  'https://your-app.com',
  'Describe any visual bugs or issues you notice on this page'
);
```

## Next Steps

- **PM-2: PlaywrightDriver** - Browser automation for SPAs
- **PM-4: ScreenshotCapture** - Visual documentation
- **PM-5: NetworkMonitor** - API discovery
- **PM-6: Feature Extractors** - Advanced feature detection

## License

MIT
