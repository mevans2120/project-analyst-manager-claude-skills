# Web & App Viewing for Project Planner

**Status**: Design Proposal
**Date**: 2025-10-20
**Purpose**: Enable Project Planner to discover features by viewing live websites and applications

---

## Executive Summary

Adding web/app viewing capabilities to the Project Planner will enable:
- **Feature discovery from live products** (not just code)
- **Competitor analysis** for blue sky projects
- **Validation** that planned features exist in production
- **User-perspective understanding** (UI-driven discovery)

**Recommended Approach**: Multi-tier strategy using WebFetch (simple), Playwright (advanced), and AI analysis.

---

## Use Cases

### 1. Existing Product Analysis
```bash
planner discover-web https://myapp.com --with-login
# Discovers: User dashboard, settings page, payment flow, notifications
# Confidence: 75-90% (based on UI visibility)
```

### 2. Competitor Research
```bash
planner analyze-competitor https://competitor.com
# Compares features to your features.csv
# Identifies gaps: "They have live chat, we don't"
```

### 3. Blue Sky Planning
```bash
planner discover-web https://inspirational-app.com
# Seeds initial feature list for new project
# Output: 23 features discovered → edit → add to features.csv
```

### 4. Feature Validation
```bash
planner verify-production https://staging.myapp.com
# Checks if features marked "implemented" are actually live
# Updates implementation_confidence scores
```

---

## Technical Approaches

### Tier 1: WebFetch (Simple, Fast)
**Capabilities:**
- Fetch static HTML
- AI analysis of page structure
- Extract navigation, forms, sections
- Works for: Static sites, marketing pages, docs

**Limitations:**
- No JavaScript execution
- Can't handle SPAs (React, Vue)
- Can't click/navigate
- No authentication support

**Example:**
```typescript
const html = await webFetch('https://example.com', 'Extract main navigation items');
// AI returns: ["Home", "Products", "Pricing", "About", "Login"]
```

### Tier 2: Playwright (Advanced, Comprehensive)
**Capabilities:**
- Full JavaScript execution
- Navigate multi-page apps
- Handle authentication (login flows)
- Take screenshots
- Monitor network requests (API calls)
- Works for: SPAs, dynamic apps, authenticated areas

**Limitations:**
- Slower than WebFetch
- Requires installation (`npm install playwright`)
- More complex setup

**Example:**
```typescript
const browser = await playwright.chromium.launch();
const page = await browser.newPage();
await page.goto('https://app.example.com');
await page.fill('#email', 'test@example.com');
await page.fill('#password', 'password');
await page.click('button[type="submit"]');
// Now authenticated, can explore features
```

### Tier 3: Screenshot Analysis (AI-Powered)
**Capabilities:**
- Claude can analyze images
- Understand UI components visually
- Identify forms, buttons, layouts
- Extract text from screenshots

**Limitations:**
- Static snapshot (no interaction)
- Requires screenshot generation

**Example:**
```typescript
await page.screenshot({ path: 'dashboard.png' });
// Claude analyzes: "Dashboard with 4 metrics cards, navigation sidebar,
// data table showing orders, export button, date range picker"
```

---

## Recommended Strategy: Hybrid Approach

### Phase 1: WebFetch + AI Analysis (Week 1)
Start with simple static analysis:
1. Fetch homepage HTML
2. AI extracts navigation structure
3. Fetch each linked page
4. AI identifies features from page content
5. Output to features.csv

**Pros**: Fast to implement, no dependencies
**Cons**: Limited to static content
**Accuracy**: 60-70% for static sites

### Phase 2: Playwright Integration (Week 2-3)
Add dynamic app support:
1. Install Playwright via package.json
2. Navigate SPA routes
3. Handle authentication
4. Take screenshots of key pages
5. Monitor API calls to identify backend features

**Pros**: Handles modern apps, high accuracy
**Cons**: Slower, requires setup
**Accuracy**: 80-90% for SPAs

### Phase 3: AI Screenshot Analysis (Week 4)
Enhance with visual understanding:
1. Capture screenshots during navigation
2. Claude analyzes UI components
3. Identify interactive elements (forms, buttons)
4. Extract feature purpose from visual context

**Pros**: Best for complex UIs
**Cons**: Token-intensive
**Accuracy**: 85-95% with human review

---

## Feature Discovery Methodology

### Signals → Features Mapping

