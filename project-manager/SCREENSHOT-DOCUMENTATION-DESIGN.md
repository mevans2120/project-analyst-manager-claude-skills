# Project Manager: Screenshot Documentation

**Status**: Design Specification
**Date**: 2025-10-21
**Purpose**: Add visual documentation capabilities to the Project Manager

---

## Executive Summary

The Manager currently creates text-only GitHub issues. This enhancement adds screenshot capture and visual documentation to improve issue quality and debugging speed.

**Value Proposition**: "Show, don't just tell" - Visual evidence accelerates issue resolution

---

## Current vs Enhanced

### Current Manager
```bash
manager create-issues

# Creates issue:
# Title: "Fix broken shopping cart button"
# Body: "Shopping cart button is broken
#        File: components/Cart.tsx:45"
# Problem: What does "broken" mean? How does it look?
```

### Enhanced Manager
```bash
manager create-issues --with-screenshots https://myapp.com

# Creates issue:
# Title: "Fix broken shopping cart button"
# Body: "Shopping cart button is broken
#        [Screenshot showing misaligned button]
#        Expected: Button aligned right
#        Actual: Button cut off screen
#        File: components/Cart.tsx:45
#        URL: https://myapp.com/cart"
# Benefit: Visual evidence = faster understanding!
```

---

## Use Cases

### 1. UI Bug Documentation
```bash
manager create-issues --scan-ui https://myapp.com

# Scans UI, captures screenshots of issues
# Creates issues with before/after comparisons
# Attaches visual evidence
```

### 2. Feature Documentation
```bash
manager document-features --url https://myapp.com --output docs/features/

# Captures screenshots of each feature
# Creates markdown documentation with images
# Useful for release notes, user guides
```

### 3. Visual Regression Detection
```bash
manager compare-ui \
  --before https://staging.myapp.com \
  --after https://production.myapp.com

# Captures screenshots of both
# AI identifies visual differences
# Creates issues for regressions
```

### 4. Mobile Responsiveness Check
```bash
manager check-responsive https://myapp.com

# Captures mobile, tablet, desktop screenshots
# Identifies layout issues
# Creates issues for responsive bugs
```

---

## CLI Design

### New Commands

```bash
# Create issues with screenshots
manager create-issues [path] --with-screenshots <url>
  --viewports <sizes>       # mobile,tablet,desktop (default: desktop)
  --auth                    # Interactive authentication
  --upload                  # Upload screenshots to GitHub
  --compare                 # Compare before/after screenshots

# Scan UI for visual issues
manager scan-ui <url> [options]
  --create-issues           # Auto-create issues for found problems
  --severity <level>        # Only report issues above level
  --viewports <sizes>       # Viewports to check

# Document features visually
manager document-features <url> [options]
  --features <file>         # features.csv
  --output <dir>            # Output directory for docs
  --format <type>           # markdown, html, pdf

# Visual comparison
manager compare-ui --before <url> --after <url>
  --threshold <number>      # Difference threshold (0-100)
  --create-issues           # Create issues for differences
```

---

## Screenshot Capture Workflow

### Workflow 1: TODO → Issue + Screenshot

```typescript
async function createIssueWithScreenshot(todo: Todo, productionUrl: string): Promise<GitHubIssue> {
  // 1. Infer page URL from TODO
  const pageUrl = inferPageUrl(todo, productionUrl);
  // Result: "TODO in Cart.tsx" → "https://myapp.com/cart"

  // 2. Navigate and capture
  const driver = new PlaywrightDriver();
  await driver.navigate({ url: pageUrl });

  const screenshot = await capturer.capture({
    url: pageUrl,
    fullPage: false,
    outputPath: `.screenshots/${sanitizeFilename(todo.content)}.png`
  });

  // 3. AI visual analysis
  const analysis = await visualAnalyzer.analyze(
    screenshot.buffer,
    `Analyze this UI for the issue: "${todo.content}". Identify visual problems or areas related to this issue.`
  );

  // 4. Create GitHub issue
  const issue = await githubClient.createIssue({
    title: todo.content,
    body: generateIssueBody(todo, pageUrl, screenshot, analysis),
    labels: determineLabels(todo, analysis)
  });

  // 5. Upload screenshot as GitHub attachment
  await githubClient.uploadAsset(issue.number, screenshot.path);

  await driver.close();
  return issue;
}
```

