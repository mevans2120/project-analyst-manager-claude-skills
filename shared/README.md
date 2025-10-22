# Shared Library - Web Viewing Capabilities

**Status**: ✅ Production Ready
**Version**: 1.0.0
**Features**: WebFetcher (7 tests) + PlaywrightDriver (implementation complete)

## Overview

The shared library provides web viewing capabilities for all Project Management Suite skills. It includes:

1. **WebFetcher** - Static HTML analysis (fully tested)
2. **PlaywrightDriver** - Browser automation (implementation complete)

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

**Tests**: 7/7 passing

### PlaywrightDriver - Browser Automation

Enables SPA navigation, authentication, and dynamic content analysis:

- ✅ Launch browsers (Chromium, Firefox, WebKit)
- ✅ Navigate to URLs with configurable wait states
- ✅ Execute JavaScript in page context
- ✅ Extract page content (HTML, title, cookies)
- ✅ Take screenshots (full page or viewport)
- ✅ Authenticate with username/password
- ✅ Element interaction (click, type, get text)
- ✅ Network monitoring (requests/responses, API calls)
- ✅ Cookie management
- ✅ Wait for elements and page loads

**Implementation**: Complete (400+ lines)
**Tests**: Integration tests require browser installation (see below)

## Installation

```bash
npm install @project-suite/shared
```

### Installing Playwright Browsers

For PlaywrightDriver to work, you need to install browsers:

```bash
npx playwright install chromium
# Or install all browsers
npx playwright install
```

**Note**: Browser installation requires internet access. If running in a restricted environment, integration tests will be skipped.

## Usage

### WebFetcher - Basic Fetch

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

### WebFetcher - Analyze HTML

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

### PlaywrightDriver - Basic Usage

```typescript
import { PlaywrightDriver } from '@project-suite/shared';

const driver = new PlaywrightDriver({
  browser: 'chromium',
  headless: true
});

// Launch browser
await driver.launch();

// Navigate to page
await driver.navigate({ url: 'https://example.com' });

// Get content
const content = await driver.getContent();
console.log(content.title);
console.log(content.html);

// Take screenshot
const screenshot = await driver.screenshot({ fullPage: true });

// Close browser
await driver.close();
```

### PlaywrightDriver - Authentication

```typescript
await driver.launch();
await driver.navigate({ url: 'https://example.com/login' });

await driver.authenticate({
  username: 'user@example.com',
  password: 'password123',
  selectors: {
    username: 'input[name="email"]',
    password: 'input[name="password"]',
    submit: 'button[type="submit"]'
  }
});

// Now you're logged in!
const content = await driver.getContent();
```

### PlaywrightDriver - Network Monitoring

```typescript
await driver.launch();
await driver.navigate({ url: 'https://example.com' });

// Get all network requests
const requests = driver.getNetworkRequests();
console.log(`Made ${requests.length} requests`);

// Get API calls only
const apiCalls = driver.getAPICalls();
console.log('API endpoints called:', apiCalls.map(r => r.url));

// Get responses
const responses = driver.getNetworkResponses();
console.log('Responses:', responses.map(r => `${r.status} ${r.url}`));
```

## API Reference

### WebFetcher

See previous README section (unchanged).

### PlaywrightDriver

#### `constructor(options?: PlaywrightOptions)`

Create a new PlaywrightDriver instance.

**Options:**
- `browser`: 'chromium' | 'firefox' | 'webkit' (default: 'chromium')
- `headless`: boolean (default: true)
- `viewport`: { width, height } (default: 1920x1080)
- `timeout`: number (default: 30000ms)

#### `launch(): Promise<void>`

Launch the browser and create a new page.

#### `navigate(options: NavigationOptions): Promise<void>`

Navigate to a URL.

**Options:**
- `url`: string (required)
- `waitUntil`: 'load' | 'domcontentloaded' | 'networkidle' (default: 'networkidle')
- `timeout`: number (optional)

#### `getContent(includeScreenshot?: boolean): Promise<PageContent>`

Get page content including HTML, title, URL, and cookies.

**Returns:**
- `html`: string
- `title`: string
- `url`: string
- `cookies`: any[]
- `screenshot`: Buffer (if requested)

#### `screenshot(options?: ScreenshotOptions): Promise<Buffer>`

Take a screenshot of the page.

**Options:**
- `path`: string (optional, save to file)
- `fullPage`: boolean (default: false)
- `type`: 'png' | 'jpeg' (default: 'png')
- `quality`: number (0-100, JPEG only)

#### `authenticate(options: AuthenticationOptions): Promise<void>`

Authenticate with username and password.

**Options:**
- `username`: string (required)
- `password`: string (required)
- `loginUrl`: string (optional)
- `selectors`: object with username, password, submit selectors

#### `evaluate<T>(script: string | Function): Promise<T>`

Execute JavaScript in the page context.

#### `click(selector: string): Promise<void>`

Click an element.

#### `type(selector: string, text: string): Promise<void>`

Type text into an input field.

#### `getText(selector: string): Promise<string | null>`

Get text content of an element.

#### `exists(selector: string): Promise<boolean>`

Check if an element exists on the page.

#### `getNetworkRequests(): NetworkRequest[]`

Get all network requests made during navigation.

#### `getNetworkResponses(): NetworkResponse[]`

Get all network responses received.

#### `getAPICalls(): NetworkRequest[]`

Get only API calls (XHR and Fetch requests).

#### `setCookies(cookies: any[]): Promise<void>`

Set cookies for the browser context.

#### `getCookies(): Promise<any[]>`

Get all cookies from the browser context.

#### `close(): Promise<void>`

Close the browser and clean up resources.

#### `isLaunched(): boolean`

Check if the browser is currently running.

## Testing

```bash
# Run all tests
npm test

# Run only WebFetcher tests (no browser needed)
npm test -- WebFetcher.test.ts

# Run PlaywrightDriver tests (requires browsers)
npm test -- PlaywrightDriver.test.ts
```

**Test Status:**
- ✅ WebFetcher: 7/7 passing
- ⚠️ PlaywrightDriver: Implementation complete, integration tests require browser installation

## Architecture

Both WebFetcher and PlaywrightDriver are designed to be:

1. **Modular**: Can be used independently or together
2. **Extensible**: Easy to add new features
3. **Type-safe**: Full TypeScript support
4. **Error-resilient**: Proper error handling and cleanup

## Next Steps

This library will be extended with:
- **ScreenshotCapture** (PM-4): Multi-viewport screenshots with AI analysis
- **NetworkMonitor** (PM-5): Enhanced API discovery
- **Feature Extractors** (PM-6): FeatureExtractor, FunctionalityChecker, VisualAnalyzer

## Dependencies

- **node-fetch**: HTTP requests
- **turndown**: HTML to Markdown conversion
- **cheerio**: HTML parsing
- **playwright**: Browser automation

## License

MIT