| Signal | Feature Type | Example |
|--------|--------------|---------|
| Navigation menu item | Core feature | "Products" → Product catalog |
| Form with submit | Data entry feature | Contact form, registration |
| Data table/list | Data management | Order history, user list |
| Dashboard widgets | Analytics feature | Metrics, charts, KPIs |
| Modal/dialog | Secondary feature | Settings, confirmations |
| API endpoint (network) | Backend feature | `/api/orders` → Order management |
| Route pattern | Page/screen | `/dashboard` → Dashboard |
| Button with action | User action | "Export CSV", "Delete account" |

### AI Prompts for Feature Extraction

**From HTML:**
```
Analyze this HTML and identify distinct user-facing features.
For each feature, provide:
1. Feature name (2-5 words)
2. Description (1-2 sentences, user perspective)
3. Evidence (HTML elements that indicate this feature)
4. Confidence (0-100%)

Focus on: navigation items, forms, major sections, interactive elements.
```

**From Screenshot:**
```
Analyze this application screenshot and identify user features visible in the UI.
For each feature, describe:
1. What the user can do
2. Where it appears on screen
3. Associated UI components (buttons, forms, etc.)

Provide moderately verbose descriptions (20-60 words each).
```

---

## CLI Design

### New Commands

```bash
# Discover features from website
planner discover-web <url> [options]
  --with-login              # Launch interactive browser for login
  --screenshots             # Capture screenshots for AI analysis
  --depth <number>          # How many levels deep to crawl (default: 2)
  --exclude <pattern>       # Skip URLs matching pattern
  --output <file>           # Output file (default: web-features.csv)

# Compare with competitor
planner analyze-competitor <url> [options]
  --compare-with <file>     # Your features.csv to compare against
  --output <file>           # Gap analysis report

# Verify production deployment
planner verify-production <url> [options]
  --features <file>         # features.csv to verify
  --update-confidence       # Update implementation_confidence scores
```

### Example Workflows

**Simple static site:**
```bash
planner discover-web https://example.com
# Output: Found 12 features
# - Home page with hero section
# - Product catalog with search
# - Contact form with email/phone
# ...
# Saved to: web-features.csv
```

**SPA with authentication:**
```bash
planner discover-web https://app.example.com --with-login --screenshots
# [Browser opens]
# User logs in manually
# [Planner navigates and captures]
# Output: Found 23 features across 8 pages
# Screenshots saved to: .planner/screenshots/
# Saved to: web-features.csv
```

**Competitor analysis:**
```bash
planner analyze-competitor https://competitor.com --compare-with features.csv
# Output: Gap Analysis Report
# ✅ You have 18 features they have
# ❌ They have 5 features you don't:
#    - Live chat support
#    - Mobile app
#    - Advanced analytics dashboard
#    - Team collaboration
#    - API access
# Saved to: competitor-gap-analysis.md
```

---

## CSV Schema Integration

### Web-discovered features in features.csv

```csv
id,name,description,status,priority,category,source,source_url,discovery_method,confidence
feat-web-001,User dashboard,"Central hub showing account overview with recent activity, key metrics, and quick actions",observed,P1,Core,web,https://app.example.com/dashboard,playwright,85
feat-web-002,Order management,"View, filter, and export order history. Includes order details, status tracking, and invoice download",observed,P0,Commerce,web,https://app.example.com/orders,playwright,90
```

**New fields:**
- `source`: "web", "code", "manual", "competitor"
- `source_url`: URL where feature was observed
- `discovery_method`: "webfetch", "playwright", "screenshot"
- `status`: "observed" (for web-discovered features vs "implemented" for code)

### Merging Web + Code Discoveries

When a feature is found in BOTH code and web:
```csv
feat-001,User authentication,"Login with email/password...",implemented,P0,Auth,merged,https://app.example.com/login,code+web,95
```

Confidence increases when feature exists in both places!

---

## Implementation Plan

### Phase 1: WebFetch Integration (1 week)
**Files to create:**
- `src/web/webFetcher.ts` - WebFetch wrapper
- `src/web/htmlAnalyzer.ts` - AI-powered HTML analysis
- `src/web/featureExtractor.ts` - Convert signals → features
- `src/cli/discoverWeb.ts` - CLI command

**Tasks:**
1. Implement basic URL fetching
2. AI prompt for navigation extraction
3. Recursive page crawling (depth-limited)
4. Convert findings to CSV format
5. Add tests (10+ test cases)