### Workflow 2: UI Scan → Auto-Create Issues

```typescript
async function scanUIForIssues(url: string): Promise<GitHubIssue[]> {
  const issues: GitHubIssue[] = [];

  // 1. Capture screenshots of key pages
  const pages = [
    { path: '/', name: 'Homepage' },
    { path: '/login', name: 'Login' },
    { path: '/cart', name: 'Shopping Cart' },
    { path: '/checkout', name: 'Checkout' }
  ];

  for (const page of pages) {
    const pageUrl = `${url}${page.path}`;

    // 2. Capture across viewports
    const screenshots = await capturer.captureMultiple(pageUrl, [
      { width: 375, height: 667, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1920, height: 1080, name: 'desktop' }
    ]);

    // 3. AI visual analysis for each viewport
    for (const screenshot of screenshots) {
      const analysis = await visualAnalyzer.analyze(
        screenshot.buffer,
        'Identify visual bugs or issues: broken layout, cut-off text, overlapping elements, missing images, styling problems.'
      );

      // 4. Create issues for found problems
      if (analysis.issues && analysis.issues.length > 0) {
        for (const issue of analysis.issues) {
          const githubIssue = await githubClient.createIssue({
            title: `[UI Bug] ${issue} on ${page.name}`,
            body: generateUIBugBody(page, screenshot, issue),
            labels: ['bug', 'ui', 'auto-detected']
          });

          await githubClient.uploadAsset(githubIssue.number, screenshot.path);
          issues.push(githubIssue);
        }
      }
    }
  }

  return issues;
}
```

### Workflow 3: Visual Comparison (Before/After)

```typescript
async function compareUI(beforeUrl: string, afterUrl: string): Promise<VisualDifference[]> {
  const differences: VisualDifference[] = [];
  const pages = ['/login', '/cart', '/checkout'];

  for (const page of pages) {
    // Capture both versions
    const before = await capturer.capture({ url: `${beforeUrl}${page}` });
    const after = await capturer.capture({ url: `${afterUrl}${page}` });

    // AI comparison
    const comparison = await visualAnalyzer.compare(before.buffer, after.buffer);

    if (comparison.differences.length > 0) {
      differences.push({
        page,
        beforeUrl: `${beforeUrl}${page}`,
        afterUrl: `${afterUrl}${page}`,
        differences: comparison.differences,
        screenshots: { before, after }
      });

      // Create issue for regression
      await githubClient.createIssue({
        title: `[Visual Regression] ${page} has visual differences`,
        body: generateComparisonBody(page, comparison, before, after),
        labels: ['visual-regression', 'needs-review']
      });
    }
  }

  return differences;
}
```

---

## URL Inference from TODOs

### Strategy 1: File Path Analysis

```typescript
function inferPageUrl(todo: Todo, baseUrl: string): string {
  const file = todo.file.toLowerCase();

  // React/Next.js patterns
  if (file.includes('pages/') || file.includes('app/')) {
    // pages/cart/index.tsx → /cart
    // app/checkout/page.tsx → /checkout
    const match = file.match(/(?:pages|app)\/(.+?)(?:\/(?:index|page))?\.(tsx?|jsx?)/);
    if (match) {
      return `${baseUrl}/${match[1]}`;
    }
  }

  // Component patterns
  if (file.includes('components/')) {
    // components/Cart.tsx → /cart (guess)
    const match = file.match(/components\/(.+?)\.(tsx?|jsx?)/);
    if (match) {
      const component = match[1].toLowerCase();
      return `${baseUrl}/${component}`;
    }
  }

  // API routes
  if (file.includes('api/')) {
    // Skip API files, return homepage
    return baseUrl;
  }

  // Default: homepage
  return baseUrl;
}
```

### Strategy 2: TODO Content Analysis

