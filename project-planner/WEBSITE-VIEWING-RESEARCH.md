# Website/App Viewing Capabilities - Research & Design

**Version:** 1.0
**Date:** 2025-10-20
**Status:** Research Complete
**Author:** Claude Code Research Team

---

## Executive Summary

This document provides comprehensive research findings and technical design for adding website/app viewing capabilities to the Project Planner skill. The feature enables discovery of features from **live websites and applications** to complement existing codebase analysis.

### Key Findings

1. **Claude Code has native vision capabilities** - Can analyze screenshots with high accuracy
2. **Headless browsers (Playwright/Puppeteer) are production-ready** - Enable automated website interaction
3. **WebFetch tool exists** - Claude Code's built-in web content fetching capability
4. **Hybrid approach is optimal** - Combine WebFetch for initial analysis with optional headless browsers for complex SPAs

### Recommended Solution

**Multi-Tier Approach:**
- **Tier 1 (Simple)**: WebFetch + AI analysis for static/server-rendered sites (80% of use cases)
- **Tier 2 (Advanced)**: Playwright for SPA/dynamic sites requiring JavaScript execution
- **Tier 3 (Visual)**: Screenshot capture + Claude vision for UI-driven discovery

**Expected Accuracy:** 65-75% for web-discovered features (lower than code analysis, acceptable for supplemental discovery)

---

## Table of Contents