**Dependencies:**
- None (uses built-in WebFetch)

**Deliverable:**
- `planner discover-web` works for static sites
- Outputs web-features.csv
- 60-70% accuracy

### Phase 2: Playwright Integration (2-3 weeks)
**Files to create:**
- `src/web/playwrightDriver.ts` - Browser automation
- `src/web/spaNavigator.ts` - SPA route discovery
- `src/web/authHandler.ts` - Login flow support
- `src/web/networkMonitor.ts` - API call tracking

**Tasks:**
1. Add playwright dependency
2. Implement browser launch/navigation
3. Build route discovery for SPAs
4. Add screenshot capture
5. Interactive login support
6. Network request monitoring
7. Add tests (15+ test cases)

**Dependencies:**
- `playwright` (npm install)
- Optional: `playwright-extra` (stealth plugin)

**Deliverable:**
- `planner discover-web --with-login` works for SPAs
- Handles authentication
- 80-90% accuracy

### Phase 3: Screenshot Analysis (1 week)
**Files to create:**
- `src/web/screenshotAnalyzer.ts` - AI image analysis
- `src/web/visualFeatureDetector.ts` - UI component recognition

**Tasks:**
1. Integrate screenshot capture with Playwright
2. AI prompts for image analysis
3. Visual feature extraction
4. Combine with HTML analysis for higher confidence
5. Add tests (10+ test cases)

**Dependencies:**
- None (Claude can analyze images natively)

**Deliverable:**
- Enhanced accuracy with visual understanding
- 85-95% accuracy with human review

---

## Technical Challenges & Solutions

### Challenge 1: Authentication Walls
**Problem**: Can't access features behind login
**Solution**: Interactive login mode (user logs in, then automation continues)
```bash
planner discover-web https://app.example.com --with-login
# Opens browser, waits for manual login, then continues
```

### Challenge 2: Dynamic/SPA Content
**Problem**: WebFetch can't execute JavaScript
**Solution**: Playwright for SPAs (Phase 2)
```typescript
await page.waitForSelector('[data-testid="dashboard"]');
// Wait for React/Vue to render
```

### Challenge 3: Rate Limiting / Bot Detection
**Problem**: Sites block automated scraping
**Solution**: Playwright stealth plugin + respectful delays
```typescript
await page.waitForTimeout(1000 + Math.random() * 2000); // Random delays
```

### Challenge 4: Accuracy / False Positives
**Problem**: AI might hallucinate features
**Solution**: Confidence scoring + human review workflow
```bash
planner discover-web https://example.com --review
# Shows each discovered feature for user approval
```

### Challenge 5: Large Sites (Too Many Pages)
**Problem**: Crawling 1000+ pages is slow
**Solution**: Depth limiting + smart navigation
```bash
planner discover-web https://example.com --depth 2
# Only crawl 2 levels deep
```

---

## Output Examples

### Web Features CSV
```csv
id,name,description,status,priority,category,source,source_url,discovery_method,confidence
feat-web-001,Homepage hero,Landing page with value proposition and call-to-action button directing users to sign up or learn more,observed,P2,Marketing,web,https://example.com,webfetch,75
feat-web-002,Product catalog,"Browse products with search, filters by category/price, and sorting options. Each product shows image, title, price, and 'Add to Cart' button",observed,P0,Commerce,web,https://example.com/products,playwright,90
feat-web-003,Shopping cart,"View cart contents, update quantities, remove items, apply discount codes, and proceed to checkout. Shows subtotal and estimated total",observed,P0,Commerce,web,https://example.com/cart,playwright,95
feat-web-004,User account,View and edit profile information including name, email, password, and notification preferences,observed,P1,Account,web,https://example.com/account,playwright,85
```