```typescript
function inferFromContent(todo: Todo, baseUrl: string): string {
  const content = todo.content.toLowerCase();

  // Look for URL patterns
  const urlMatch = content.match(/\/([\w/-]+)/);
  if (urlMatch) {
    return `${baseUrl}${urlMatch[0]}`;
  }

  // Look for page names
  const pagePatterns: Record<string, string> = {
    'login': '/login',
    'cart': '/cart',
    'checkout': '/checkout',
    'dashboard': '/dashboard',
    'profile': '/profile',
    'settings': '/settings'
  };

  for (const [keyword, path] of Object.entries(pagePatterns)) {
    if (content.includes(keyword)) {
      return `${baseUrl}${path}`;
    }
  }

  return baseUrl;
}
```

### Strategy 3: Manual Mapping (url-mapping.json)

```json
{
  "urlMappings": [
    {
      "filePattern": "components/Cart.tsx",
      "url": "/cart"
    },
    {
      "filePattern": "pages/checkout/",
      "url": "/checkout"
    },
    {
      "todoPattern": "fix login",
      "url": "/login"
    }
  ]
}
```

---

## Issue Body Templates

### Template 1: Standard TODO with Screenshot

```markdown
## Description
{todo.content}

## Visual Evidence
![Screenshot]({screenshot.url})

**Captured**: {screenshot.capturedAt}
**Viewport**: Desktop (1920x1080)

## AI Analysis
{visualAnalysis.description}

**Detected Elements**:
- {visualAnalysis.elements.join('\n- ')}

**Potential Issues**:
- {visualAnalysis.issues.join('\n- ')}

## Location
**File**: {todo.file}:{todo.line}
**URL**: {pageUrl}

## Related
- Category: {todo.category}
- Priority: {todo.priority}
```

### Template 2: UI Bug Auto-Detection

```markdown
## Auto-Detected UI Issue

**Page**: {page.name}
**Issue**: {issue.description}
**Viewport**: {screenshot.viewport}

## Screenshot
![Bug Screenshot]({screenshot.url})

## AI Detection
This issue was automatically detected by visual analysis:
"{aiAnalysis}"

## Steps to Reproduce
1. Navigate to {pageUrl}
2. Resize viewport to {viewport.width}x{viewport.height}
3. Observe: {issue.description}

## Expected Behavior
{expectedBehavior}

## Actual Behavior
{actualBehavior}
```

### Template 3: Visual Regression

```markdown
## Visual Regression Detected

**Page**: {page}
**Environment Comparison**: Staging → Production

## Before (Staging)
![Before]({before.url})

## After (Production)
![After]({after.url})

## Differences Detected
{differences.map(d => `- ${d}`).join('\n')}

**Confidence**: {comparison.confidence}%

## Analysis
{aiAnalysis}

## Action Required
Review visual differences and determine if intentional or regression.

**URLs**:
- Staging: {beforeUrl}
- Production: {afterUrl}
```

---

## Screenshot Management

### Storage Strategy

```typescript
interface ScreenshotStorage {
  // Local storage
  localPath: string;         // .screenshots/cart-button-bug.png

  // GitHub attachment
  githubAssetUrl?: string;   // https://github.com/.../assets/123

  // Cloud storage (future)
  s3Url?: string;            // https://s3.../screenshots/...
}

class ScreenshotManager {
  /**
   * Save screenshot locally
   */
  async saveLocal(screenshot: Buffer, filename: string): Promise<string> {
    const dir = '.screenshots';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const path = `${dir}/${filename}`;
    fs.writeFileSync(path, screenshot);
    return path;
  }

  /**
   * Upload to GitHub as issue attachment
   */
  async uploadToGitHub(issueNumber: number, screenshotPath: string): Promise<string> {
    const content = fs.readFileSync(screenshotPath);
    const base64 = content.toString('base64');

    const response = await octokit.rest.repos.uploadReleaseAsset({
      owner,
      repo,
      issue_number: issueNumber,
      name: path.basename(screenshotPath),
      data: base64
    });

    return response.data.browser_download_url;
  }

  /**
   * Clean up old screenshots
   */
  async cleanup(olderThanDays: number = 7): Promise<void> {
    const dir = '.screenshots';
    const files = fs.readdirSync(dir);
    const cutoff = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);

    for (const file of files) {
      const filePath = `${dir}/${file}`;
      const stats = fs.statSync(filePath);

      if (stats.mtimeMs < cutoff) {
        fs.unlinkSync(filePath);
      }
    }
  }
}
```

### Filename Conventions