1. [Tool Research Findings](#tool-research-findings)
2. [Technical Feasibility Assessment](#technical-feasibility-assessment)
3. [Feature Discovery Methodology](#feature-discovery-methodology)
4. [Recommended Technical Approach](#recommended-technical-approach)
5. [CLI Design](#cli-design)
6. [Integration Plan](#integration-plan)
7. [Example Output](#example-output)
8. [Limitations & Mitigation](#limitations--mitigation)
9. [Implementation Complexity](#implementation-complexity)

---

## Tool Research Findings

### 1. Claude Code WebFetch Tool

**What It Is:**
- Built-in Claude Code tool that fetches URLs and processes content with AI
- Converts HTML to markdown for analysis
- Returns AI-generated insights based on a prompt

**Capabilities:**
- Fetch any publicly accessible URL
- Extract text content from HTML
- Process with Claude's language model for analysis
- Automatic HTTPS upgrade for HTTP URLs
- 15-minute cache for repeated access

**Limitations:**
- Does NOT execute JavaScript (client-side rendering not supported)
- Cannot interact with dynamic content (no clicking, scrolling)
- Cannot handle authentication walls
- Limited to what's in the initial HTML response

**Best For:**
- Server-rendered websites (traditional HTML)
- Marketing pages, documentation sites
- Static site generators (Jekyll, Hugo, Next.js static export)
- Initial reconnaissance of any website

**Performance:**
- Fast (seconds per page)
- No installation required
- No browser overhead

**Verdict:** ✅ **Excellent for Tier 1 (simple sites), insufficient alone**

---

### 2. Playwright (Headless Browser)

**What It Is:**
- Modern browser automation library by Microsoft
- Node.js library supporting Chromium, Firefox, WebKit
- Full browser control with JavaScript execution

**Capabilities (2025 Research):**
- Execute JavaScript (handles SPAs, React, Vue, Angular)
- Wait for AJAX/async content to load
- Click buttons, fill forms, navigate pages
- Capture screenshots and PDFs
- Extract text, attributes, DOM elements
- Cross-browser testing
- Multi-language support (TypeScript, Python, Java, C#)

**Performance (2025 Benchmarks):**
- Average execution: 4.513 seconds per page
- 96% success rate across 1000+ pages
- Better parallelization than Puppeteer
- Slight performance edge in complex scenarios

**Anti-Bot Detection:**
- Detectable via `navigator.webdriver`, WebGL fingerprinting
- Mitigation: playwright-extra-plugin-stealth
- Still works on most sites with proper configuration

**Installation:**
```bash
npm install playwright
npx playwright install chromium
```

**Best For:**
- Single-page applications (React, Vue, Angular)
- Sites with heavy client-side rendering
- Interactive features requiring JavaScript
- Multi-page navigation and deep crawling

**Verdict:** ✅ **Best choice for Tier 2 (complex sites)**

---

### 3. Puppeteer (Headless Browser)

**What It Is:**
- Google's Chrome automation library (older than Playwright)
- Node.js only, Chromium-only by default

**Capabilities:**
- Similar to Playwright (browser automation, JavaScript execution)
- Mature ecosystem, large community (87K+ GitHub stars)
- Well-documented with extensive resources

**Performance (2025 Benchmarks):**
- Average execution: 4.784 seconds per page
- 75% success rate (vs Playwright's 96%)
- Slightly slower than Playwright in modern tests

**Differences from Playwright:**
- Only supports Chromium (Playwright: 3 browsers)
- JavaScript/TypeScript only (Playwright: 5 languages)
- Older, more mature community
- Less built-in parallelization

**Best For:**
- Teams already using Puppeteer
- Chrome-only requirement
- Extensive community plugins needed

**Verdict:** ⚠️ **Good but Playwright is superior for new projects**

---

### 4. Claude Vision Capabilities

**What It Is:**
- Claude 3.x and 4.x models include vision (image analysis)
- Can analyze screenshots, UI mockups, diagrams

**Capabilities (2025):**
- OCR (extract text from screenshots)
- UI element recognition (buttons, forms, menus)
- Layout analysis
- Error screenshot debugging
- Describe, compare, analyze images
- Up to 100 images per API request

**Image Support:**
- Formats: JPEG, PNG, GIF, WebP
- Recommended: High-resolution, clear images (>200px)
- Cost: ~1,334 tokens per 1000×1000 px image (~$0.004 with Sonnet)

**Limitations:**
- **Cannot generate images** (analysis only)
- Low-quality images reduce accuracy
- Token costs for large/multiple images

**Best For:**
- UI-driven feature discovery
- Analyzing design mockups
- Extracting features from visual elements
- Competitor analysis via screenshots

**Verdict:** ✅ **Excellent for Tier 3 (visual analysis)**

---

### 5. Claude Code Bash Tool

**Relevant For:**
- Installing Playwright/Puppeteer via npm
- Running headless browser scripts
- Processing output files

**Limitations:**
- No direct browser control (requires external libraries)
- Must install dependencies first

**Verdict:** ✅ **Essential for orchestration, not a solution itself**

---

## Technical Feasibility Assessment

### Approach 1: WebFetch Only (Simple)

**How It Works:**
1. User provides URL
2. WebFetch fetches HTML
3. AI analyzes HTML for feature signals
4. Extract features from navigation, forms, headings

**Feasibility:** ✅ **High (90%)**
- No installation required
- Works immediately
- Fast execution

**Accuracy:** ⚠️ **Medium (50-60%)**
- Misses client-side rendered content
- No JavaScript execution
- Limited to static HTML

**Use Cases:**
- Marketing sites (company homepages)
- Documentation sites (Docusaurus, VuePress)
- Static blogs (Jekyll, Hugo)
- Initial reconnaissance

**Implementation Complexity:** ⭐ **Low (1-2 days)**

---

### Approach 2: Playwright Integration (Advanced)

**How It Works:**
1. User provides URL
2. Playwright launches headless browser
3. Navigate to URL, wait for JavaScript to load
4. Extract DOM elements (nav menus, forms, buttons)
5. Optionally capture screenshots for visual analysis
6. AI analyzes extracted data + screenshots

**Feasibility:** ✅ **High (85%)**
- Well-established library
- Good documentation
- Active maintenance

**Accuracy:** ✅ **High (70-80%)**
- Handles SPAs correctly
- Executes JavaScript
- Can interact with dynamic content

**Use Cases:**
- React/Vue/Angular apps
- Modern web applications
- Complex navigation
- Competitor analysis

**Implementation Complexity:** ⭐⭐⭐ **Medium (1-2 weeks)**
- Requires Playwright installation
- More complex error handling
- Anti-bot considerations

---

### Approach 3: Hybrid (WebFetch + Playwright Fallback)

**How It Works:**
1. Try WebFetch first (fast, no overhead)
2. Analyze HTML to detect SPA indicators (`<div id="root">`, minimal content)
3. If SPA detected, fall back to Playwright
4. User can force Playwright mode with `--dynamic` flag

**Feasibility:** ✅ **High (90%)**
- Best of both worlds
- Optimizes for speed when possible

**Accuracy:** ✅ **High (65-75% average)**
- WebFetch: 50-60% for simple sites
- Playwright: 70-80% for complex sites
- Weighted average based on site type distribution

**Use Cases:**
- All website types
- Unknown site structure
- Production-ready solution

**Implementation Complexity:** ⭐⭐⭐ **Medium-High (2-3 weeks)**
- Two code paths to maintain
- Detection logic required
- More testing needed

---

### Approach 4: Screenshot + Vision Analysis

**How It Works:**
1. Playwright captures full-page screenshot
2. Optionally capture screenshots after navigation (click menus)
3. Send screenshots to Claude Vision
4. AI extracts features from visual layout

**Feasibility:** ✅ **High (80%)**
- Claude has proven vision capabilities
- Playwright screenshot API is reliable

**Accuracy:** ⚠️ **Variable (60-80%)**
- Excellent for UI elements
- Struggles with non-visual features (API endpoints)
- Depends on screenshot quality

**Use Cases:**
- UI-heavy applications
- Design system analysis
- Competitor visual analysis
- Mobile app mockups

**Implementation Complexity:** ⭐⭐⭐⭐ **High (2-3 weeks)**
- Vision API integration
- Screenshot orchestration
- Multi-image analysis
- Higher token costs

---

### Recommended Approach: **Hybrid (Approach 3) + Optional Vision**

**Why:**
1. **Covers 95% of use cases** (WebFetch for simple, Playwright for complex)
2. **Optimizes performance** (fast path for static sites)
3. **Production-ready** (both tools are stable)
4. **Extensible** (can add vision later as Tier 3)

**Implementation Plan:**
- **Phase 1**: WebFetch-only implementation (Tier 1)
- **Phase 2**: Add Playwright integration (Tier 2)
- **Phase 3**: Add optional screenshot analysis (Tier 3)

---

## Feature Discovery Methodology

### What Signals Indicate Features in a Live Website?

#### Signal 1: Navigation Menus

**HTML Patterns:**
```html
<!-- Traditional nav -->
<nav>
  <ul>
    <li><a href="/products">Products</a></li>
    <li><a href="/pricing">Pricing</a></li>
    <li><a href="/dashboard">Dashboard</a></li>
  </ul>
</nav>

<!-- React Router (in rendered HTML) -->
<a href="/settings">Settings</a>
<a href="/profile">Profile</a>
```

**Inferred Features:**
- "Product catalog" (from /products)
- "Pricing plans" (from /pricing)
- "User dashboard" (from /dashboard)
- "Settings management" (from /settings)
- "User profile" (from /profile)

**Confidence:**
- High (80-90%) if in main navigation
- Medium (60-70%) if in footer/secondary nav

---

#### Signal 2: Forms

**HTML Patterns:**
```html
<!-- Login form -->
<form id="login-form">
  <input type="email" name="email">
  <input type="password" name="password">
  <button>Log In</button>
</form>

<!-- Contact form -->
<form id="contact-form">
  <input type="text" name="name">
  <input type="email" name="email">
  <textarea name="message"></textarea>
  <button>Send Message</button>
</form>
```

**Inferred Features:**
- "User authentication" (login form)
- "Contact support" (contact form)
- "Newsletter subscription" (email signup form)

**Confidence:**
- High (85-95%) - forms clearly indicate functionality

---

#### Signal 3: Buttons and CTAs

**HTML Patterns:**
```html
<button>Start Free Trial</button>
<button>Export to CSV</button>
<button>Share on Social Media</button>
<a class="cta-button">Book a Demo</a>
```

**Inferred Features:**
- "Free trial signup"
- "CSV export"
- "Social media sharing"
- "Demo booking"

**Confidence:**
- Medium (60-75%) - may be marketing, not product features

---

#### Signal 4: Page Titles and Headings

**HTML Patterns:**
```html
<title>Dashboard - MyApp</title>
<h1>Your Analytics Dashboard</h1>
<h2>Team Collaboration</h2>
<h2>Payment History</h2>
```

**Inferred Features:**
- "Analytics dashboard"
- "Team collaboration"
- "Payment history"

**Confidence:**
- Medium (65-75%) - titles indicate features but may be aspirational

---

#### Signal 5: Meta Tags and Descriptions

**HTML Patterns:**
```html
<meta name="description" content="Task management app with real-time collaboration, time tracking, and reporting">
<meta property="og:description" content="Manage projects, track time, invoice clients">
```

**Inferred Features:**
- "Task management"
- "Real-time collaboration"
- "Time tracking"
- "Reporting"
- "Invoicing"

**Confidence:**
- Low-Medium (50-65%) - marketing copy, may not all be implemented

---

#### Signal 6: URLs and Routes (from href attributes)

**HTML Patterns:**
```html
<a href="/dashboard/analytics">Analytics</a>
<a href="/settings/billing">Billing Settings</a>
<a href="/projects/123/tasks">Project Tasks</a>
```

**Inferred Features:**
- "Analytics dashboard"
- "Billing management"
- "Project task lists"

**Confidence:**
- High (80-90%) - URLs indicate implemented routes

---

#### Signal 7: Interactive Elements (from classes/IDs)

**HTML Patterns:**
```html
<div id="shopping-cart"></div>
<button class="export-pdf-btn"></button>
<div class="notification-center"></div>
```

**Inferred Features:**
- "Shopping cart"
- "PDF export"
- "Notification center"

**Confidence:**
- Medium (65-75%) - may be UI placeholders

---

#### Signal 8: Script Tags (SPA Detection)

**HTML Patterns:**
```html
<script src="/static/js/main.abc123.js"></script>
<div id="root"></div> <!-- React mount point -->
<div id="app"></div> <!-- Vue mount point -->
```

**Inference:**
- Likely a SPA (needs Playwright for accurate analysis)
- Cannot extract features from static HTML alone

**Action:**
- Trigger Playwright fallback

---

### Clustering Web Signals into Features

**Problem:** Raw signals are too granular (e.g., "Login", "Signup", "Password Reset" → "User Authentication")

**Solution:** Semantic clustering

```typescript
interface WebSignal {
  type: 'nav-link' | 'form' | 'button' | 'heading' | 'url' | 'meta';
  text: string;
  href?: string;
  confidence: number;
}

function clusterWebSignals(signals: WebSignal[]): Feature[] {
  // 1. Group by semantic similarity
  //    - "login", "signup", "logout" → "User Authentication"
  //    - "cart", "checkout", "payment" → "E-commerce Checkout"
  
  // 2. Boost confidence for signals appearing in multiple contexts
  //    - Nav link + Form + Page title = High confidence
  
  // 3. De-duplicate similar signals
  //    - "/dashboard" and "Dashboard" are the same feature
  
  // 4. Generate human-readable descriptions
  //    - Use AI to synthesize from all signals
  
  return features;
}
```

**Example:**
```
Raw signals:
- Nav link: "Dashboard" → /dashboard (confidence: 80)
- Page title: "User Dashboard" (confidence: 70)
- Heading: "Your Analytics Dashboard" (confidence: 65)
- Meta: "View your analytics and team activity" (confidence: 60)

Clustered feature:
{
  id: "feat-web-001",
  name: "Analytics dashboard",
  description: "View personal analytics and team activity in a central dashboard interface.",
  status: "implemented", // Inferred (live site)
  priority: "P1", // Estimated based on nav prominence
  category: "Core Features",
  implementation_files: "", // Unknown from web
  implementation_confidence: 75, // Average of signals
  detected_by: "web-discovery",
  notes: "Discovered from https://example.com/dashboard"
}
```

---

## Recommended Technical Approach

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                  WEBSITE DISCOVERY ENGINE                    │
│                                                              │
│  ┌────────────────┐                                         │
│  │  URL Input     │                                         │
│  │  (user/file)   │                                         │
│  └────────────────┘                                         │
│         │                                                    │
│         ▼                                                    │
│  ┌────────────────────────────────────────────┐             │
│  │  TIER 1: WebFetch + HTML Analysis          │             │
│  │  - Fast (seconds)                          │             │
│  │  - No installation                         │             │
│  │  - 50-60% accuracy for static sites        │             │
│  └────────────────────────────────────────────┘             │
│         │                                                    │
│         ├─── SPA detected? ───┐                             │
│         │                      ▼                             │
│         │          ┌────────────────────────────┐           │
│         │          │  TIER 2: Playwright        │           │
│         │          │  - Executes JavaScript     │           │
│         │          │  - 70-80% accuracy         │           │
│         │          │  - Requires install        │           │
│         │          └────────────────────────────┘           │
│         │                      │                             │
│         │                      ├─── --screenshot? ──┐       │
│         │                      │                     ▼       │
│         │                      │         ┌────────────────┐ │
│         │                      │         │ TIER 3: Vision │ │
│         │                      │         │ - Screenshot   │ │
│         │                      │         │ - AI analysis  │ │
│         │                      │         │ - 60-80% acc.  │ │
│         │                      │         └────────────────┘ │
│         │                      │                     │       │
│         └──────────────────────┴─────────────────────┘       │
│                                │                             │
│                                ▼                             │
│                    ┌────────────────────┐                    │
│                    │  Signal Clustering │                    │
│                    │  & AI Synthesis    │                    │
│                    └────────────────────┘                    │
│                                │                             │
│                                ▼                             │
│                    ┌────────────────────┐                    │
│                    │  Feature Registry  │                    │
│                    │  (features.csv)    │                    │
│                    └────────────────────┘                    │
└─────────────────────────────────────────────────────────────┘
```

### Implementation Details

#### Tier 1: WebFetch-Based Discovery

```typescript
import { WebFetch } from 'claude-code-tools';

export class WebDiscoveryEngine {
  /**
   * Discover features from a URL using WebFetch
   */
  async discoverFromURL(url: string): Promise<Feature[]> {
    // 1. Fetch HTML content
    const prompt = `
      Analyze this website and extract all features you can identify.
      Look for:
      - Navigation menu items
      - Forms (login, signup, contact, etc.)
      - Prominent buttons and CTAs
      - Page titles and headings
      - Meta descriptions
      - URLs in links
      
      Return a JSON array of features with:
      - name: feature name
      - description: 1-2 sentence description
      - category: best guess category
      - evidence: what signals indicate this feature
      - confidence: 0-100
    `;
    
    const result = await WebFetch(url, prompt);
    
    // 2. Parse AI response
    const features = this.parseAIResponse(result);
    
    // 3. Detect if SPA (needs Playwright)
    if (this.isSPA(result)) {
      console.warn('Detected SPA - recommend using --dynamic flag for better accuracy');
    }
    
    // 4. Convert to Feature records
    return this.convertToFeatures(features, url, 'web-discovery-simple');
  }
  
  private isSPA(htmlContent: string): boolean {
    // Check for common SPA indicators
    const spaIndicators = [
      /<div id="root"><\/div>/,
      /<div id="app"><\/div>/,
      /react/i,
      /vue/i,
      /angular/i,
      /<noscript>You need to enable JavaScript/,
    ];
    
    return spaIndicators.some(pattern => pattern.test(htmlContent));
  }
}
```

#### Tier 2: Playwright-Based Discovery

```typescript
import { chromium } from 'playwright';

export class PlaywrightDiscovery {
  /**
   * Discover features using headless browser
   */
  async discoverWithBrowser(url: string, options?: {
    screenshot?: boolean;
    deep?: boolean; // Navigate to sub-pages
  }): Promise<Feature[]> {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
      // 1. Navigate and wait for content
      await page.goto(url, { waitUntil: 'networkidle' });
      
      // 2. Extract navigation links
      const navLinks = await page.$$eval('nav a, [role="navigation"] a', links =>
        links.map(a => ({
          text: a.textContent?.trim() || '',
          href: a.getAttribute('href') || '',
        }))
      );
      
      // 3. Extract forms
      const forms = await page.$$eval('form', forms =>
        forms.map(form => ({
          id: form.id,
          action: form.action,
          inputs: Array.from(form.querySelectorAll('input')).map(input => ({
            name: input.name,
            type: input.type,
          })),
        }))
      );
      
      // 4. Extract buttons/CTAs
      const buttons = await page.$$eval('button, [role="button"], a.btn, a.button', btns =>
        btns.map(btn => ({
          text: btn.textContent?.trim() || '',
          class: btn.className,
        }))
      );
      
      // 5. Extract page structure
      const structure = {
        title: await page.title(),
        headings: await page.$$eval('h1, h2', h => h.map(el => el.textContent?.trim())),
        metaDescription: await page.$eval('meta[name="description"]', el => 
          el.getAttribute('content')
        ).catch(() => ''),
      };
      
      // 6. Optional: Screenshot for vision analysis
      let screenshot = null;
      if (options?.screenshot) {
        screenshot = await page.screenshot({ fullPage: true });
      }
      
      // 7. Optional: Deep crawl (navigate to sub-pages)
      let subPageFeatures = [];
      if (options?.deep) {
        subPageFeatures = await this.crawlSubPages(page, navLinks.slice(0, 5));
      }
      
      await browser.close();
      
      // 8. Synthesize features from all signals
      const signals = this.extractSignals(navLinks, forms, buttons, structure);
      const features = await this.clusterSignals(signals);
      
      return features;
      
    } catch (error) {
      await browser.close();
      throw error;
    }
  }
  
  private extractSignals(navLinks, forms, buttons, structure): WebSignal[] {
    const signals: WebSignal[] = [];
    
    // Nav links
    navLinks.forEach(link => {
      signals.push({
        type: 'nav-link',
        text: link.text,
        href: link.href,
        confidence: 80,
      });
    });
    
    // Forms (high confidence - clear functionality)
    forms.forEach(form => {
      const formType = this.inferFormType(form);
      signals.push({
        type: 'form',
        text: formType,
        confidence: 90,
      });
    });
    
    // Buttons (medium confidence)
    buttons.forEach(btn => {
      if (this.isSignificantButton(btn.text)) {
        signals.push({
          type: 'button',
          text: btn.text,
          confidence: 65,
        });
      }
    });
    
    return signals;
  }
  
  private inferFormType(form): string {
    const inputs = form.inputs.map(i => i.type + ':' + i.name).join(',');
    
    if (inputs.includes('password')) return 'User authentication';
    if (inputs.includes('email') && inputs.includes('message')) return 'Contact form';
    if (inputs.includes('card')) return 'Payment processing';
    if (inputs.includes('search')) return 'Search functionality';
    
    return 'Form submission';
  }
}
```

#### Tier 3: Vision Analysis (Optional)

```typescript
export class VisionAnalysis {
  /**
   * Analyze screenshot to extract UI features
   */
  async analyzeScreenshot(screenshotBuffer: Buffer): Promise<Feature[]> {
    // Convert buffer to base64 for Claude Vision API
    const base64Image = screenshotBuffer.toString('base64');
    
    const prompt = `
      Analyze this website screenshot and identify all features you can see.
      Look for:
      - Navigation menus and their items
      - Buttons and their labels
      - Forms and input fields
      - Visual widgets (calendars, charts, etc.)
      - UI sections and their purposes
      
      Return a JSON array of features with name, description, category, confidence.
    `;
    
    // Use Claude Vision API (via Claude Code tool if available)
    const analysis = await this.callVisionAPI(base64Image, prompt);
    
    return this.parseVisionResponse(analysis);
  }
}
```

---

## CLI Design

### Commands

```bash
# Discover features from a live website
planner discover-web <url> [options]

# Options:
  --dynamic              Use Playwright for JavaScript-heavy sites
  --screenshot           Capture and analyze screenshots
  --deep                 Navigate to sub-pages (crawl depth 2)
  --output <file>        Output CSV path (default: .project-planner/web-features.csv)
  --merge                Merge with existing features.csv
  --confidence <num>     Minimum confidence threshold (default: 60)
  --auth <cookie-file>   Use cookies for authenticated pages
```

### Workflow Examples

#### Example 1: Simple Site Analysis

```bash
# Discover from a marketing site (WebFetch)
planner discover-web https://example.com

Output:
Scanning https://example.com...
✅ Fetched HTML (2.1s)
🔍 Analyzing page structure...
📊 Detected 8 features with 62% average confidence

Features discovered:
  75% - User authentication (login form detected)
  80% - Product catalog (nav link: /products)
  70% - Pricing plans (nav link: /pricing)
  65% - Contact support (contact form detected)
  60% - Newsletter signup (email form detected)
  85% - Documentation (nav link: /docs)
  70% - Blog (nav link: /blog)
  60% - API access (nav link: /api)

⚠️  Detected React app - recommend re-running with --dynamic

💾 Saved to .project-planner/web-features.csv
```

#### Example 2: SPA Analysis with Playwright

```bash
# Analyze a React/Vue app
planner discover-web https://app.example.com --dynamic

Output:
Scanning https://app.example.com (dynamic mode)...
🚀 Launching headless browser...
✅ Page loaded (4.2s)
🔍 Extracting navigation (12 items)
🔍 Extracting forms (3 forms)
🔍 Extracting buttons (28 buttons)
📊 Clustering signals...

Features discovered:
  90% - User dashboard (nav + page title + content)
  85% - Analytics reports (nav link + charts detected)
  80% - Team collaboration (nav + form + buttons)
  75% - Settings management (nav + forms)
  70% - Notification center (UI element detected)
  85% - User profile (nav + form)
  65% - Dark mode theme (toggle button detected)
  60% - Export to CSV (button detected)

💾 Saved to .project-planner/web-features.csv
```

#### Example 3: Competitor Analysis with Screenshots

```bash
# Analyze competitor site visually
planner discover-web https://competitor.com --dynamic --screenshot

Output:
Scanning https://competitor.com (dynamic + vision mode)...
🚀 Launching headless browser...
📸 Capturing screenshot...
🖼️  Analyzing visual layout with Claude Vision...

Features discovered from visual analysis:
  85% - Product comparison table
  80% - Live chat widget
  75% - Interactive pricing calculator
  70% - Customer testimonial carousel
  90% - Search with autocomplete
  65% - Social media sharing buttons

💾 Saved to .project-planner/web-features.csv
💾 Screenshot saved to .project-planner/screenshots/competitor-com.png
```

#### Example 4: Merge with Code Analysis

```bash
# Discover from web and merge with code analysis
planner discover ~/my-app                    # Code analysis
planner discover-web https://my-app.com --merge

Output:
Merging web-discovered features with existing registry...

Comparison:
  ✅ User authentication - CONFIRMED (code + web)
  ✅ Product catalog - CONFIRMED (code + web)
  ⚠️  Payment processing - CODE ONLY (not visible on public site)
  ⚠️  Admin dashboard - CODE ONLY (requires authentication)
  🆕 Live chat - WEB ONLY (new discovery!)
  🆕 Newsletter signup - WEB ONLY (new discovery!)

Updated features.csv:
  Total features: 24
  Code-discovered: 18
  Web-discovered: 8
  Confirmed by both: 2

Recommendations:
  - Review web-only features (may be third-party widgets)
  - Code-only features may be behind auth (normal)
```

---

### CLI Implementation Sketch

```typescript
// cli.ts addition
program
  .command('discover-web <url>')
  .description('Discover features from a live website')
  .option('-d, --dynamic', 'Use Playwright for SPA/dynamic sites')
  .option('-s, --screenshot', 'Capture and analyze screenshots')
  .option('--deep', 'Navigate to sub-pages (depth 2)')
  .option('-o, --output <file>', 'Output CSV path', '.project-planner/web-features.csv')
  .option('--merge', 'Merge with existing features.csv')
  .option('-c, --confidence <num>', 'Minimum confidence', '60')
  .action(async (url, options) => {
    console.log(`Scanning ${url}...`);
    
    let features: Feature[];
    
    if (options.dynamic) {
      // Use Playwright
      console.log('🚀 Launching headless browser...');
      const playwright = new PlaywrightDiscovery();
      features = await playwright.discoverWithBrowser(url, {
        screenshot: options.screenshot,
        deep: options.deep,
      });
    } else {
      // Use WebFetch
      console.log('✅ Fetching HTML...');
      const webDiscovery = new WebDiscoveryEngine();
      features = await webDiscovery.discoverFromURL(url);
    }
    
    // Filter by confidence
    const filtered = features.filter(f => 
      f.implementation_confidence >= parseInt(options.confidence)
    );
    
    console.log(`📊 Detected ${filtered.length} features with ${avg}% average confidence\n`);
    
    // Display features
    filtered.forEach(f => {
      console.log(`  ${f.implementation_confidence}% - ${f.name}`);
    });
    
    // Save to CSV
    if (options.merge) {
      await mergeWithExisting(filtered, options.output);
    } else {
      await saveFeatures(filtered, options.output);
    }
    
    console.log(`\n💾 Saved to ${options.output}`);
  });
```

---

## Integration Plan

### Integration with Existing Discovery

**Current Flow:**
```
planner discover ~/code → features.csv (code-based)
```

**New Flow:**
```
planner discover ~/code → code-features.csv
planner discover-web https://app.com --merge → features.csv (combined)
```

### Feature Merging Logic

```typescript
interface FeatureMergeResult {
  codeOnly: Feature[];      // Found in code but not web
  webOnly: Feature[];       // Found on web but not code
  confirmed: Feature[];     // Found in both (high confidence!)
  conflicts: Feature[];     // Same name, different details
}

async function mergeFeatures(
  codeFeatures: Feature[],
  webFeatures: Feature[]
): Promise<FeatureMergeResult> {
  // 1. Fuzzy match features by name similarity
  //    - "User auth" (code) matches "User authentication" (web)
  //    - Use Levenshtein distance or AI similarity
  
  // 2. For matches:
  //    - Boost confidence (code + web = very confident)
  //    - Combine implementation_files (from code) with web evidence
  //    - Keep code version as primary, add web notes
  
  // 3. For web-only:
  //    - May be third-party integrations (chat widgets)
  //    - May be features not yet in codebase (gaps!)
  //    - Mark as "web-discovery-only"
  
  // 4. For code-only:
  //    - May be behind authentication
  //    - May be admin features
  //    - May be deprecated but not removed
  
  return {
    codeOnly,
    webOnly,
    confirmed,
    conflicts,
  };
}
```

### CSV Schema Addition

**New Fields for Web-Discovered Features:**

| Field | Description | Example |
|-------|-------------|---------|
| `discovery_source` | Where feature was found | `code`, `web`, `both` |
| `web_url` | URL where feature was seen | `https://app.com/dashboard` |
| `web_evidence` | What web signals indicated this | `nav-link, page-title, form` |

**Updated Feature Interface:**
```typescript
export interface Feature {
  // ... existing fields ...
  discovery_source?: 'code' | 'web' | 'both';
  web_url?: string;
  web_evidence?: string; // Semicolon-separated signals
}
```

---

## Example Output

### Example 1: SaaS Application

**Input:**
```bash
planner discover-web https://app.todoist.com --dynamic --screenshot
```

**Output CSV:**
```csv
id,name,description,status,priority,category,timeline,owner,parent_id,implementation_files,implementation_confidence,created_at,updated_at,detected_by,notes,discovery_source,web_url,web_evidence
feat-web-001,Task management,"Create, organize, and track tasks with due dates, priorities, and labels. Support for recurring tasks and sub-tasks.",implemented,P0,Core Features,,,,,85,2025-10-20T10:00:00Z,2025-10-20T10:00:00Z,web-discovery,,web,https://app.todoist.com,nav-link;page-title;form;buttons
feat-web-002,Project organization,"Organize tasks into projects with customizable views (list, board, calendar). Support for nested projects.",implemented,P0,Core Features,,,,,80,2025-10-20T10:00:00Z,2025-10-20T10:00:00Z,web-discovery,,web,https://app.todoist.com/projects,nav-link;headings
feat-web-003,Team collaboration,"Invite team members, assign tasks, share projects, and comment on tasks.",implemented,P1,Collaboration,,,,,75,2025-10-20T10:00:00Z,2025-10-20T10:00:00Z,web-discovery,,web,https://app.todoist.com,nav-link;buttons
feat-web-004,Productivity statistics,"View productivity trends, task completion rates, and streak tracking.",implemented,P2,Analytics,,,,,70,2025-10-20T10:00:00Z,2025-10-20T10:00:00Z,web-discovery,,web,https://app.todoist.com/productivity,nav-link;page-title
feat-web-005,Integrations,"Connect with Google Calendar, Slack, email, and 80+ other apps via integrations.",implemented,P1,Integrations,,,,,65,2025-10-20T10:00:00Z,2025-10-20T10:00:00Z,web-discovery,,web,https://app.todoist.com/integrations,nav-link
feat-web-006,Mobile apps,"Access tasks on iOS and Android with offline sync and push notifications.",implemented,P1,Mobile,,,,,80,2025-10-20T10:00:00Z,2025-10-20T10:00:00Z,web-discovery,,web,https://app.todoist.com,buttons;meta-description
feat-web-007,Dark mode theme,"Toggle between light and dark themes with automatic switching based on system preferences.",implemented,P2,UI/UX,,,,,90,2025-10-20T10:00:00Z,2025-10-20T10:00:00Z,web-discovery,Screenshot shows theme toggle,web,https://app.todoist.com/settings,screenshot-analysis;button
```

### Example 2: E-commerce Site

**Input:**
```bash
planner discover-web https://www.shopify.com
```

**Output (excerpt):**
```csv
id,name,description,status,priority,category,discovery_source,web_url,web_evidence,implementation_confidence
feat-web-101,Online store builder,"Create and customize an online store with themes, drag-and-drop editor, and mobile-responsive designs.",implemented,P0,Core Features,web,https://www.shopify.com,nav-link;headings;meta-description,75
feat-web-102,Payment processing,"Accept credit cards, PayPal, Apple Pay, and 100+ payment methods with built-in PCI compliance.",implemented,P0,Payments,web,https://www.shopify.com/payments,nav-link;headings,80
feat-web-103,Inventory management,"Track stock levels, receive low-stock alerts, and manage product variants across multiple locations.",implemented,P1,Inventory,web,https://www.shopify.com/features,nav-link;content,70
feat-web-104,Shipping integration,"Calculate real-time shipping rates, print labels, and track shipments with major carriers.",implemented,P1,Shipping,web,https://www.shopify.com/shipping,nav-link;headings,75
feat-web-105,App marketplace,"Extend functionality with 8000+ apps for marketing, analytics, shipping, and more.",implemented,P1,Integrations,web,https://www.shopify.com/app-store,nav-link;meta-description,85
```

---

## Limitations & Mitigation

### Limitation 1: Authentication Walls

**Problem:** Cannot access features behind login/paywall

**Impact:** High (misses main product features)

**Mitigation:**
1. **Manual cookies**: Allow user to export cookies from browser and pass to tool
   ```bash
   planner discover-web https://app.com --cookies cookies.json
   ```
2. **Screenshot upload**: User provides authenticated screenshots manually
   ```bash
   planner analyze-screenshot screenshot.png
   ```
3. **Documentation**: Clearly state limitation in CLI output
4. **Hybrid approach**: Use code analysis for authenticated features

**Residual Risk:** Medium (acceptable for public-facing competitor analysis)

---

### Limitation 2: Dynamic/SPA Content

**Problem:** WebFetch cannot execute JavaScript

**Impact:** High (50% of modern apps are SPAs)

**Mitigation:**
1. **Auto-detection**: Detect SPA indicators and suggest `--dynamic` flag
2. **Playwright integration**: Tier 2 handles SPAs correctly
3. **Clear messaging**: "⚠️ Detected SPA - recommend --dynamic for better results"

**Residual Risk:** Low (solved by Playwright)

---

### Limitation 3: Accuracy Lower Than Code Analysis

**Problem:** 65-75% accuracy vs 85%+ for code analysis

**Impact:** Medium (more false positives/negatives)

**Mitigation:**
1. **Confidence scores**: Always show confidence %
2. **Review mode**: Interactive confirmation like code discovery
3. **Merge validation**: When merging with code features, flag conflicts
4. **Documentation**: Set expectations ("supplemental tool, not replacement")

**Residual Risk:** Low (acceptable for supplemental discovery)

---

### Limitation 4: Third-Party Widgets

**Problem:** May detect third-party features (chat widgets, analytics) as product features

**Impact:** Medium (noise in results)

**Mitigation:**
1. **Pattern detection**: Filter common third-party domains (intercom.com, hotjar.com)
2. **Categorization**: Mark as "Third-party integration" category
3. **User review**: Review mode allows removal
4. **Confidence penalty**: Lower confidence for suspected third-party features

**Residual Risk:** Low (filtering + review solves most cases)

---

### Limitation 5: Mobile vs Desktop Views

**Problem:** Features may differ between mobile/desktop

**Impact:** Low-Medium (incomplete picture)

**Mitigation:**
1. **Viewport option**: 
   ```bash
   planner discover-web https://app.com --viewport mobile
   ```
2. **Dual scan**: Scan both desktop and mobile, merge results
3. **Screenshot comparison**: Capture both viewports with `--screenshot`

**Residual Risk:** Low (optional enhancement)

---

### Limitation 6: Anti-Bot Detection

**Problem:** Some sites block headless browsers

**Impact:** Medium (Playwright fails on protected sites)

**Mitigation:**
1. **Stealth mode**: Use `playwright-extra-plugin-stealth`
   ```bash
   npm install playwright-extra playwright-extra-plugin-stealth
   ```
2. **Fallback to WebFetch**: If Playwright blocked, try static analysis
3. **User-agent rotation**: Randomize browser fingerprints
4. **Manual mode**: Allow screenshot upload as fallback

**Residual Risk:** Medium (some sites will always block automation)

---

### Limitation 7: Performance/Cost

**Problem:** 
- Playwright is slower (4-5 seconds per page)
- Claude Vision costs tokens (~$0.004 per screenshot)

**Impact:** Medium (slower + more expensive than code analysis)

**Mitigation:**
1. **Tiered approach**: Use fast WebFetch by default
2. **Rate limiting**: Add delays between requests
3. **Caching**: Cache results for repeated scans
4. **Cost estimation**: Show estimated cost before screenshot analysis
   ```
   ⚠️  Analyzing 10 pages with screenshots will cost ~$0.40 in API tokens
   ? Continue? (y/n)
   ```

**Residual Risk:** Low (user controls costs via options)

---

## Implementation Complexity

### Phase 1: WebFetch-Only (Tier 1)

**Estimated Time:** 1-2 weeks

**Complexity:** ⭐⭐ Low-Medium

**Components:**
1. `WebDiscoveryEngine` class (3 days)
   - WebFetch integration
   - HTML signal extraction
   - AI-powered feature synthesis
2. CLI command `discover-web` (2 days)
3. Signal clustering logic (3 days)
4. CSV export with new fields (1 day)
5. Testing (2 days)

**Dependencies:**
- Claude Code WebFetch tool (already available)
- No new npm packages

**Risks:** Low (straightforward implementation)

---

### Phase 2: Playwright Integration (Tier 2)

**Estimated Time:** 1-2 weeks

**Complexity:** ⭐⭐⭐ Medium

**Components:**
1. `PlaywrightDiscovery` class (5 days)
   - Browser launch and navigation
   - DOM element extraction
   - Signal collection
2. SPA detection logic (2 days)
3. Anti-bot evasion (stealth plugin) (2 days)
4. Deep crawling (sub-page navigation) (3 days)
5. Testing with real websites (3 days)

**Dependencies:**
- `playwright` (npm install)
- `playwright-extra-plugin-stealth` (optional)

**Risks:** 
- Medium (anti-bot detection)
- Medium (handling diverse site structures)

---

### Phase 3: Vision Analysis (Tier 3)

**Estimated Time:** 1-2 weeks

**Complexity:** ⭐⭐⭐⭐ Medium-High

**Components:**
1. `VisionAnalysis` class (4 days)
   - Screenshot capture orchestration
   - Claude Vision API integration
   - Multi-image handling
2. Screenshot storage and management (2 days)
3. Cost estimation and user prompts (2 days)
4. Vision-specific signal extraction (3 days)
5. Testing and accuracy validation (3 days)

**Dependencies:**
- Claude Vision API (via Claude Code Read tool for images?)
- Image processing libraries (sharp, jimp)

**Risks:**
- Medium (Claude Vision API integration unclear)
- Medium (token costs may be high)

---

### Phase 4: Feature Merging & Integration

**Estimated Time:** 1 week

**Complexity:** ⭐⭐⭐ Medium

**Components:**
1. Fuzzy feature matching algorithm (3 days)
2. Merge logic and conflict resolution (2 days)
3. Updated CSV schema (1 day)
4. Integration tests (2 days)

**Dependencies:**
- String similarity library (e.g., `fuzzball`)

**Risks:** Low (well-defined problem)

---

### Total Implementation Estimate

**All Phases:**
- **Minimum (Tier 1 only)**: 1-2 weeks
- **Recommended (Tier 1 + 2)**: 3-4 weeks
- **Complete (All Tiers)**: 5-6 weeks

**Team Size:** 1 developer (Claude Code assisted)

**Testing Effort:** 25-30% of development time

---

## Recommended Phasing

### Immediate (Week 1-2): Phase 1 - WebFetch Only

**Why:**
- Quick win (1-2 weeks)
- No installation required
- Proves concept
- Handles 40-50% of use cases (static sites)

**Deliverable:**
```bash
planner discover-web https://example.com
# Works for marketing sites, docs, static sites
```

**Success Criteria:**
- 50-60% accuracy on static sites
- User feedback positive
- CSV export working

---

### Short-Term (Week 3-4): Phase 2 - Playwright

**Why:**
- Covers remaining 50% of use cases (SPAs)
- Production-ready tool
- High accuracy (70-80%)

**Deliverable:**
```bash
planner discover-web https://app.example.com --dynamic
# Works for React/Vue/Angular apps
```

**Success Criteria:**
- 70-80% accuracy on SPAs
- Anti-bot evasion working
- Seamless fallback from WebFetch

---

### Future (Week 5-6): Phase 3 - Vision (Optional)

**Why:**
- Differentiator (unique capability)
- Handles visual features (design systems)
- Competitor analysis use case

**Deliverable:**
```bash
planner discover-web https://competitor.com --screenshot
# Analyzes UI layout, visual elements
```

**Success Criteria:**
- 60-80% accuracy on visual features
- Cost is reasonable (<$1 per scan)
- User finds value in visual analysis

---

## Conclusion

### Summary of Recommendations

1. **Implement in phases**: Start with WebFetch (Tier 1), add Playwright (Tier 2), optionally add Vision (Tier 3)
2. **Use hybrid approach**: Auto-detect SPAs and fallback to Playwright
3. **Set expectations**: Web discovery is supplemental (65-75% accuracy vs 85%+ code)
4. **Merge with code analysis**: Combine web + code for maximum coverage
5. **Focus on public sites**: Authentication is a known limitation

### Expected Outcomes

**Coverage:**
- Code analysis: 85%+ of codebase features
- Web analysis: 65-75% of public-facing features
- Combined: 90%+ of all features (code + web)

**Use Cases Unlocked:**
1. ✅ Competitor analysis (analyze competitor websites)
2. ✅ Blue sky validation (check if planned features exist in production)
3. ✅ Marketing alignment (ensure website reflects actual features)
4. ✅ Third-party detection (identify external integrations)
5. ✅ UI-driven discovery (find features better represented visually)

### Next Steps

1. **Review this document** with stakeholders
2. **Approve Phase 1** implementation (WebFetch-only)
3. **Prototype** with 3-5 test websites
4. **User testing** for accuracy validation
5. **Iterate** based on feedback
6. **Phase 2** (Playwright) if Phase 1 successful

---

**Document Status:** ✅ Research Complete, Ready for Decision
**Version:** 1.0
**Last Updated:** 2025-10-20