### Gap Analysis Report (Markdown)
```markdown
# Competitor Gap Analysis

**Your Product**: MyApp (features.csv)
**Competitor**: CompetitorApp (https://competitor.com)
**Analysis Date**: 2025-10-20

## Summary

- ✅ **18 features** you both have
- ⭐ **7 features** unique to you
- ❌ **5 features** they have that you don't
- 📊 **Feature parity**: 78%

## Features They Have (That You Don't)

### 1. Live Chat Support
**Description**: Real-time customer support chat widget available on all pages. Supports file uploads and message history.
**URL**: https://competitor.com/support
**Priority Recommendation**: P1 (high user demand)

### 2. Mobile Apps
**Description**: Native iOS and Android apps with push notifications and offline mode.
**URL**: https://competitor.com/mobile
**Priority Recommendation**: P0 (critical for mobile users)

[... more features ...]

## Features Unique to You

### 1. Advanced Analytics
**Description**: Detailed analytics dashboard with custom reports and data export
**Your Advantage**: They only have basic metrics

[... more features ...]

## Recommendations

1. **Prioritize mobile apps** (P0) - 65% of users are mobile
2. **Add live chat** (P1) - Reduces support ticket volume
3. **Consider API access** (P2) - Enables integrations
```

---

## Configuration

### .planner.config.json
```json
{
  "web": {
    "defaultDepth": 2,
    "maxPages": 50,
    "timeout": 30000,
    "userAgent": "ProjectPlanner/1.0",
    "headless": true,
    "screenshots": {
      "enabled": true,
      "directory": ".planner/screenshots"
    },
    "excludePatterns": [
      "**/privacy",
      "**/terms",
      "**/legal/**"
    ],
    "authentication": {
      "method": "interactive",
      "timeout": 300000
    }
  }
}
```

---

## Success Metrics

### Phase 1 (WebFetch)
- ✅ Discovers 10+ features from static site in <30 seconds
- ✅ 60%+ accuracy (validated against manual review)
- ✅ Outputs valid CSV

### Phase 2 (Playwright)
- ✅ Handles SPA navigation
- ✅ Supports authentication flow
- ✅ 80%+ accuracy
- ✅ Captures screenshots

### Phase 3 (Screenshot Analysis)
- ✅ AI analyzes UI from screenshots
- ✅ 85%+ accuracy with visual context
- ✅ Identifies interactive elements (forms, buttons)

---

## Timeline & Effort

| Phase | Duration | Developer Days | Priority |
|-------|----------|----------------|----------|
| Phase 1: WebFetch | 1 week | 3-5 days | High |
| Phase 2: Playwright | 2-3 weeks | 8-12 days | High |
| Phase 3: Screenshots | 1 week | 3-5 days | Medium |
| **Total** | **4-5 weeks** | **14-22 days** | - |

Can be parallelized with core Project Planner development (Phases 1-3 from main roadmap).

---

## Risk Assessment

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Sites block automation | High | Medium | Stealth plugin, user-agent rotation, delays |
| Low accuracy | High | Low | Confidence scoring, human review, visual analysis |
| Authentication complexity | Medium | High | Interactive mode (user logs in manually) |
| Performance (slow crawling) | Medium | Medium | Depth limiting, parallel requests, caching |
| Legal (scraping) | Low | Low | Respect robots.txt, focus on own products |

---

## Questions & Answers

**Q: Can this analyze mobile apps?**
A: Not directly. Requires Appium for mobile automation (future enhancement).

**Q: Does it violate terms of service?**
A: Use responsibly. Best for your own products or competitor research (public info). Respect robots.txt.

**Q: How accurate is it?**
A: 60-70% (Phase 1), 80-90% (Phase 2), 85-95% (Phase 3 with review).

**Q: Can it handle authentication?**
A: Yes, via interactive mode (user logs in, then automation continues).

**Q: How fast is it?**
A: WebFetch: ~2-5 seconds per page. Playwright: ~5-10 seconds per page.

**Q: Does it work for SPAs?**
A: Phase 2 (Playwright) handles SPAs. Phase 1 (WebFetch) does not.

---

## Next Steps

### For Approval:
1. Review this design
2. Confirm priority (should this be in Project Planner v1 or v2?)
3. Approve implementation approach

### For Implementation:
1. Create `src/web/` directory
2. Start with Phase 1 (WebFetch)
3. Add tests alongside implementation
4. Document in QUICK-REFERENCE.md
5. Add examples to PROJECT-PLANNER-SUMMARY.md

---

## Conclusion

Adding web/app viewing to Project Planner is **technically feasible** and **strategically valuable**. The hybrid approach (WebFetch → Playwright → Screenshots) balances simplicity, power, and accuracy.

**Recommendation**: Implement Phase 1 (WebFetch) in Project Planner v1.0, add Phases 2-3 in v1.1 based on user demand.

This capability will differentiate Project Planner from competitors and enable feature discovery without requiring codebase access - crucial for competitor analysis and blue sky planning.