```typescript
function generateFilename(todo: Todo, viewport?: string): string {
  // Sanitize TODO content
  const sanitized = todo.content
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .substring(0, 50);

  const timestamp = Date.now();
  const viewportSuffix = viewport ? `-${viewport}` : '';

  return `${sanitized}${viewportSuffix}-${timestamp}.png`;
}

// Examples:
// "fix-cart-button-broken-desktop-1729548000000.png"
// "login-form-misaligned-mobile-1729548000000.png"
```

---

## Multi-Viewport Capture

### Responsive Screenshots

```typescript
const VIEWPORTS = {
  mobile: { width: 375, height: 667, name: 'iPhone SE' },
  tablet: { width: 768, height: 1024, name: 'iPad' },
  desktop: { width: 1920, height: 1080, name: 'Desktop' }
};

async function captureResponsive(url: string): Promise<ScreenshotSet> {
  const screenshots: Screenshot[] = [];

  for (const [key, viewport] of Object.entries(VIEWPORTS)) {
    const driver = new PlaywrightDriver();
    await driver.navigate({ url });
    await driver.page.setViewportSize({
      width: viewport.width,
      height: viewport.height
    });

    const screenshot = await capturer.capture({
      url,
      viewport,
      outputPath: `.screenshots/${key}.png`
    });

    screenshots.push({ ...screenshot, viewport: key });
    await driver.close();
  }

  return { url, screenshots };
}
```

### Responsive Issue Creation

```markdown
## Responsive Layout Issue

**Page**: Shopping Cart
**Issue**: Button cut off on mobile

### Mobile (375x667)
![Mobile]({mobile.url})
❌ Button not visible

### Tablet (768x1024)
![Tablet]({tablet.url})
⚠️ Button partially visible

### Desktop (1920x1080)
![Desktop]({desktop.url})
✅ Button fully visible

## Root Cause
CSS issue: Button has fixed width that doesn't adapt to small screens.

**Suggested Fix**: Use responsive units or media queries.
```

---

## AI Visual Analysis Prompts

### Prompt 1: General Issue Detection

```
Analyze this screenshot and identify any visual bugs or issues.

Look for:
- Broken layout (overlapping elements, misalignment)
- Cut-off text or buttons
- Missing images (broken image icons)
- Poor color contrast
- Inconsistent spacing
- Responsive design issues

For each issue found, provide:
1. Description of the problem
2. Location on screen (e.g., "top navigation", "footer")
3. Severity (critical, high, medium, low)
```

### Prompt 2: TODO-Specific Analysis

```
This screenshot shows the page related to the TODO: "{todo.content}"

Analyze the UI and identify:
1. Areas that might relate to this TODO
2. Any visible bugs or incomplete features
3. Elements that appear broken or need attention

Focus on elements mentioned or implied in the TODO text.
```

### Prompt 3: Before/After Comparison

```
Compare these two screenshots (before and after deployment).

Identify:
1. Visual differences between the two versions
2. Whether differences appear intentional (improvements) or regressions (bugs)
3. Specific elements that changed (colors, positions, sizes, visibility)

For each difference, categorize as:
- Improvement (intentional enhancement)
- Regression (unintended visual change)
- Neutral (unclear if intentional)
```

---

## Integration with Existing Manager

### Enhanced Issue Creator

```typescript
// In project-manager/src/core/issueCreator.ts

export interface IssueCreationOptions {
  dryRun?: boolean;
  labels?: string[];

  // NEW: Screenshot options
  withScreenshots?: boolean;
  productionUrl?: string;
  viewports?: string[]; // ['mobile', 'tablet', 'desktop']
  compareUrls?: { before: string; after: string };
}

export class IssueCreator {
  private githubClient: GitHubClient;
  private screenshotManager: ScreenshotManager; // NEW

  async createIssue(
    todo: Todo,
    options: IssueCreationOptions
  ): Promise<CreatedIssue> {
    let screenshots: Screenshot[] = [];

    // Capture screenshots if requested
    if (options.withScreenshots && options.productionUrl) {
      const pageUrl = inferPageUrl(todo, options.productionUrl);

      if (options.viewports && options.viewports.length > 1) {
        // Multi-viewport
        screenshots = await this.captureMultiViewport(pageUrl, options.viewports);
      } else {
        // Single screenshot
        const screenshot = await this.captureSingle(pageUrl);
        screenshots = [screenshot];
      }
    }

    // Create issue with screenshots
    const issue = await this.githubClient.createIssue({
      title: todo.content,
      body: this.generateIssueBody(todo, screenshots),
      labels: this.determineLabels(todo, options.labels)
    });

    // Upload screenshots as attachments
    for (const screenshot of screenshots) {
      await this.screenshotManager.uploadToGitHub(issue.number, screenshot.path);
    }

    return {
      issue,
      screenshots,
      todo
    };
  }
}
```

---

## Performance Optimization

### Lazy Screenshot Capture

```typescript
// Only capture screenshots for high-priority TODOs
async function shouldCaptureScreenshot(todo: Todo): Promise<boolean> {
  // Capture for P0/P1 only
  if (todo.priority === 'P0' || todo.priority === 'P1') {
    return true;
  }

  // Capture for UI-related TODOs
  if (todo.category === 'UI' || todo.type === 'BUG') {
    return true;
  }

  // Skip for backend/API TODOs
  if (todo.category === 'Backend' || todo.file.includes('/api/')) {
    return false;
  }

  return false;
}
```

### Concurrent Captures

```typescript
async function captureMultipleTodos(
  todos: Todo[],
  productionUrl: string
): Promise<Map<string, Screenshot>> {
  const screenshots = new Map<string, Screenshot>();

  // Capture 3 screenshots concurrently
  const batches = chunkArray(todos, 3);

  for (const batch of batches) {
    const results = await Promise.all(
      batch.map(async todo => {
        const url = inferPageUrl(todo, productionUrl);
        const screenshot = await captureSingle(url);
        return { todoId: todo.id, screenshot };
      })
    );

    for (const { todoId, screenshot } of results) {
      screenshots.set(todoId, screenshot);
    }
  }

  return screenshots;
}
```

---

## Testing Strategy

### Unit Tests

```typescript
describe('ScreenshotManager', () => {
  it('should capture screenshot', async () => {
    const screenshot = await manager.capture({ url: 'https://example.com' });
    expect(screenshot.buffer).toBeDefined();
    expect(screenshot.path).toContain('.screenshots');
  });

  it('should infer URL from TODO', () => {
    const todo = { file: 'pages/cart/index.tsx', content: 'Fix cart button' };
    const url = inferPageUrl(todo, 'https://myapp.com');
    expect(url).toBe('https://myapp.com/cart');
  });

  it('should generate valid filename', () => {
    const todo = { content: 'Fix broken button!', id: '123' };
    const filename = generateFilename(todo);
    expect(filename).toMatch(/^fix-broken-button-\d+\.png$/);
  });
});
```

### Integration Tests

```typescript
describe('Issue Creation with Screenshots', () => {
  it('should create issue with screenshot attachment', async () => {
    const issue = await creator.createIssue(mockTodo, {
      withScreenshots: true,
      productionUrl: 'https://example.com'
    });

    expect(issue.screenshots).toHaveLength(1);
    expect(issue.issue.body).toContain('![Screenshot]');
  });
});
```

---

## Roadmap

### Phase 1: Basic Screenshots (1 week)
- Import shared web viewer library
- Single screenshot capture per issue
- CLI: `--with-screenshots <url>`
- Upload to GitHub

### Phase 2: Multi-Viewport (1 week)
- Mobile/tablet/desktop screenshots
- Responsive issue detection
- CLI: `--viewports mobile,tablet,desktop`

### Phase 3: Visual Comparison (1 week)
- Before/after comparison
- Visual regression detection
- CLI: `compare-ui --before <url> --after <url>`

---

## Success Metrics

- ✅ 90%+ of issues have visual evidence
- ✅ 30% faster issue resolution (with screenshots vs without)
- ✅ 50% reduction in "can't reproduce" comments
- ✅ <5 seconds per screenshot capture

---

## Conclusion

Screenshot documentation transforms the Manager from "text issue creator" to "visual bug reporter":
- **Before**: "Button is broken" (vague, slow to resolve)
- **After**: "Button is cut off [see screenshot]" (clear, fast to fix)

This provides:
- ✅ Faster issue understanding
- ✅ Better bug reproduction
- ✅ Visual regression detection
- ✅ Responsive design validation
